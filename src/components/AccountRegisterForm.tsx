import { useMemo, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { withBase } from "../lib/url";
import CapWidget from "./CapWidget";

const ENABLE_CAP = import.meta.env.PUBLIC_ENABLE_CAP !== "false";

export default function AccountRegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [capKey, setCapKey] = useState(0);
  const [agreement, setAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const rules = useMemo(() => ({
    length: password.length >= 8 && password.length <= 20,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const validCount = Object.values(rules).filter(Boolean).length;
  const strength = !password ? { pct: 0, label: "未设置", cls: "text-neutral-500" }
    : validCount <= 2 ? { pct: 25, label: "弱", cls: "text-red-600" }
    : validCount === 3 ? { pct: 50, label: "一般", cls: "text-amber-600" }
    : validCount === 4 ? { pct: 75, label: "较强", cls: "text-neutral-700" }
    : { pct: 100, label: "强", cls: "text-green-600" };

  function validate() {
    const e: Record<string, string> = {};
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim().toLowerCase())) {
      e.username = "3～20 位，仅支持小写字母、数字、下划线";
    }
    if (validCount !== 5) e.password = "密码不满足全部要求";
    if (confirm !== password) e.confirm = "两次输入的密码不一致";
    if (ENABLE_CAP && !captchaToken) e.captcha = "请完成人机验证";
    if (!agreement) e.agreement = "请阅读并同意用户协议";
    setFieldErr(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-account`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          captchaToken,
        }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok || !data.ok) {
        const map: Record<string, string> = {
          USERNAME_EXISTS: "该账号已被使用",
          INVALID_USERNAME: "账号格式不正确",
          INVALID_PASSWORD: "密码强度不够",
          CAPTCHA_FAILED: "人机验证失败",
        };
        setError(map[data?.error as string] || "注册失败，请重试");
        setCaptchaToken("");
        setCapKey((k) => k + 1);
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
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">账号</label>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setFieldErr((p) => ({ ...p, username: "" })); }}
          placeholder="请输入账号"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={20}
          className={`h-11 w-full rounded-lg border bg-white px-3 text-base outline-none ${
            fieldErr.username ? "border-red-400" : "border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          }`}
        />
        {fieldErr.username ? (
          <p className="mt-1.5 text-xs text-red-500">{fieldErr.username}</p>
        ) : (
          <p className="mt-1.5 text-xs text-neutral-500">3～20 位，支持小写字母、数字、下划线</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">密码</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErr((p) => ({ ...p, password: "" })); }}
            placeholder="请输入密码"
            autoComplete="new-password"
            maxLength={20}
            className={`h-11 w-full rounded-lg border bg-white px-3 pr-11 text-base outline-none ${
              fieldErr.password ? "border-red-400" : "border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-neutral-500"
          >
            {showPw ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">密码要求</p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs text-neutral-600">
          {[
            ["length", "8～20 个字符"],
            ["upper", "大写字母"],
            ["lower", "小写字母"],
            ["number", "数字"],
            ["special", "特殊符号"],
          ].map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={rules[k as keyof typeof rules] ? "text-green-600" : "text-neutral-400"}>
                {rules[k as keyof typeof rules] ? "✓" : "×"}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">密码强度</span>
          <span className={`text-sm ${strength.cls}`}>{strength.label}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-neutral-800 transition-all" style={{ width: `${strength.pct}%` }} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">确认密码</label>
        <input
          type={showPw ? "text" : "password"}
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setFieldErr((p) => ({ ...p, confirm: "" })); }}
          placeholder="请再次输入密码"
          autoComplete="new-password"
          maxLength={20}
          className={`h-11 w-full rounded-lg border bg-white px-3 text-base outline-none ${
            fieldErr.confirm ? "border-red-400" : "border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          }`}
        />
        {fieldErr.confirm && <p className="mt-1.5 text-xs text-red-500">{fieldErr.confirm}</p>}
      </div>

      {ENABLE_CAP && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">人机验证</p>
          <div className="flex min-h-[60px] w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 py-1">
            <CapWidget
              key={capKey}
              onSolve={(token) => { setCaptchaToken(token); setFieldErr((p) => ({ ...p, captcha: "" })); }}
              onReset={() => setCaptchaToken("")}
            />
          </div>
          {fieldErr.captcha && <p className="mt-1.5 text-xs text-red-500">{fieldErr.captcha}</p>}
        </div>
      )}

      <div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={agreement}
            onChange={(e) => { setAgreement(e.target.checked); setFieldErr((p) => ({ ...p, agreement: "" })); }}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <span>
            我已阅读并同意
            <a
              href={withBase("terms/")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mx-1 font-medium text-neutral-800 underline underline-offset-4"
            >
              用户协议
            </a>
          </span>
        </label>
        {fieldErr.agreement && <p className="mt-1 text-xs text-red-500">{fieldErr.agreement}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-70"
      >
        {loading ? "注册中…" : "注册"}
      </button>
    </form>
  );
}
