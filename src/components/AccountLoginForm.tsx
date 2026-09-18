import { useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { withBase } from "../lib/url";

export default function AccountLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!username.trim() || !password) { setError("请填写账号和密码"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: username.trim(),
          password,
          remember,
          captchaToken: "",
        }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const map: Record<string, string> = {
          INVALID_CREDENTIALS: "账号或密码错误",
          TOO_MANY_REQUESTS: "尝试次数过多，请稍后再试",
          CAPTCHA_FAILED: "人机验证失败",
        };
        setError(map[data?.error as string] || "登录失败，请重试");
        return;
      }
      if ((data as any)?.device_id) {
        try { localStorage.setItem("device_id", (data as any).device_id); } catch {}
      }
      window.location.href = withBase("welcome/");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">账号 / 邮箱</label>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          placeholder="请输入账号或邮箱"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">密码</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="请输入密码"
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 pr-11 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500"
            aria-label={showPw ? "隐藏密码" : "显示密码"}
          >
            {showPw ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <path d="m1 1 22 22" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between text-sm">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-neutral-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          记住登录
        </label>

        <a
          href={withBase("forgot-password/")}
          className="py-2 text-neutral-600 underline-offset-4"
        >
          忘记密码？
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-70"
      >
        {loading ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
