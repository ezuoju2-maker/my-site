import { useEffect, useState, type ReactNode } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt?: string;
};

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
};

export default function WelcomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
  const [loggingOut, setLoggingOut] = useState(false);
  const [fullLoggingOut, setFullLoggingOut] = useState(false);
  const [showFullLogoutModal, setShowFullLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) { window.location.replace(getBase()); return; }
        const data = await parseApiResponse(response);
        if (cancelled) return;
        if (!data.ok || !data.user) { window.location.replace(getBase()); return; }
        setUser(data.user as UserInfo);
        setStatus("ok");
      } catch {
        if (!cancelled) window.location.replace(getBase());
      }
    }
    void check();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    window.location.replace(getBase());
  }

  function handleFullLogout() {
    if (fullLoggingOut) return;
    setShowFullLogoutModal(true);
  }

  function closeFullLogoutModal() {
    if (fullLoggingOut) return;
    setShowFullLogoutModal(false);
  }

  async function confirmFullLogout() {
    if (fullLoggingOut) return;
    setFullLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout?full=1`, { method: "POST", credentials: "include" });
    } catch {}
    window.location.replace(getBase());
  }

  if (status === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm text-neutral-500">正在加载…</p>
        </div>
      </main>
    );
  }

  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  const shortId = user.id.slice(0, 8);
  const joinedDays = user.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : null;

  const navItems: NavItem[] = [
    { key: "home", label: "首页", href: "/welcome/", icon: <IconHome /> },
    { key: "devices", label: "设备", href: "/settings/devices/", icon: <IconDevices /> },
    { key: "security", label: "安全", href: "/forgot-password/", icon: <IconLock /> },
    { key: "passkey", label: "Passkey", href: "/passkey/recover/", icon: <IconKey /> },
    { key: "settings", label: "设置", href: "/settings/devices/", icon: <IconGear /> },
    { key: "me", label: "我的", href: "/welcome/", icon: <IconUser /> },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 pb-10">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <a href={getBase() + "welcome/"} className="flex items-center gap-2">
            <img src="/q8-logo.png" alt="Q8" className="h-8 w-8 object-contain" style={{ mixBlendMode: "multiply" }} />
            <span className="text-base font-semibold text-neutral-900">Q8Top</span>
          </a>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="菜单"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {/* 用户卡片 */}
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-2xl font-semibold text-white">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="头像" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-neutral-900">
                {user.displayName || user.username}
              </div>
              <div className="mt-0.5 text-xs text-neutral-500">ID: {shortId}...</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {user.role === "admin" ? "管理员" : "普通用户"}
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>

        {/* 账号概览 */}
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="border-b border-neutral-100 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-900">账号概览</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-neutral-500">邮箱</div>
                <div className="mt-1 truncate font-medium text-neutral-900">{maskEmail(user.email)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">注册时间</div>
                <div className="mt-1 font-medium text-neutral-900">
                  {joinedDays ? `${joinedDays} 天前` : "未知"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <QuickAction label="管理设备" href="/settings/devices/" />
              <QuickAction label="忘记密码" href="/forgot-password/" />
              <QuickAction label="Passkey" href="/passkey/recover/" />
            </div>
          </div>
        </div>

        {/* Passkey 推荐 Banner */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
              🔑
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">添加 Passkey</div>
              <div className="mt-0.5 text-xs opacity-80">使用面容 / 指纹，1 秒登录</div>
            </div>
          </div>
          <a
            href="/passkey/recover/"
            className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-neutral-900"
          >
            立即添加
          </a>
        </div>

        {/* 公告 */}
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
          <span className="text-lg">📢</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-neutral-900">公告</div>
            <div className="truncate text-xs text-neutral-500">
              系统已升级，欢迎使用 Q8Top 账号中心
            </div>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>

        {/* 快捷导航 */}
        <div className="grid grid-cols-6 gap-1 rounded-2xl border border-neutral-100 bg-white py-3">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg py-2 text-neutral-700 hover:bg-neutral-50"
            >
              <span className="flex h-9 w-9 items-center justify-center text-neutral-800">
                {item.icon}
              </span>
              <span className="text-[11px] text-neutral-600">{item.label}</span>
            </a>
          ))}
        </div>

        {/* 搜索 */}
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="搜索功能 / 输入关键词"
            className="h-6 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* 退出登录 */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut || fullLoggingOut}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 disabled:opacity-50"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>

        <button
          type="button"
          onClick={handleFullLogout}
          disabled={loggingOut || fullLoggingOut}
          className="h-11 w-full rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 disabled:opacity-50"
        >
          {fullLoggingOut ? "彻底退出中…" : "彻底退出（清除信任设备）"}
        </button>

        <p className="pt-2 text-center text-xs text-neutral-400">Q8Top · 账号中心</p>
      </div>

      {/* 彻底退出确认弹窗 */}
      {showFullLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => { if (e.target === e.currentTarget) closeFullLogoutModal(); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
              ⚠️
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-neutral-900">确认彻底退出？</h2>
            <p className="mt-2 text-center text-sm leading-6 text-neutral-500">
              这将清除此设备的信任状态。
              <br />
              下次访问需要重新输入密码登录。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeFullLogoutModal}
                disabled={fullLoggingOut}
                className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmFullLogout}
                disabled={fullLoggingOut}
                className="h-11 flex-1 rounded-lg bg-red-600 text-base font-medium text-white disabled:opacity-50"
              >
                {fullLoggingOut ? "退出中…" : "确认退出"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 菜单抽屉 */}
      {showMenu && (
        <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-neutral-900">菜单</div>
            <div className="mt-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 4) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 4)}***@${domain}`;
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-400"
    >
      {label}
    </a>
  );
}

/* ====== SVG 图标 ====== */
const iconProps = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconHome() {
  return (
    <svg {...iconProps}>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function IconDevices() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M6 20h12a2 2 0 0 0 2-2V8" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.2-8.2" />
      <path d="m16 4 2 2" />
      <path d="m19 7 2 2" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 3.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H8A1.7 1.7 0 0 0 9 3.2V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
