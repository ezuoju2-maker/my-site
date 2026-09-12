import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { API_BASE_URL } from "../lib/api";
import { getBase } from "../lib/url";

type Platform = { code: string; name: string };

type QrSession = {
  token: string;
  id: string;
  platformCode: string;
  platformName: string;
  expiresAt: string;
  status: string;
};

type AccountInfo = {
  id: string;
  platform: string;
  nickname: string | null;
  externalId: string;
  authorizationCode: string;
  expiresAt: string;
};

type MyAccount = {
  grantId: string;
  grantStatus: string;
  grantExpiresAt: string;
  accountId: string;
  platform: string;
  nickname: string | null;
  externalId: string;
  accountStatus: string;
  accountExpiresAt: string;
};

type View = "picker" | "qr" | "accounts";

export default function GrabSystem() {
  const [view, setView] = useState<View>("picker");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [ttlDays, setTtlDays] = useState(1);
  const [session, setSession] = useState<QrSession | null>(null);
  const [qrSvg, setQrSvg] = useState("");
  const [pollStatus, setPollStatus] = useState("");
  const [result, setResult] = useState<AccountInfo | null>(null);
  const [myAccounts, setMyAccounts] = useState<MyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollTimer = useRef<number | null>(null);

  // 加载平台列表
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/grab/platforms`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPlatforms(d.platforms); })
      .catch(() => {});
  }, []);

  // 加载我的账号
  const loadMyAccounts = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/accounts`, { credentials: "include" });
      const d = await r.json();
      if (d.ok) setMyAccounts(d.accounts);
    } catch {}
  }, []);

  useEffect(() => {
    if (view === "accounts") void loadMyAccounts();
  }, [view, loadMyAccounts]);

  // 清理轮询
  useEffect(() => {
    return () => { if (pollTimer.current) window.clearInterval(pollTimer.current); };
  }, []);

  async function createQr() {
    if (!selectedPlatform) return;
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/qr/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selectedPlatform.code, ttlDays }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setError(d.error || "生成失败"); return; }

      const scanUrl = `${API_BASE_URL}${d.scanUrl}`;
      const svg = await QRCode.toString(scanUrl, { type: "svg", margin: 1, width: 260, errorCorrectionLevel: "M" });
      setQrSvg(svg);
      setSession({
        token: d.token, id: d.id,
        platformCode: selectedPlatform.code,
        platformName: selectedPlatform.name,
        expiresAt: d.expiresAt,
        status: "waiting",
      });
      setPollStatus("等待抓号层提交结果…");
      setView("qr");
      startPolling(d.token);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }

  function startPolling(token: string) {
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    pollTimer.current = window.setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/grab/qr/status?token=${encodeURIComponent(token)}`, { credentials: "include" });
        const d = await r.json();
        if (!d.ok || !d.qr) return;

        if (d.qr.status === "consumed" && d.account) {
          setResult(d.account);
          setPollStatus("✓ 抓号成功");
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        } else if (d.qr.status === "expired") {
          setPollStatus("二维码已过期");
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        }
      } catch {}
    }, 3000);
  }

  async function useAccount(accountId: string) {
    setError("");
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/account/use`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { alert(d.error || "上号失败"); return; }
      alert(
        "上号成功\n\n" +
        "平台：" + d.account.platform + "\n" +
        "账号：" + (d.account.nickname || d.account.externalId) + "\n" +
        "凭证：\n" + d.credential
      );
    } catch { alert("网络错误"); }
  }

  function goBack() {
    if (view === "picker") { window.location.href = getBase() + "dashboard/"; return; }
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    setView("picker");
    setSession(null); setQrSvg(""); setResult(null);
  }

  // ============ 视图：选平台 ============
  if (view === "picker") {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header title="抓号系统" onBack={goBack} />
        <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-neutral-700">选择平台</h2>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((p) => (
                <button key={p.code} type="button" onClick={() => setSelectedPlatform(p)}
                  className={"rounded-xl border p-3 text-center text-sm " + (selectedPlatform?.code === p.code ? "border-neutral-900 bg-neutral-50 font-medium" : "border-neutral-200 bg-white")}>
                  {p.name}
                </button>
              ))}
              {platforms.length === 0 && <p className="col-span-2 text-sm text-neutral-400">加载中…</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-neutral-700">抓号时效</h2>
            <div className="flex gap-2">
              {[1, 7, 30].map((d) => (
                <button key={d} type="button" onClick={() => setTtlDays(d)}
                  className={"flex-1 rounded-xl border p-3 text-sm " + (ttlDays === d ? "border-neutral-900 bg-neutral-50 font-medium" : "border-neutral-200 bg-white")}>
                  {d} 天
                </button>
              ))}
            </div>
          </section>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="button" onClick={createQr} disabled={!selectedPlatform || loading}
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-medium text-white disabled:opacity-50">
            {loading ? "生成中…" : "生成二维码"}
          </button>

          <button type="button" onClick={() => setView("accounts")}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white text-base font-medium text-neutral-700">
            我的账号
          </button>
        </main>
      </div>
    );
  }

  // ============ 视图：二维码 / 结果 ============
  if (view === "qr" && session) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header title={session.platformName + " · 抓号"} onBack={goBack} />
        <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
          {!result ? (
            <>
              <section className="rounded-2xl border border-neutral-100 bg-white p-6 text-center">
                <p className="mb-4 text-sm text-neutral-500">请将二维码或 token 发送给抓号层</p>
                {qrSvg && (
                  <div className="mx-auto flex justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                )}
                <p className="mt-4 text-xs text-neutral-400">有效期至：{session.expiresAt.replace("T", " ").slice(0, 19)}</p>
              </section>

              <section className="rounded-2xl border border-neutral-100 bg-white p-5">
                <p className="mb-2 text-xs font-medium text-neutral-500">Token（可复制给抓号层）</p>
                <div className="flex gap-2">
                  <input readOnly value={session.token}
                    className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={() => navigator.clipboard.writeText(session.token)}
                    className="rounded-lg border border-neutral-200 bg-white px-3 text-sm">复制</button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-100 bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span className="text-sm text-neutral-600">{pollStatus}</span>
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-green-200 bg-green-50 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-sm">✓</span>
                <span className="font-medium text-green-900">抓号成功</span>
              </div>
              <div className="space-y-1.5 text-sm text-green-800">
                <p>平台：{session.platformName}</p>
                <p>昵称：{result.nickname || "—"}</p>
                <p>账号 ID：{result.externalId}</p>
                <p>授权编号：<code className="rounded bg-white px-1.5 py-0.5 font-mono">{result.authorizationCode}</code></p>
                <p>有效期：{result.expiresAt.replace("T", " ").slice(0, 19)}</p>
              </div>
              <button type="button" onClick={() => setView("accounts")}
                className="mt-2 h-11 w-full rounded-xl bg-green-700 text-sm font-medium text-white">
                查看我的账号
              </button>
            </section>
          )}
        </main>
      </div>
    );
  }

  // ============ 视图：我的账号 ============
  if (view === "accounts") {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header title="我的账号" onBack={goBack} />
        <main className="mx-auto max-w-3xl space-y-3 px-5 py-6">
          {myAccounts.length === 0 ? (
            <p className="rounded-2xl border border-neutral-100 bg-white p-5 text-center text-sm text-neutral-500">
              暂无可用账号
            </p>
          ) : (
            myAccounts.map((a) => (
              <div key={a.grantId} className="rounded-2xl border border-neutral-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-700">
                    {(a.nickname || a.externalId).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">{a.nickname || a.externalId}</div>
                    <div className="text-xs text-neutral-500">{a.platform} · {a.externalId}</div>
                  </div>
                  <button type="button" onClick={() => useAccount(a.accountId)}
                    className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white">
                    上号
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                  <span>权限到期：{a.grantExpiresAt.replace("T", " ").slice(0, 10)}</span>
                  <span className={a.accountStatus === "active" ? "text-green-600" : "text-red-500"}>
                    {a.accountStatus === "active" ? "正常" : a.accountStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    );
  }

  return null;
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
        <button type="button" onClick={onBack}
          className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      </div>
    </header>
  );
}
