import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
};

const getBasePath = getBase;

export default function UserDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
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
          window.location.replace(getBasePath());
          return;
        }

        const data = await parseApiResponse(response);

        if (cancelled) return;

        if (!data?.ok || !data.user) {
          window.location.replace(getBasePath());
          return;
        }

        setUser(data.user as UserInfo);
        setStatus("ok");
      } catch {
        if (!cancelled) {
          window.location.replace(getBasePath());
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
      // 忽略登出网络错误
    }

    // 兜底：清掉手动设置的 Cookie
    document.cookie = "session=; Path=/; Max-Age=0; Secure; SameSite=Lax";

    window.location.replace(getBasePath());
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
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700">
              LOGO
            </div>
            <span className="text-base font-medium text-neutral-900">
              网站名称
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
              {initial}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
            >
              {loggingOut ? "退出中…" : "退出"}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900">
          欢迎回来，{user.username}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {user.email}
        </p>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
              🚧
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                用户中心正在开发中
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                我们正在为您构建以下功能：
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <span className="text-neutral-400">•</span>
                  个人资料管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-400">•</span>
                  订单与购买记录
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-400">•</span>
                  账户安全设置
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-400">•</span>
                  消息与通知
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
