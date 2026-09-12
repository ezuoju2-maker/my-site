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

/* ============================================================
   抓号系统首页专用：彩色 App 图标（圆角方形）
   ============================================================ */
function PlatformLogo({ code, size = 48 }: { code: string; size?: number }) {
  const svg = { width: size, height: size, viewBox: "0 0 48 48", xmlns: "http://www.w3.org/2000/svg" } as const;

  if (code === "xiaohongshu") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#FF2442" />
        <text x="24" y="29" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600"
          fontFamily="-apple-system, PingFang SC, Microsoft YaHei, sans-serif">小红书</text>
      </svg>
    );
  }
  if (code === "douyin") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#000" />
        <path d="M33 14c-.4-1.6-1.1-3-2.2-4.1-1.1-1-2.4-1.6-3.9-1.8v11.9c0 4-3.2 7.2-7.2 7.2s-7.2-3.2-7.2-7.2 3.2-7.2 7.2-7.2c.4 0 .8 0 1.1.1v5c-.4-.1-.7-.2-1.1-.2-1.4 0-2.6 1.2-2.6 2.6s1.2 2.6 2.6 2.6 2.6-1.2 2.6-2.6V4h5c.4 2.3 1.6 4.3 3.5 5.6 1.3 1 2.9 1.5 4.5 1.6V16c-1.5-.1-3-.6-4.3-1.3l-.1-.1z" fill="#fff" />
        <path d="M33 14c-.4-1.6-1.1-3-2.2-4.1-1.1-1-2.4-1.6-3.9-1.8v11.9c0 4-3.2 7.2-7.2 7.2" fill="none" stroke="#25F4EE" strokeWidth="1.8" />
      </svg>
    );
  }
  if (code === "bilibili") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#00A1D6" />
        <path d="M14 17l-2-2.5 1.3-1 2.2 2.7h17l2.2-2.7 1.3 1L34 17h3c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2V19c0-1.1.9-2 2-2h3z" fill="#fff" />
        <rect x="17" y="23" width="4" height="4" fill="#00A1D6" />
        <rect x="27" y="23" width="4" height="4" fill="#00A1D6" />
      </svg>
    );
  }
  if (code === "weibo") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#FDD35C" />
        <ellipse cx="24" cy="26" rx="12" ry="8.5" fill="#E6162D" />
        <circle cx="24" cy="26" r="4" fill="#fff" />
        <circle cx="24" cy="26" r="2.5" fill="#1A1A1A" />
      </svg>
    );
  }
  if (code === "wechat") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#07C160" />
        <ellipse cx="18" cy="21" rx="9" ry="8" fill="#fff" />
        <ellipse cx="31" cy="28" rx="8" ry="7" fill="#fff" />
        <circle cx="15" cy="20" r="1.2" fill="#07C160" />
        <circle cx="21" cy="20" r="1.2" fill="#07C160" />
        <circle cx="28" cy="27" r="1.1" fill="#07C160" />
        <circle cx="34" cy="27" r="1.1" fill="#07C160" />
      </svg>
    );
  }
  if (code === "qq") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#12B7F5" />
        <path d="M24 11c-5 0-8.5 3.8-8.5 8.7 0 1.8.4 3.4 1 4.7-.7 1-1.4 2.6-1.4 3.4 0 .6.3 1 .9 1 .6 0 1.4-.6 2-1.4.8 1.3 2 2.3 3.4 2.8-.7.4-1.2.9-1.2 1.4 0 .8 1.6 1.4 3.8 1.4s3.8-.6 3.8-1.4c0-.5-.5-1-1.2-1.4 1.4-.5 2.6-1.5 3.4-2.8.6.8 1.4 1.4 2 1.4.6 0 .9-.4.9-1 0-.8-.7-2.4-1.4-3.4.6-1.3 1-2.9 1-4.7C32.5 14.8 29 11 24 11z" fill="#fff" />
      </svg>
    );
  }
  if (code === "discord") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#5865F2" />
        <path d="M33 17c-2.1-1-4.3-1.7-6.6-2l-.3.6c1.8.4 2.6 1 2.6 1s-2.2-1.1-5.7-1.1-5.7 1.1-5.7 1.1.8-.6 2.6-1l-.3-.6c-2.3.3-4.5 1-6.6 2-2.9 4.3-3.7 8.5-3.3 12.6 2.6 1.9 5.1 3 7.6 3.8l.7-1.1c-.8-.3-1.7-.7-2.4-1.2l.5-.4c4.6 2.1 9.6 2.1 14.1 0l.5.4c-.8.5-1.6.9-2.4 1.2l.7 1.1c2.5-.8 5-1.9 7.6-3.8.5-4.7-.6-9-3.3-12.6zM18.5 30c-1.5 0-2.7-1.4-2.7-3s1.2-3 2.7-3 2.7 1.4 2.7 3-1.2 3-2.7 3zm11 0c-1.5 0-2.7-1.4-2.7-3s1.2-3 2.7-3 2.7 1.4 2.7 3-1.2 3-2.7 3z" fill="#fff" />
      </svg>
    );
  }
  if (code === "google") {
    return (
      <svg {...svg}>
        <rect width="48" height="48" rx="12" fill="#fff" />
        <path d="M24 10c3.6 0 6.7 1.3 9.1 3.4l-3.7 3.7c-1.5-1.2-3.4-1.9-5.4-1.9-3.9 0-7.2 2.6-8.4 6.2-.4 1.2-.7 2.5-.7 3.8s.2 2.6.7 3.8c1.2 3.6 4.5 6.2 8.4 6.2 2 0 3.8-.5 5.2-1.5.8-.5 1.4-1.2 2-1.9.5-.7.8-1.4 1-2.2H24v-4.4h13c.1.7.2 1.4.2 2.2 0 2.9-.8 5.5-2.2 7.6-2.5 3.8-6.8 6.4-12 6.4C13.7 40 6.4 32.3 6.4 23.5S13.7 7 23 7c4.3 0 8.1 1.5 11 4.1l-3.7 3.7c-1.7-1.5-3.9-2.4-6.3-2.4z" fill="#4285F4" />
        <path d="M10 18l3.8 2.9c1-2.7 3.5-4.6 6.4-4.6 1.6 0 3.1.5 4.4 1.5l3.4-3.4c-2.2-1.9-4.9-2.9-7.8-2.9-4.4 0-8.2 2.3-10.2 6.5z" fill="#EA4335" />
        <path d="M37 24c0-1.4-.2-2.8-.4-4.1H24v8h7.1c-.3 1.6-1 3-2 4l3.5 2.7C34.8 32.5 37 28.6 37 24z" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg {...svg}>
      <rect width="48" height="48" rx="12" fill="#E5E5E5" />
      <circle cx="24" cy="24" r="2.5" fill="#9CA3AF" />
      <circle cx="16" cy="24" r="2.5" fill="#9CA3AF" />
      <circle cx="32" cy="24" r="2.5" fill="#9CA3AF" />
    </svg>
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
        {/* 顶部：抓号系统 + 联系客服（无返回箭头） */}
        <header className="bg-neutral-50">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
            <h1 className="text-xl font-bold text-neutral-900">抓号系统</h1>
            <button type="button" onClick={() => showToast("请联系客服")}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
              </svg>
              联系客服
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5">
          {/* 大标题 + 副标题 + 盾牌装饰 */}
          <section className="relative mt-2 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              选择要抓取的平台
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              我们家为你生成专属的授权二维码。
            </p>
            <div className="pointer-events-none absolute -top-2 right-0 opacity-90">
              <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                <rect x="38" y="12" width="36" height="36" rx="10" fill="#F5F5F5" transform="rotate(8 56 30)" />
                <rect x="30" y="22" width="42" height="42" rx="12" fill="#FFFFFF" stroke="#E5E5E5" strokeWidth="1.5" />
                <path d="M51 36c2.5 0 4.5 2 4.5 4.5 0 4-4.5 7.5-4.5 7.5s-4.5-3.5-4.5-7.5c0-2.5 2-4.5 4.5-4.5z" fill="#9CA3AF" />
                <path d="M48.8 40.5l1.6 1.6 3-3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </section>

          {/* 平台网格：3 列，圆角方形卡片 */}
          <section>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((p) => (
                <button key={p.code} type="button" disabled={loading}
                  onClick={() => generateQr(p)}
                  className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50 disabled:opacity-50">
                  <PlatformLogo code={p.code} size={48} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{p.name}</span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ))}
              <button type="button" onClick={() => showToast("更多平台即将上线")}
                className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-3 text-left active:bg-neutral-50">
                <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="12" fill="#F5F5F5" />
                  <circle cx="16" cy="24" r="2.5" fill="#9CA3AF" />
                  <circle cx="24" cy="24" r="2.5" fill="#9CA3AF" />
                  <circle cx="32" cy="24" r="2.5" fill="#9CA3AF" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">更多平台</span>
                <svg className="h-4 w-4 shrink-0 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </section>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          {/* 底部横幅 */}
          <section className="mt-6">
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-4">
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
            </div>
          </section>

          {/* 我的账号快捷入口 */}
          <button type="button" onClick={() => setView("accounts")}
            className="mt-4 h-12 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700">
            我的账号
          </button>
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
