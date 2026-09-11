import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetId: string | null;
  targetUsername: string | null;
  details: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  "role.change": "改角色",
  "user.delete": "删用户",
  "user.reset_password": "重置密码",
  "session.revoke": "踢下线",
  "config.update": "改配置",
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  createdAt: string;
};

type UsageSnapshot = {
  date: string;
  mode: string;
  counts: Record<string, number>;
  total: number;
};

type UsageRow = {
  key: string;
  label: string;
  limit: number | null;
  limitLabel: string;
};

const USAGE_ROWS: UsageRow[] = [
  { key: "login",           label: "登录",         limit: null, limitLabel: "—" },
  { key: "register",        label: "注册",         limit: null, limitLabel: "—" },
  { key: "send-code",       label: "注册发码",     limit: 100,  limitLabel: "100 / 天（Resend）" },
  { key: "forgot-password", label: "忘记密码",     limit: 100,  limitLabel: "100 / 天（Resend）" },
  { key: "reset-password",  label: "重置密码",     limit: null, limitLabel: "—" },
  { key: "email-send-code", label: "改邮箱发码",   limit: 100,  limitLabel: "100 / 天（Resend）" },
];

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
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [usageError, setUsageError] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[] | null>(null);
  const [auditError, setAuditError] = useState("");


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

  useEffect(() => {
    let cancelled = false;
    async function loadUsage() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/usage`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          setUsageError("加载失败");
          return;
        }
        const data = await parseApiResponse(response);
        if (cancelled) return;
        if (data?.ok) {
          const d = data as unknown as {
            date?: string;
            mode?: string;
            counts?: Record<string, number>;
            total?: number;
          };
          setUsage({
            date: d.date ?? "",
            mode: d.mode ?? "normal",
            counts: d.counts ?? {},
            total: d.total ?? 0,
          });
        }
      } catch {
        if (!cancelled) setUsageError("网络错误");
      }
    }
    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=50`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          setUsersError("加载失败");
          return;
        }
        const data = (await response.json()) as {
          ok?: boolean;
          users?: AdminUser[];
          hasMore?: boolean;
        };
        if (cancelled) return;
        if (data.ok && data.users) {
          setUsers(data.users);
          setHasMoreUsers(Boolean(data.hasMore));
        } else {
          setUsersError("数据格式异常");
        }
      } catch {
        if (!cancelled) setUsersError("网络错误");
      }
    }
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAuditLogs() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs?limit=20`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          setAuditError("加载失败");
          return;
        }
        const data = (await response.json()) as {
          ok?: boolean;
          logs?: AuditLog[];
        };
        if (cancelled) return;
        if (data.ok && data.logs) {
          setAuditLogs(data.logs);
        } else {
          setAuditError("数据格式异常");
        }
      } catch {
        if (!cancelled) setAuditError("网络错误");
      }
    }
    void loadAuditLogs();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRoleChange(userId: string, newRole: "user" | "admin") {
    if (updatingRoleId) return;
    setUpdatingRoleId(userId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/role`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        },
      );
      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        alert(
          err === "CANNOT_CHANGE_SELF"
            ? "不能修改自己的角色"
            : "角色修改失败，请稍后重试",
        );
        return;
      }

      setUsers((prev) =>
        prev
          ? prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
          : prev,
      );
    } catch {
      alert("网络错误，请重试");
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function handleRevokeSessions(userId: string, username: string) {
    if (updatingRoleId) return;
    if (
      !window.confirm(
        `确认踢出 ${username} 的所有登录设备？\n该用户需要重新登录。`,
      )
    ) {
      return;
    }

    setUpdatingRoleId(userId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/revoke`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await parseApiResponse(response);

      if (!response.ok || !data.ok) {
        const err = (data as unknown as { error?: string }).error;
        alert(
          err === "CANNOT_REVOKE_SELF"
            ? "不能踢出自己"
            : "踢出失败，请稍后重试",
        );
        return;
      }

      alert(`已踢出 ${username} 的所有登录设备`);
    } catch {
      alert("网络错误，请重试");
    } finally {
      setUpdatingRoleId(null);
    }
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

    // 兜底：清掉手动设置的 Cookie

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

        {/* 今日用量 */}
        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-100">今日用量</h2>
            <span className="text-xs text-neutral-400">
              {usage ? `${usage.date} UTC · 模式 ${usage.mode}` : "加载中…"}
            </span>
          </div>

          {usageError && (
            <p className="mt-3 text-sm text-red-400">{usageError}</p>
          )}

          {usage && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="py-2 pr-4 font-medium">操作</th>
                    <th className="py-2 pr-4 text-right font-medium">今日次数</th>
                    <th className="py-2 pr-4 font-medium">参考上限</th>
                    <th className="py-2 text-right font-medium">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {USAGE_ROWS.map((row) => {
                    const count = usage.counts[row.key] ?? 0;
                    const pct = row.limit ? Math.min(100, Math.round((count / row.limit) * 100)) : null;
                    const warn = pct !== null && pct >= 70;
                    return (
                      <tr key={row.key} className="border-b border-neutral-800/50">
                        <td className="py-2 pr-4 text-neutral-200">{row.label}</td>
                        <td className="py-2 pr-4 text-right font-mono text-neutral-100">{count}</td>
                        <td className="py-2 pr-4 text-neutral-500">{row.limitLabel}</td>
                        <td className={`py-2 text-right font-mono ${warn ? "text-red-400" : "text-neutral-400"}`}>
                          {pct !== null ? `${pct}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 text-xs text-neutral-500" colSpan={3}>
                      今日总请求（仅统计埋点接口）
                    </td>
                    <td className="pt-3 text-right font-mono text-neutral-100">
                      {usage.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-500">
            参考上限仅为 Resend 免费层每日 100 封的保守估算。Cloudflare Workers / D1 / KV 免费额度均远高于此。
          </p>
        </div>

        {/* 用户列表 */}
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-100">用户列表</h2>
            <span className="text-xs text-neutral-400">
              {users ? `本页 ${users.length} 位${hasMoreUsers ? " · 有更多" : ""}` : "加载中…"}
            </span>
          </div>

          {usersError && (
            <p className="mt-3 text-sm text-red-400">{usersError}</p>
          )}

          {users && users.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500">暂无用户</p>
          )}

          {users && users.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="py-2 pr-4 font-medium">用户</th>
                    <th className="py-2 pr-4 font-medium">邮箱</th>
                    <th className="py-2 pr-4 font-medium">角色</th>
                    <th className="py-2 pr-4 font-medium">注册时间</th>
                    <th className="py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-800/50">
                      <td className="py-2 pr-4 text-neutral-200">
                        {u.displayName || u.username}
                      </td>
                      <td className="py-2 pr-4 text-neutral-300">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            u.role === "admin"
                              ? "rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300"
                              : "rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">
                        {u.createdAt}
                      </td>
                      <td className="py-2 text-right">
                        {u.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `确认将 ${u.username} 降级为普通用户？`,
                                )
                              ) {
                                void handleRoleChange(u.id, "user");
                              }
                            }}
                            disabled={updatingRoleId === u.id}
                            className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300 disabled:opacity-50"
                          >
                            {updatingRoleId === u.id ? "…" : "降级"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `确认将 ${u.username} 提升为管理员？`,
                                )
                              ) {
                                void handleRoleChange(u.id, "admin");
                              }
                            }}
                            disabled={updatingRoleId === u.id}
                            className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                          >
                            {updatingRoleId === u.id ? "…" : "提升"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRevokeSessions(u.id, u.username)}
                          disabled={updatingRoleId === u.id}
                          className="ml-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 disabled:opacity-50"
                        >
                          踢出
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-500">
            只读展示，不含密码哈希等敏感字段。最多显示 50 条。
          </p>
        </div>

        {/* 最近操作（审计日志） */}
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-100">最近操作</h2>
            <span className="text-xs text-neutral-400">
              {auditLogs ? `最近 ${auditLogs.length} 条` : "加载中…"}
            </span>
          </div>

          {auditError && (
            <p className="mt-3 text-sm text-red-400">{auditError}</p>
          )}

          {auditLogs && auditLogs.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500">暂无审计记录</p>
          )}

          {auditLogs && auditLogs.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="py-2 pr-4 font-medium">时间 (UTC)</th>
                    <th className="py-2 pr-4 font-medium">操作人</th>
                    <th className="py-2 pr-4 font-medium">操作</th>
                    <th className="py-2 font-medium">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-neutral-800/50">
                      <td className="py-2 pr-4 text-xs text-neutral-500">
                        {log.createdAt}
                      </td>
                      <td className="py-2 pr-4 text-neutral-200">
                        {log.actorUsername}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-neutral-400">
                        {log.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-500">
            审计日志只增不改。后续可扩展至删用户、重置密码等 admin 操作。
          </p>
        </div>

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
