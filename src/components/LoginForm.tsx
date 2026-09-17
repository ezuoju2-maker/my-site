import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { useEffect, useRef, useState } from "react";
import CapWidget from "./CapWidget";
import { withBase } from "../lib/url";
import { useTranslation } from "../i18n/useTranslation";

// 生产默认启用；只有显式设置 PUBLIC_ENABLE_CAP=false 才关闭。
const ENABLE_CAP = import.meta.env.PUBLIC_ENABLE_CAP !== "false";
import { EyeIcon } from "./icons/EyeIcon";
import { ClearIcon } from "./icons/ClearIcon";

export default function LoginForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [capKey, setCapKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [website, setWebsite] = useState("");
  const mountTimeRef = useRef(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (ENABLE_CAP && !captchaToken) {
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
        setCapKey((k) => k + 1);
        return;
      }

      window.location.href = withBase("welcome/");
    } catch {
      setPasswordError(t("common.network_error"));
      setCaptchaToken("");
      setCapKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* 蜜罐字段（bot 会填，真人看不见） */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* 用户名 */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("login.identifier")}
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
          {t("login.password")}
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
      {ENABLE_CAP && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t("login.captcha")}
          </label>

          <div className="flex min-h-[78px] w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 py-2">
            <CapWidget
              key={capKey}
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
      )}

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

      {/* Google 登录 */}
      <div className="relative my-2">
        <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-200" />
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-neutral-400">或</span>
        </div>
      </div>
      <a
        href={`${API_BASE_URL}/api/auth/google`}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20.5H24v7h11.3C33.7 31.7 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1 7.4 2.7l4.9-4.9C33 8.1 28.7 6 24 6 14.1 6 6 14.1 6 24s8.1 18 18 18 18-8.1 18-18c0-1.2-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M8.5 14.7l5.8 4.2C15.7 15 19.6 12 24 12c2.8 0 5.4 1 7.4 2.7l4.9-4.9C33 8.1 28.7 6 24 6 16.8 6 10.6 10.2 8.5 14.7z"/>
          <path fill="#4CAF50" d="M24 42c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 33 26.7 34 24 34c-5.3 0-9.7-3.4-11.3-8.1l-6 4.6C8.6 36.6 15.6 42 24 42z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20.5H24v7h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C41.1 35 44 29.9 44 24c0-1.2-.1-2.3-.4-3.5z"/>
        </svg>
        使用 Google 登录
      </a>

      <p className="pt-1 text-center text-sm text-neutral-500">
        {t("login.no_account")}{" "}
        <a
          href={withBase("register/")}
          className="font-medium text-neutral-800 underline underline-offset-4"
        >
          {t("login.register")}
        </a>
      </p>
    </form>
  );
}
