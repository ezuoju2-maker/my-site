import { API_BASE_URL } from "../lib/api";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
};

const getBasePath = getBase;

export default function AdminDashboard() {
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

        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (!data?.ok || !data.user) {
          window.location.replace(getBasePath());
          return;
        }

        // 非 admin 用户降级到用户中心
        if (data.user.role !== "admin") {
          window.location.replace(`${getBasePath()}dashboard/`);
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
          <p className="mt-4 text-sm text-neutral-500">正在验证管理员权限…</p>
        </div>
      </main>
    );
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 text-xs font-semibold text-neutral-300">
              LOGO
            </div>
            <span className="text-base font-medium text-neutral-100">
              管理后台
            </span>
            <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-900">
              {initial}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 disabled:opacity-50"
            >
              {loggingOut ? "退出中…" : "退出"}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-semibold text-neutral-100">
          管理员控制台，{user.username}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">{user.email}</p>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-2xl">
              🚧
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">
                管理后台正在开发中
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                我们正在为您构建以下功能：
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                <li className="flex items-center gap-2">
                  <span className="text-neutral-500">•</span>
                  商品管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-500">•</span>
                  订单管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-500">•</span>
                  用户管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-500">•</span>
                  数据统计与报表
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neutral-500">•</span>
                  系统设置
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
