import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { withBase } from "../lib/url";
import { useTranslation } from "../i18n/useTranslation";

export default function EmailCodeLoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSendCode() {
    if (!email.trim()) { setError("请输入邮箱"); return; }
    setSending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok || !data.ok) {
        setError(data?.error === "TOO_MANY_REQUESTS" ? "请求过于频繁，请稍后再试" : "发送失败，请稍后重试");
        return;
      }
      setCooldown(60);
      setInfo("验证码已发送，请查收邮件");
    } catch {
      setError("网络错误");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !code.trim()) { setError("请填写邮箱和验证码"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login-by-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), emailCode: code.trim() }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok || !data.ok) {
        const map: Record<string, string> = {
          INVALID_EMAIL_CODE: "验证码错误",
          EMAIL_CODE_EXPIRED: "验证码已过期",
          EMAIL_CODE_TOO_MANY_ATTEMPTS: "尝试次数过多，请重新获取",
          USER_NOT_FOUND: "账号不存在",
        };
        setError(map[data?.error as string] || "登录失败，请重试");
        return;
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
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱地址"
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">验证码</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 位验证码"
            className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-base tracking-widest outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sending || cooldown > 0}
            className="h-11 shrink-0 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooldown > 0 ? `${cooldown}s` : sending ? "发送中…" : "获取验证码"}
          </button>
        </div>
        {info && <p className="mt-1.5 text-xs text-green-600">{info}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-neutral-900 px-4 text-base font-medium text-white disabled:opacity-70"
      >
        {loading ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
