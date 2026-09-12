import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE_URL } from "../lib/api";
import { getBase } from "../lib/url";

type Platform = { code: string; name: string; brand: string; iconSlug: string };
type AccountInfo = { id: string; platform: string; nickname: string | null; externalId: string; authorizationCode: string; deviceId: string | null; expiresAt: string };
type QrSession = {
  id: string;
  platform: string;
  platformName: string;
  platformBrand: string;
  platformIcon: string;
  status: "waiting" | "consumed" | "expired";
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  token: string | null;
  account: { id: string; nickname: string | null; externalId: string | null } | null;
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

function isLightHex(hex: string): boolean {
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function PlatformIcon({ brand, iconSlug, size = 48 }: { brand: string; iconSlug: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const base = getBase();
  const bg = "#" + brand;
  const light = isLightHex(brand);
  if (failed) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-full font-semibold"
        style={{ width: size, height: size, background: bg, color: light ? "#171717" : "#fff", fontSize: Math.round(size * 0.42) }}>?</span>
    );
  }
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ width: size, height: size, background: bg }}>
      <img src={base + "icons/" + iconSlug + ".svg"} alt="" width={Math.round(size * 0.6)} height={Math.round(size * 0.6)}
        loading="lazy" onError={() => setFailed(true)}
        style={{ filter: light ? "brightness(0)" : "brightness(0) invert(1)" }} />
    </span>
  );
}

function statusLabel(status: string): { text: string; cls: string } {
  if (status === "waiting") return { text: "未使用", cls: "text-green-600" };
  if (status === "consumed") return { text: "已使用", cls: "text-neutral-400" };
  return { text: "已过期", cls: "text-red-500" };
}

function fmtTime(iso: string): string {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

export default function GrabSystem() {
  const [view, setView] = useState<View>("picker");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [history, setHistory] = useState<QrSession[]>([]);
  const [currentQr, setCurrentQr] = useState<QrSession | null>(null);
  const [myAccounts, setMyAccounts] = useState<MyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/grab/platforms`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ ok?: boolean; platforms?: Platform[] }>)
      .then((d) => { if (d.ok && d.platforms) setPlatforms(d.platforms); })
      .catch(() => {});
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/qr-sessions`, { credentials: "include" });
      const d = (await r.json()) as { ok?: boolean; sessions?: QrSession[] };
      if (d.ok && d.sessions) setHistory(d.sessions);
    } catch {}
  }, []);

  useEffect(() => { if (view === "picker") void loadHistory(); }, [view, loadHistory]);

  const loadMyAccounts = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/me/accounts`, { credentials: "include" });
      const d = (await r.json()) as { ok?: boolean; accounts?: MyAccount[] };
      if (d.ok && d.accounts) setMyAccounts(d.accounts);
    } catch {}
  }, []);

  useEffect(() => { if (view === "accounts") void loadMyAccounts(); }, [view, loadMyAccounts]);

  useEffect(() => () => { if (pollTimer.current) window.clearInterval(pollTimer.current); }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function copyText(text: string, label = "已复制") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("复制失败");
    }
  }

  async function generateQr(platform: Platform) {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/qr/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.code, ttlDays: 30 }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string; token?: string; id?: string; expiresAt?: string };
      if (!r.ok || !d.ok || !d.token) { setError(d.error || "生成失败"); return; }
      const session: QrSession = {
        id: d.id || "",
        platform: platform.code,
        platformName: platform.name,
        platformBrand: platform.brand,
        platformIcon: platform.iconSlug,
        status: "waiting",
        createdAt: new Date().toISOString(),
        expiresAt: d.expiresAt || "",
        consumedAt: null,
        token: d.token,
        account: null,
      };
      setCurrentQr(session);
      setView("qr");
      startPolling(session);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }

  function startPolling(session: QrSession) {
    if (!session.token) return;
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    const token = session.token;
    pollTimer.current = window.setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/grab/qr/status?token=${encodeURIComponent(token)}`, { credentials: "include" });
        const d = (await r.json()) as { ok?: boolean; qr?: { status?: string }; account?: AccountInfo };
        if (!d.ok || !d.qr) return;
        if (d.qr.status === "consumed" && d.account) {
          setCurrentQr((prev) => prev ? { ...prev, status: "consumed", account: { id: d.account!.id, nickname: d.account!.nickname, externalId: d.account!.externalId } } : prev);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        } else if (d.qr.status === "expired") {
          setCurrentQr((prev) => prev ? { ...prev, status: "expired" } : prev);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        }
      } catch {}
    }, 3000);
  }

  function openHistoryItem(s: QrSession) {
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    setCurrentQr(s);
    setView("qr");
    if (s.status === "waiting" && s.token) startPolling(s);
  }

  async function useAccount(accountId: string) {
    try {
      const r = await fetch(`${API_BASE_URL}/api/grab/account/use`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string; credential?: string };
      if (!r.ok || !d.ok) { showToast(d.error || "上号失败"); return; }
      showToast("上号成功");
      if (d.credential) window.alert("上号凭证：\n\n" + d.credential);
    } catch { showToast("网络错误"); }
  }

  function goBack() {
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    if (view === "picker") { window.location.href = getBase() + "dashboard/"; return; }
    setView("picker");
    setCurrentQr(null);
  }

  const platformMap = new Map(platforms.map((p) => [p.code, p]));

  // ==================== 视图：选平台 + 历史 ====================
  if (view === "picker") {
    return (
      <Shell title="抓号系统" onBack={goBack} toast={toast}>
        <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
          <section>
            <h2 className="mb-3 text-sm font-medium text-neutral-700">选择平台</h2>
            <div className="grid grid-cols-3 gap-4">
              {platforms.map((p) => (
                <button key={p.code} type="button" disabled={loading}
                  onClick={() => generateQr(p)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-3 active:bg-neutral-50 disabled:opacity-50">
                  <PlatformIcon brand={p.brand} iconSlug={p.iconSlug} size={52} />
                  <span className="truncate text-xs text-neutral-800">{p.name}</span>
                </button>
              ))}
              {platforms.length === 0 && <p className="col-span-3 text-center text-sm text-neutral-400">加载中…</p>}
            </div>
          </section>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <section className="rounded-2xl border border-neutral-100 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-neutral-900">二维码历史</h2>
            {history.length === 0 ? (
              <p className="py-2 text-center text-xs text-neutral-400">暂无记录</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {history.map((s) => {
                  const st = statusLabel(s.status);
                  return (
                    <button key={s.id} type="button" onClick={() => openHistoryItem(s)}
                      className="flex w-full items-center gap-3 py-3 text-left">
                      <PlatformIcon brand={s.platformBrand} iconSlug={s.platformIcon} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-neutral-900">{s.platformName}</div>
                        <div className="text-xs text-neutral-400">{fmtTime(s.createdAt)}</div>
                      </div>
                      <span className={"shrink-0 text-xs font-medium " + st.cls}>{st.text}</span>
                      <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <button type="button" onClick={() => setView("accounts")}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700">
            我的账号
          </button>
        </main>
      </Shell>
    );
  }

  // ==================== 视图：二维码 ====================
  if (view === "qr" && currentQr) {
    const scanUrl = currentQr.token ? `${API_BASE_URL}/scan/${currentQr.token}` : "";
    const acc = currentQr.account;
    const accInfo: AccountInfo | null = acc && acc.externalId
      ? { id: acc.id, platform: currentQr.platform, nickname: acc.nickname, externalId: acc.externalId, authorizationCode: "", deviceId: null, expiresAt: currentQr.expiresAt }
      : null;

    const copyAllText = accInfo
      ? [
          "平台：" + currentQr.platformName,
          "账号 ID：" + accInfo.externalId,
          "昵称：" + (accInfo.nickname || "—"),
          "授权编号：" + currentQr.id.slice(0, 8).toUpperCase(),
          "有效期至：" + fmtTime(currentQr.expiresAt),
        ].join("\n")
      : "";

    return (
      <Shell title={currentQr.platformName + " · 抓号"} onBack={goBack} toast={toast}>
        <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
          {currentQr.status === "waiting" && (
            <>
              <section className="rounded-2xl border border-neutral-100 bg-white p-6 text-center">
                <p className="mb-4 text-sm text-neutral-500">请将二维码或 Token 发送给抓号层</p>
                {scanUrl && (
                  <div className="mx-auto flex justify-center">
                    <QRCodeSVG value={scanUrl} size={240} level="M" />
                  </div>
                )}
                <p className="mt-4 text-xs text-neutral-400">有效期至：{fmtTime(currentQr.expiresAt)}</p>
              </section>

              <section className="rounded-2xl border border-neutral-100 bg-white p-5">
                <p className="mb-2 text-xs font-medium text-neutral-500">Token</p>
                <div className="flex gap-2">
                  <input readOnly value={currentQr.token || ""}
                    className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs" />
                  <button type="button" onClick={() => copyText(currentQr.token || "", "Token 已复制")}
                    className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 text-sm">复制</button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-100 bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span className="text-sm text-neutral-600">等待抓号层提交结果…</span>
                </div>
              </section>
            </>
          )}

          {currentQr.status === "consumed" && accInfo && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl text-white">✓</div>
                <h2 className="text-lg font-semibold text-green-900">抓号成功</h2>
              </div>

              <div className="rounded-2xl border border-neutral-100 bg-white p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                  <PlatformIcon brand={currentQr.platformBrand} iconSlug={currentQr.platformIcon} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-neutral-900">{currentQr.platformName}</div>
                    <div className="text-xs text-neutral-400">授权编号：{currentQr.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <Row label="平台" value={currentQr.platformName} />
                  <Row label="昵称" value={accInfo.nickname || "—"} />
                  <Row label="账号 ID" value={accInfo.externalId} />
                  <Row label="授权编号" value={currentQr.id.slice(0, 8).toUpperCase()} />
                  <Row label="有效期至" value={fmtTime(currentQr.expiresAt)} />
                </div>

                <button type="button" onClick={() => copyText(copyAllText, "信息已复制")}
                  className="mt-2 h-11 w-full rounded-xl border border-green-300 bg-green-50 text-sm font-medium text-green-800">
                  复制信息
                </button>
              </div>

              <button type="button" onClick={() => setView("accounts")}
                className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white">
                去上号系统
              </button>
            </section>
          )}

          {currentQr.status === "expired" && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl text-white">!</div>
              <h2 className="text-lg font-semibold text-red-800">二维码已过期</h2>
              <p className="mt-2 text-sm text-red-700">请返回重新生成二维码</p>
              <button type="button" onClick={goBack}
                className="mt-5 h-11 w-full rounded-xl bg-white text-sm font-medium text-neutral-700 border border-neutral-200">
                返回平台列表
              </button>
            </section>
          )}
        </main>
      </Shell>
    );
  }

  // ==================== 视图：我的账号 ====================
  if (view === "accounts") {
    return (
      <Shell title="上号系统" onBack={goBack} toast={toast}>
        <main className="mx-auto max-w-3xl space-y-3 px-5 py-6">
          {myAccounts.length === 0 ? (
            <p className="rounded-2xl border border-neutral-100 bg-white p-5 text-center text-sm text-neutral-500">
              暂无可用账号
            </p>
          ) : (
            myAccounts.map((a) => {
              const p = platformMap.get(a.platform);
              return (
                <div key={a.grantId} className="rounded-2xl border border-neutral-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon brand={p?.brand || "737373"} iconSlug={p?.iconSlug || a.platform} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-900">{a.nickname || a.externalId}</div>
                      <div className="text-xs text-neutral-500">{p?.name || a.platform} · {a.externalId}</div>
                    </div>
                    <button type="button" onClick={() => useAccount(a.accountId)}
                      className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white">
                      上号
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                    <span>权限到期：{fmtTime(a.grantExpiresAt).slice(0, 10)}</span>
                    <span className={a.accountStatus === "active" ? "text-green-600" : "text-red-500"}>
                      {a.accountStatus === "active" ? "正常" : a.accountStatus}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </Shell>
    );
  }

  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="min-w-0 flex-1 break-all text-right text-neutral-900">{value}</span>
    </div>
  );
}

function Shell({ title, onBack, toast, children }: { title: string; onBack: () => void; toast: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
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
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
