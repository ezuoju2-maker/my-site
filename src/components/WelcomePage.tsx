import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import Header from "./welcome/Header";
import UserCard from "./welcome/UserCard";
import Banner from "./welcome/Banner";
import QuickNav from "./welcome/QuickNav";
import Sidebar, { type SidebarKey } from "./welcome/Sidebar";
import {
  OverviewPanel,
  DevicesPanel,
  SecurityPanel,
  PasskeyPanel,
  HistoryPanel,
} from "./welcome/Panels";
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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) {
          window.location.replace(getBase());
          return;
        }
        const data = await parseApiResponse(res);
        if (cancelled) return;
        if (!data.ok || !data.user) {
          window.location.replace(getBase());
          return;
        }
        setUser(data.user as UserInfo);
        setStatus("ok");

        try {
          const devRes = await fetch(`${API_BASE_URL}/api/user/devices`, {
            credentials: "include",
            cache: "no-store",
          });
          if (devRes.ok) {
            const devData = (await devRes.json()) as { ok?: boolean; devices?: Device[] };
            if (!cancelled && devData.ok && Array.isArray(devData.devices)) {
              setDevices(devData.devices);
            }
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
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    window.location.replace(getBase());
  }

  function handleFullLogout() {
    if (!fullLoggingOut) setShowFullLogoutModal(true);
  }
  function closeFullLogoutModal() {
    if (!fullLoggingOut) setShowFullLogoutModal(false);
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

  const joinedDays = user.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : null;

  const menuItems = [
    { label: "首页", href: "/welcome/" },
    { label: "设备", href: "/settings/devices/" },
    { label: "安全", href: "/forgot-password/" },
    { label: "Passkey", href: "/passkey/recover/" },
    { label: "设置", href: "/settings/devices/" },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 pb-6">
      <Header onMenu={() => setShowMenu(true)} />

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-3">
        <UserCard user={user} deviceCount={devices.length} />

        <Banner />

        {/* 公告 */}
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
          <span className="shrink-0 text-neutral-800"><IconMegaphone /></span>
          <span className="shrink-0 text-sm font-semibold text-neutral-900">公告</span>
          <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
            系统已升级，欢迎使用 Q8Top 账号中心
          </span>
          <span className="shrink-0"><IconChevronRight /></span>
        </div>

        <QuickNav />

        {/* 搜索框 */}
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
          <IconSearch />
          <input
            type="text"
            placeholder="搜索功能 / 输入关键词"
            className="h-6 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* 侧栏 + 主内容区 */}
        <div className="grid grid-cols-[88px_1fr] gap-2.5">
          <Sidebar active={activeSide} onChange={setActiveSide} />
          <div className="min-h-[400px] rounded-2xl border border-neutral-100 bg-white p-4">
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">⚠️</div>
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
            <div className="text-sm font-bold text-neutral-900">菜单</div>
            <div className="mt-4 space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
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
