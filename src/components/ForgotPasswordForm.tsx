import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import CapWidget from "./CapWidget";
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
  const [captchaError, setCaptchaError] = useState("");
  const [capKey, setCapKey] = useState(0);

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

        <div className="flex gap-2">
          <input
            ref={codeRef}
            id="forgot-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={emailCode}
            onChange={(event) =>
              setEmailCode(
                event.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
            placeholder={t("forgot.email_code_placeholder")}
            className="min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none"
            disabled={loading || resetting}
          />

          <button
            type="button"
            onClick={sendCode}
            disabled={loading || resetting || countdown > 0}
            className="shrink-0 rounded-lg border px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? t("forgot.send_code_sending")
              : countdown > 0
                ? `${countdown}s`
                : codeSent
                  ? t("forgot.send_code_resend")
                  : t("forgot.send_code")}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="forgot-password"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.new_password")}
        </label>

        <input
          ref={passwordRef}
          id="forgot-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={t("forgot.error.NEW_PASSWORD_REQUIRED")}
          className="w-full rounded-lg border px-4 py-3 outline-none"
          disabled={loading || resetting}
        />
      </div>

      <div>
        <label
          htmlFor="forgot-confirm-password"
          className="mb-2 block text-sm font-medium"
        >
          {t("forgot.confirm_password")}
        </label>

        <input
          ref={confirmPasswordRef}
          id="forgot-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={t("forgot.confirm_password_placeholder")}
          className="w-full rounded-lg border px-4 py-3 outline-none"
          disabled={loading || resetting}
        />
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
