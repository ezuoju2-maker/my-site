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
type View = "picker" | "qr" | "accounts" | "more";

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

/* ============================================================
   平台官方 App 风格图标（圆角方形 + 品牌色 + 白色图形）
   ============================================================ */
function PlatformLogo({ code, size = 56 }: { code: string; size?: number }) {
  const base = getBase();
  const inner = Math.round(size * 0.62);
  const radius = Math.round(size * 0.24);

  // 小红书：品牌色底 + "小红书" 文字
  if (code === "xiaohongshu") {
    return (
      <span className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size, background: "#FF2442", borderRadius: radius }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: Math.round(size * 0.26), letterSpacing: "0.5px", fontFamily: "-apple-system, PingFang SC, Microsoft YaHei, sans-serif" }}>小红书</span>
      </span>
    );
  }

  // Google：白底 + 彩色 G（官方 4 色）
  if (code === "google") {
    return (
      <span className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size, background: "#fff", borderRadius: radius, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}>
        <svg viewBox="0 0 48 48" width={inner} height={inner} xmlns="http://www.w3.org/2000/svg">
          <path d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" fill="#FFC107" />
          <path d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00" />
          <path d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.6 2.5-5.3 0-9.7-3.4-11.3-8L6.1 32.3C9.5 38.8 16.2 44 24 44z" fill="#4CAF50" />
          <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.5l.1-.1 6.5 5.5c-.5.4 6.9-5 6.9-15.4 0-1.3-.1-2.3-.4-3.5z" fill="#1976D2" />
        </svg>
      </span>
    );
  }

  // 其他平台：品牌色底 + 白色 Simple Icons 官方图形
  const cfg: Record<string, { bg: string; icon: string }> = {
    douyin: { bg: "#000000", icon: "douyin" },
    bilibili: { bg: "#00A1D6", icon: "bilibili" },
    weibo: { bg: "#FDD35C", icon: "sinaweibo" },
    wechat: { bg: "#07C160", icon: "wechat" },
    qq: { bg: "#12B7F5", icon: "qq" },
    discord: { bg: "#5865F2", icon: "discord" },
  };

  const conf = cfg[code];

  // 未知平台 → 灰底三点
  if (!conf) {
    return (
      <span className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size, background: "#F0F0F0", borderRadius: radius }}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.42)} height={Math.round(size * 0.42)} fill="#9CA3AF">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, background: conf.bg, borderRadius: radius }}>
      <img
        src={base + "icons/" + conf.icon + ".svg"}
        alt=""
        width={inner}
        height={inner}
        loading="lazy"
        style={{ filter: "brightness(0) invert(1)" }}
      />
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

  // ==================== 视图：选平台（按截图重构） ====================
  if (view === "picker") {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        {/* 顶部：返回箭头 + 抓号系统 */}
        <header className="bg-neutral-50">
          <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
            <button type="button" onClick={goBack}
              className="flex h-9 w-9 items-center justify-center text-neutral-700" aria-label="返回">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">抓号系统</h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5">
          {/* 大标题 + 副标题 + 盾牌装饰 */}
          <section className="relative mt-2 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              选择要抓取的平台
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              我们将为你生成专属的二维码
            </p>
            <div className="pointer-events-none absolute -top-3 right-0">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                {/* 后层灰卡（斜） */}
                <rect x="52" y="20" width="48" height="48" rx="10" fill="#F1F1F3" transform="rotate(15 76 44)" />
                {/* 前层白卡（斜） */}
                <rect x="42" y="32" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#E8E8EC" strokeWidth="1.2" transform="rotate(8 70 60)" />
                {/* 盾牌（灰） */}
                <g transform="rotate(8 70 60)">
                  <path d="M70 44c6 0 11 1.5 15 3v13c0 9-6.5 16-15 19-8.5-3-15-10-15-19V47c4-1.5 9-3 15-3z" fill="#C4C7CE" />
                  <path d="M64 60l4.5 4.5L78 55" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
                {/* 闪光星 */}
                <path d="M104 12l1.5 4.5 4.5 1.5-4.5 1.5L104 24l-1.5-4.5L98 18l4.5-1.5z" fill="#C4C7CE" />
              </svg>
            </div>
          </section>

          {/* 平台网格：3 列，圆角方形卡片 */}
          <section>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((p) => (
                <button key={p.code} type="button" disabled={loading}
                  onClick={() => generateQr(p)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-2 py-3 active:bg-neutral-50 disabled:opacity-50">
                  <PlatformLogo code={p.code} size={52} />
                  <div className="flex items-center gap-0.5">
                    <span className="truncate text-sm text-neutral-900">{p.name}</span>
                    <svg className="h-3.5 w-3.5 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
              <button type="button" onClick={() => setView("more")}
                className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-2 py-3 active:bg-neutral-50">
                <svg width="52" height="52" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="12" fill="#F5F5F5" />
                  <circle cx="16" cy="24" r="2.5" fill="#9CA3AF" />
                  <circle cx="24" cy="24" r="2.5" fill="#9CA3AF" />
                  <circle cx="32" cy="24" r="2.5" fill="#9CA3AF" />
                </svg>
                <div className="flex items-center gap-0.5">
                  <span className="truncate text-sm text-neutral-900">更多平台</span>
                  <svg className="h-3.5 w-3.5 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            </div>
          </section>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          {/* 底部横幅 */}
          <section className="mt-6">
            <button type="button" onClick={() => showToast("敬请期待")}
              className="flex w-full items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-4 text-left active:bg-neutral-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-800">支持多个平台的账号授权</div>
                <div className="mt-0.5 text-xs text-neutral-500">安全 · 稳定 · 便捷</div>
              </div>
              <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </section>

        </main>

        {toast && (
          <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
            <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
          </div>
        )}
      </div>
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
