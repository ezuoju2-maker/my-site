import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import CapWidget from "./CapWidget";
import VerifyCodeInput from "./VerifyCodeInput";
import { EyeIcon } from "./icons/EyeIcon";
import { ClearIcon } from "./icons/ClearIcon";
import { getBase } from "../lib/url";
import { useTranslation } from "../i18n/useTranslation";

const ENABLE_CAP = import.meta.env.PUBLIC_ENABLE_CAP !== "false";

const RESEND_COOLDOWN_SECONDS = 60;


type TFunc = (key: string) => string;

function getErrorMessage(t: TFunc, error: string, attemptsRemaining?: number) {
  switch (error) {
    case "INVALID_EMAIL":
      return t("forgot.error.INVALID_EMAIL");
    case "EMAIL_CODE_EXPIRED":
      return t("forgot.error.EMAIL_CODE_EXPIRED");
    case "INVALID_EMAIL_CODE":
      return attemptsRemaining
        ? t("forgot.error.INVALID_EMAIL_CODE_WITH_ATTEMPTS").replace(
            "{n}",
            String(attemptsRemaining),
          )
        : t("forgot.error.INVALID_EMAIL_CODE");
    case "EMAIL_CODE_TOO_MANY_ATTEMPTS":
      return t("forgot.error.EMAIL_CODE_TOO_MANY_ATTEMPTS");
    case "INVALID_PASSWORD":
      return t("forgot.error.INVALID_PASSWORD");
    case "TOO_MANY_REQUESTS":
      return t("forgot.error.TOO_MANY_REQUESTS");
    case "EMAIL_SERVICE_NOT_CONFIGURED":
      return t("forgot.error.EMAIL_SERVICE_NOT_CONFIGURED");
    case "EMAIL_PROVIDER_ERROR":
    case "EMAIL_PROVIDER_UNREACHABLE":
      return t("forgot.error.EMAIL_PROVIDER_ERROR");
    case "PASSWORD_RESET_FAILED":
      return t("forgot.error.PASSWORD_RESET_FAILED");
    default:
      return t("forgot.error.DEFAULT");
  }
}

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [capKey, setCapKey] = useState(0);

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && newPassword !== confirmPassword,
    [newPassword, confirmPassword],
  );

  const passwordRules = useMemo(() => ({
    length: newPassword.length >= 8 && newPassword.length <= 20,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  }), [newPassword]);

  const validCount = Object.values(passwordRules).filter(Boolean).length;

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { pct: 0, label: "未设置", cls: "text-neutral-500" };
    if (validCount <= 2) return { pct: 25, label: "弱", cls: "text-red-600" };
    if (validCount === 3) return { pct: 50, label: "一般", cls: "text-amber-600" };
    if (validCount === 4) return { pct: 75, label: "较强", cls: "text-neutral-700" };
    return { pct: 100, label: "强", cls: "text-green-600" };
  }, [newPassword, validCount]);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  function showError(message: string, ref?: RefObject<HTMLInputElement | null>) {
    setError(message);

    window.setTimeout(() => {
      ref?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      ref?.current?.focus();
    }, 0);
  }

  async function sendCode() {
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showError(t("forgot.error.EMAIL_REQUIRED"), emailRef);
      return;
    }

    if (ENABLE_CAP && !captchaToken) {
      setCaptchaError(t("forgot.error.CAPTCHA_REQUIRED"));
      return;
    }

    if (countdown > 0 || loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            captchaToken,
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok || !data?.ok) {
        showError(
          getErrorMessage(t, 
            data?.error ?? "UNKNOWN_ERROR",
            data?.attemptsRemaining,
          ),
          emailRef,
        );
        if (data?.error === "CAPTCHA_FAILED") {
          setCaptchaToken("");
          setCapKey((k) => k + 1);
        }
        return;
      }

      setEmail(normalizedEmail);
      setCodeSent(true);
      setCountdown(
        Number(data.retryAfter) || RESEND_COOLDOWN_SECONDS,
      );
      setSuccess(t("forgot.sent_success"));

      window.setTimeout(() => {
        codeRef.current?.focus();
      }, 0);
    } catch {
      showError(t("forgot.error.NETWORK"), emailRef);
      setCaptchaToken("");
      setCapKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    const code = emailCode.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showError(t("forgot.error.EMAIL_REQUIRED"), emailRef);
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showError(t("forgot.error.EMAIL_CODE_REQUIRED"), codeRef);
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 128 ||
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      showError(t("forgot.error.INVALID_PASSWORD"), passwordRef);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(t("forgot.error.PASSWORD_MISMATCH"), confirmPasswordRef);
      return;
    }

    setResetting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            emailCode: code,
            newPassword,
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok || !data?.ok) {
        showError(
          getErrorMessage(t, 
            data?.error ?? "UNKNOWN_ERROR",
            data?.attemptsRemaining,
          ),
          data?.error === "INVALID_EMAIL_CODE"
            ? codeRef
            : data?.error === "INVALID_PASSWORD"
              ? passwordRef
              : undefined,
        );
        return;
      }

      setSuccess(t("forgot.success"));

      setEmailCode("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        window.location.href = getBase();
      }, 1500);
    } catch {
      showError(t("forgot.error.NETWORK_RETRY"));
    } finally {
      setResetting(false);
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-md space-y-5"
      onSubmit={resetPassword}
      noValidate
    >
      <div>
        <label
          htmlFor="forgot-email"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.email")}
        </label>

        <input
          ref={emailRef}
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("forgot.email_placeholder")}
          className="w-full rounded-lg border px-4 py-3 outline-none"
          disabled={loading || resetting}
        />
      </div>

      {/* 人机验证 */}
      {ENABLE_CAP && (
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("forgot.captcha")}
          </label>

          <div className="flex min-h-[78px] w-full items-center justify-center rounded-lg border px-2 py-2">
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

      <div>
        <label
          htmlFor="forgot-code"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.email_code")}
        </label>

        <VerifyCodeInput
          value={emailCode}
          onChange={setEmailCode}
          length={6}
          autoFocus={false}
          disabled={loading || resetting}
        />
        <p className="mt-2 text-center text-xs text-neutral-500">
          未接收到邮箱验证码可去垃圾邮件查看是否有
        </p>
        <button
          type="button"
          onClick={sendCode}
          disabled={loading || resetting || countdown > 0}
          className="mt-3 h-11 w-full rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? t("forgot.send_code_sending")
            : countdown > 0
              ? `重新发送 (${countdown}s)`
              : codeSent
                ? "重新发送验证码"
                : "获取验证码"}
        </button>
      </div>

      <div>
        <label
          htmlFor="forgot-password"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.new_password")}
        </label>

        <div className="relative">
          <input
            ref={passwordRef}
            id="forgot-password"
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder={t("forgot.error.NEW_PASSWORD_REQUIRED")}
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-24 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            disabled={loading || resetting}
          />
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
            <button
              type="button"
              onClick={() => setNewPassword("")}
              disabled={!newPassword}
              className={`flex h-10 w-10 items-center justify-center ${
                newPassword ? "text-neutral-500" : "pointer-events-none text-transparent"
              }`}
              aria-label="清空新密码"
            >
              <ClearIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showNewPassword ? "隐藏密码" : "显示密码"}
            >
              <EyeIcon hidden={!showNewPassword} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">密码要求</p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className={passwordRules.length ? "text-green-600" : "text-neutral-400"}>
              {passwordRules.length ? "✓" : "×"}
            </span>
            8～20 个字符
          </span>
          <span className="flex items-center gap-1.5">
            <span className={passwordRules.upper ? "text-green-600" : "text-neutral-400"}>
              {passwordRules.upper ? "✓" : "×"}
            </span>
            大写字母
          </span>
          <span className="flex items-center gap-1.5">
            <span className={passwordRules.lower ? "text-green-600" : "text-neutral-400"}>
              {passwordRules.lower ? "✓" : "×"}
            </span>
            小写字母
          </span>
          <span className="flex items-center gap-1.5">
            <span className={passwordRules.number ? "text-green-600" : "text-neutral-400"}>
              {passwordRules.number ? "✓" : "×"}
            </span>
            数字
          </span>
          <span className="flex items-center gap-1.5">
            <span className={passwordRules.special ? "text-green-600" : "text-neutral-400"}>
              {passwordRules.special ? "✓" : "×"}
            </span>
            特殊符号
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium">密码强度</span>
          <span className={`text-sm ${passwordStrength.cls}`}>{passwordStrength.label}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-800 transition-all"
            style={{ width: `${passwordStrength.pct}%` }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="forgot-confirm-password"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.confirm_password")}
        </label>

        <div className="relative">
          <input
            ref={confirmPasswordRef}
            id="forgot-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("forgot.confirm_password_placeholder")}
            className={`w-full rounded-lg border bg-white px-4 py-3 pr-24 text-base outline-none ${
              passwordMismatch
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
            disabled={loading || resetting}
          />
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
            <button
              type="button"
              onClick={() => setConfirmPassword("")}
              disabled={!confirmPassword}
              className={`flex h-10 w-10 items-center justify-center ${
                confirmPassword ? "text-neutral-500" : "pointer-events-none text-transparent"
              }`}
              aria-label="清空确认密码"
            >
              <ClearIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
            >
              <EyeIcon hidden={!showConfirmPassword} />
            </button>
          </div>
        </div>
        {passwordMismatch && (
          <p className="mt-1.5 text-sm text-red-500">两次输入的密码不一致</p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg border px-4 py-3 text-sm"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={resetting}
        className="w-full rounded-lg border px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resetting ? t("forgot.submitting") : t("forgot.submit")}
      </button>

      <a
        href={getBase()}
        className="block text-center text-sm underline"
      >
        {t("forgot.back_to_login")}
      </a>
    </form>
  );
}
