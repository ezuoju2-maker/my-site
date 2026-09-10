import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { useState, type FormEvent } from "react";
import CapWidget from "./CapWidget";
import { withBase } from "../lib/url";
import { useTranslation } from "../i18n/useTranslation";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.8 4 10 8-.5 1.6-1.5 3-2.8 4.2" />
      <path d="M6.2 6.2C4.6 6.2 3.4 9 2 12c1.2 4 4.8 8 10 8 1.4 0 2.7-.3 3.8-.8" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function LoginForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  function handleUsernameChange(value: string) {
    setUsername(value);
    if (value.trim()) {
      setUsernameError("");
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (value) {
      setPasswordError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setUsernameError("");
    setPasswordError("");
    setCaptchaError("");

    let hasError = false;

    if (!username.trim()) {
      setUsernameError(t("login.identifier_required"));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t("login.password_required"));
      hasError = true;
    }

    if (!captchaToken) {
      setCaptchaError(t("login.captcha_required"));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: username.trim(),
            password,
            remember,
            captchaToken,
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        const message =
          data?.error === "INVALID_CREDENTIALS"
            ? t("login.error.INVALID_CREDENTIALS")
            : data?.error === "CAPTCHA_FAILED"
              ? t("login.error.CAPTCHA_FAILED")
              : data?.error === "FORBIDDEN_ORIGIN"
                ? t("login.error.FORBIDDEN_ORIGIN")
                : data?.error === "INVALID_REQUEST"
                  ? t("login.error.INVALID_REQUEST")
                  : data?.error === "UNAUTHENTICATED"
                    ? t("login.error.UNAUTHENTICATED")
                    : data?.error === "SESSION_SERVICE_NOT_CONFIGURED"
                      ? t("login.error.SESSION_SERVICE_NOT_CONFIGURED")
                      : data?.error === "INTERNAL_ERROR"
                        ? t("login.error.INTERNAL_ERROR")
                        : t("login.error.DEFAULT");

        setPasswordError(message);
        setCaptchaToken("");
        return;
      }

      // 兜底：Cloudflare Pages Functions 可能丢失 set-cookie，
      // 从响应头读取 session 并手动设置 Cookie。
      const sessionToken = response.headers.get("X-Session-Token");
      const sessionMaxAge = response.headers.get("X-Session-MaxAge");

      if (sessionToken) {
        const maxAgePart =
          sessionMaxAge && sessionMaxAge !== "0"
            ? `; Max-Age=${sessionMaxAge}`
            : "";
        document.cookie = `session=${sessionToken}; Path=/; Secure; SameSite=Lax${maxAgePart}`;
      }

      const role = data?.user?.role === "admin" ? "admin" : "user";
      const target = role === "admin" ? "/admin/" : "/dashboard/";
      window.location.href = withBase(target);
    } catch {
      setPasswordError(t("common.network_error"));
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* 用户名 */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          用户名 / 邮箱
        </label>

        <div className="relative">
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => handleUsernameChange(event.target.value)}
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder={t("login.identifier_placeholder")}
            aria-invalid={Boolean(usernameError)}
            className={`h-12 w-full rounded-lg bg-white px-4 pr-12 text-base outline-none ${
              usernameError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <button
            type="button"
            onClick={() => {
              setUsername("");
              setUsernameError("");
            }}
            disabled={!username}
            className={`absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full ${
              username
                ? "text-neutral-500"
                : "pointer-events-none text-transparent"
            }`}
            aria-label={t("login.identifier_clear")}
          >
            <ClearIcon />
          </button>
        </div>

        {usernameError && (
          <p className="mt-1.5 text-sm text-red-500">{usernameError}</p>
        )}
      </div>

      {/* 密码 */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          密码
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            value={password}
            onChange={(event) => handlePasswordChange(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("login.password_placeholder")}
            aria-invalid={Boolean(passwordError)}
            className={`h-12 w-full rounded-lg bg-white px-4 pr-24 text-base outline-none ${
              passwordError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setPasswordError("");
              }}
              disabled={!password}
              className={`flex h-10 w-10 items-center justify-center ${
                password
                  ? "text-neutral-500"
                  : "pointer-events-none text-transparent"
              }`}
              aria-label={t("login.password_clear")}
            >
              <ClearIcon />
            </button>

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showPassword ? t("login.password_hide") : t("login.password_show")}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
        </div>

        {passwordError && (
          <p className="mt-1.5 text-sm text-red-500">{passwordError}</p>
        )}
      </div>

      {/* 人机验证 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          人机验证
        </label>

        <div className="flex min-h-[78px] w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 py-2">
          <CapWidget
            onSolve={(token) => {
              setCaptchaToken(token);
              setCaptchaError("");
            }}
            onReset={() => setCaptchaToken("")}
          />
        </div>

        {captchaError && (
          <p className="mt-1.5 text-sm text-red-500">{captchaError}</p>
        )}
      </div>

      {/* {t("login.remember")} / 忘记密码 */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-neutral-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          {t("login.remember")}
        </label>

        <a
          href={withBase("forgot-password/")}
          className="py-2 text-neutral-600 underline-offset-4"
        >
          {t("login.forgot")}
        </a>
      </div>

      {/* 登录按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-neutral-900 px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </button>

      <p className="pt-1 text-center text-sm text-neutral-500">
        {t("login.no_account")}{" "}
        <a
          href={withBase("register/")}
          className="font-medium text-neutral-800 underline underline-offset-4"
        >
          注册
        </a>
      </p>
    </form>
  );
}
