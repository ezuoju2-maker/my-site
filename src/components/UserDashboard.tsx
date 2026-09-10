import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";
import { FEATURES, TABS, SITE_NAME, ANNOUNCEMENT, type TabKey } from "./dashboard-data";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export default function UserDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [toast, setToast] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

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

        if (!response.ok) {
          window.location.replace(getBase());
          return;
        }

        const data = await parseApiResponse(response);

        if (cancelled) return;

        if (!data.ok || !data.user) {
          window.location.replace(getBase());
          return;
        }

        setUser(data.user);
        setStatus("ok");
      } catch {
        if (!cancelled) {
          window.location.replace(getBase());
        }
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 忽略登出网络错误
    }

    document.cookie = "session=; Path=/; Max-Age=0; Secure; SameSite=Lax";
    window.location.replace(getBase());
  }

  if (status === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm text-neutral-500">正在验证身份…</p>
        </div>
      </main>
    );
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white">
              L
            </div>
            <span className="text-base font-semibold text-neutral-900">
              {SITE_NAME}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => notify("语言切换开发中")}
              className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-neutral-600"
            >
              🌐 中文
            </button>
            <button
              type="button"
              onClick={() => notify("消息中心开发中")}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600"
              aria-label="通知"
            >
              🔔
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <button
              type="button"
              onClick={() => notify("菜单开发中")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600"
              aria-label="菜单"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        {/* 用户信息卡 */}
        <button
          type="button"
          onClick={() => notify("个人资料开发中")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-neutral-900">
              {user.username}
            </div>
            <div className="mt-0.5 truncate text-sm text-neutral-500">
              {user.email}
            </div>
          </div>
          <span className="text-neutral-300">›</span>
        </button>

        {/* 账户余额卡 */}
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-xl">
                💳
              </div>
              <div>
                <div className="text-base font-semibold text-neutral-900">
                  账户余额
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  当前余额：<span className="text-neutral-400">— —</span>
                </div>
              </div>
            </div>
            <div className="text-3xl">💳</div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => notify("充值开发中")}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-medium text-white"
            >
              <span className="text-xl leading-none">＋</span>
              充值
            </button>
            <button
              type="button"
              onClick={() => notify("余额详情开发中")}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-neutral-200 text-base font-medium text-neutral-700"
            >
              查看详情
              <span className="text-neutral-400">›</span>
            </button>
          </div>
        </div>

        {/* 公告 */}
        <button
          type="button"
          onClick={() => notify("公告列表开发中")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base">
            📢
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="shrink-0 text-base font-semibold text-neutral-900">
              公告
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-sm text-neutral-500">
              {ANNOUNCEMENT}
            </span>
          </div>
          <span className="shrink-0 text-neutral-300">›</span>
        </button>

        {/* Tab 导航（当前位置展示，不是底部） */}
        <div className="rounded-2xl bg-white p-1">
          <div className="grid grid-cols-4">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key !== "home") {
                      notify(`${tab.label}开发中`);
                    }
                  }}
                  className="flex flex-col items-center gap-1 py-3"
                >
                  <span className="text-xl leading-none">{tab.emoji}</span>
                  <span
                    className={
                      active
                        ? "text-xs font-medium text-neutral-900"
                        : "text-xs text-neutral-500"
                    }
                  >
                    {tab.label}
                  </span>
                  <span
                    className={
                      active
                        ? "mt-0.5 h-0.5 w-6 rounded-full bg-neutral-900"
                        : "mt-0.5 h-0.5 w-6 rounded-full bg-transparent"
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 功能列表 */}
        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <button
              key={feature.title}
              type="button"
              onClick={() => notify(`${feature.title}正在开发中`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl">
                {feature.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-neutral-900">
                  {feature.title}
                </div>
                <div className="mt-0.5 truncate text-sm text-neutral-500">
                  {feature.subtitle}
                </div>
              </div>
              <span className="shrink-0 text-neutral-300">›</span>
            </button>
          ))}
        </div>

        {/* 退出 */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-4 h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 disabled:opacity-50"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
