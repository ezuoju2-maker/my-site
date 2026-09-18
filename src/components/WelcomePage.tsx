import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import Header from "./welcome/Header";
import UserCard from "./welcome/UserCard";
import StatusCard from "./welcome/StatusCard";
import Banner from "./welcome/Banner";
import QuickNav from "./welcome/QuickNav";
import Sidebar, { type SidebarKey } from "./welcome/Sidebar";
import { OverviewPanel, DevicesPanel, SecurityPanel, PasskeyPanel, HistoryPanel } from "./welcome/Panels";
import { IconMegaphone, IconChevronRight, IconSearch } from "./welcome/icons";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt?: string;
};

type Device = {
  deviceId: string;
  deviceModel: string | null;
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
  lastLoginAt: string | null;
  location: string | null;
  ipAddress: string | null;
};

export default function WelcomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fullLoggingOut, setFullLoggingOut] = useState(false);
  const [showFullLogoutModal, setShowFullLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSide, setActiveSide] = useState<SidebarKey>("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { method: "GET", credentials: "include", cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) { window.location.replace(getBase()); return; }
        const data = await parseApiResponse(res);
        if (cancelled) return;
        if (!data.ok || !data.user) { window.location.replace(getBase()); return; }
        setUser(data.user as UserInfo);
        setStatus("ok");
        try {
          const devRes = await fetch(`${API_BASE_URL}/api/user/devices`, { credentials: "include", cache: "no-store" });
          if (devRes.ok) {
            const devData = (await devRes.json()) as { ok?: boolean; devices?: Device[] };
            if (!cancelled && devData.ok && Array.isArray(devData.devices)) setDevices(devData.devices);
          }
        } catch {}
      } catch {
        if (!cancelled) window.location.replace(getBase());
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" }); } catch {}
    window.location.replace(getBase());
  }
  function handleFullLogout() { if (!fullLoggingOut) setShowFullLogoutModal(true); }
  function closeFullLogoutModal() { if (!fullLoggingOut) setShowFullLogoutModal(false); }
  async function confirmFullLogout() {
    if (fullLoggingOut) return;
    setFullLoggingOut(true);
    try { await fetch(`${API_BASE_URL}/api/auth/logout?full=1`, { method: "POST", credentials: "include" }); } catch {}
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

  const joinedDays = user.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : null;

  const menuItems = [
    { label: "首页", href: "/welcome/" },
    { label: "设备", href: "/settings/devices/" },
    { label: "安全", href: "/forgot-password/" },
    { label: "Passkey", href: "/passkey/recover/" },
  ];

  const cardShadow = { boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -8px rgba(0,0,0,0.06)" };

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-100 pb-8">
      <Header onMenu={() => setShowMenu(true)} />

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <UserCard user={user} />
        <StatusCard user={user} deviceCount={devices.length} joinedDays={joinedDays} />
        <Banner />

        {/* 公告 */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200/60" style={cardShadow}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600">
            <IconMegaphone />
          </span>
          <span className="shrink-0 text-[13px] font-bold text-neutral-900">公告</span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-500">系统已升级，欢迎使用 Q8Top 账号中心</span>
          <IconChevronRight />
        </div>

        <QuickNav />

        {/* 搜索 */}
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200/60 transition-all focus-within:ring-2 focus-within:ring-amber-500/30" style={cardShadow}>
          <IconSearch />
          <input
            type="text"
            placeholder="搜索功能 / 输入关键词"
            className="h-6 w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* 侧栏 + 主内容 */}
        <div className="grid grid-cols-[92px_1fr] gap-3">
          <Sidebar active={activeSide} onChange={setActiveSide} />
          <div className="min-h-[400px] rounded-2xl bg-white p-4 ring-1 ring-neutral-200/60" style={cardShadow}>
            {activeSide === "overview" && <OverviewPanel user={user} devices={devices} joinedDays={joinedDays} />}
            {activeSide === "devices" && <DevicesPanel devices={devices} />}
            {activeSide === "security" && <SecurityPanel />}
            {activeSide === "passkey" && <PasskeyPanel />}
            {activeSide === "history" && <HistoryPanel devices={devices} />}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut || fullLoggingOut}
          className="h-11 w-full rounded-2xl bg-white text-[13px] font-medium text-neutral-600 ring-1 ring-neutral-200/60 transition-all hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-50"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>

        <button
          type="button"
          onClick={handleFullLogout}
          disabled={loggingOut || fullLoggingOut}
          className="h-11 w-full rounded-2xl bg-white text-[13px] font-medium text-red-600 ring-1 ring-red-200/60 transition-all hover:bg-red-50/50 active:scale-[0.99] disabled:opacity-50"
        >
          {fullLoggingOut ? "彻底退出中…" : "彻底退出（清除信任设备）"}
        </button>

        <p className="pt-2 text-center text-[11px] tracking-wider text-neutral-400">Q8TOP · 账号中心</p>
      </div>

      {/* 彻底退出弹窗 */}
      {showFullLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm"
             onClick={(e) => { if (e.target === e.currentTarget) closeFullLogoutModal(); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-center text-[17px] font-bold text-neutral-900">确认彻底退出？</h2>
            <p className="mt-2 text-center text-[13px] leading-6 text-neutral-500">
              这将清除此设备的信任状态。<br />下次访问需要重新输入密码登录。
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeFullLogoutModal} disabled={fullLoggingOut}
                      className="h-11 flex-1 rounded-xl bg-neutral-100 text-[14px] font-medium text-neutral-700 transition-all active:scale-[0.98] disabled:opacity-50">
                取消
              </button>
              <button type="button" onClick={confirmFullLogout} disabled={fullLoggingOut}
                      className="h-11 flex-1 rounded-xl bg-red-600 text-[14px] font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50">
                {fullLoggingOut ? "退出中…" : "确认退出"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 菜单抽屉 */}
      {showMenu && (
        <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-bold tracking-tight text-neutral-900">菜单</div>
            <div className="mt-6 space-y-1">
              {menuItems.map((item) => (
                <a key={item.label} href={item.href}
                   className="block rounded-xl px-4 py-3 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
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
