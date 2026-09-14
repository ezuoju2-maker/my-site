import { useEffect, useState } from "react";
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
};

export default function WelcomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
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

        setUser(data.user as UserInfo);
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

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 忽略网络错误
    }
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

  const initial = (user.displayName || user.username)
    .charAt(0)
    .toUpperCase();

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-10">
      <section className="w-full max-w-md">
        {/* 用户卡片 */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-2xl font-semibold text-white">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold text-neutral-900">
                {user.displayName || user.username}
              </div>
              <div className="mt-1 truncate text-sm text-neutral-500">
                {user.email}
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                {user.role === "admin" ? "管理员" : "普通用户"}
              </div>
            </div>
          </div>
        </div>

        {/* 开发中提示 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl">
            🚧
          </div>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">
            页面正在开发中
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            用户中心正在建设中，更多功能即将上线。
            <br />
            敬请期待。
          </p>
        </div>

        {/* 退出登录 */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-4 h-12 w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 disabled:opacity-50"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>

        <p className="mt-6 text-center text-xs text-neutral-400">
          my-site
        </p>
      </section>
    </main>
  );
}
