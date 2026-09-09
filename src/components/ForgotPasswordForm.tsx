import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";

const RESEND_COOLDOWN_SECONDS = 60;

const API_BASE_URL = "https://my-site-n7j.pages.dev";

function getErrorMessage(error: string, attemptsRemaining?: number) {
  switch (error) {
    case "INVALID_EMAIL":
      return "请输入有效的邮箱地址";
    case "EMAIL_CODE_EXPIRED":
      return "邮箱验证码已过期，请重新获取验证码";
    case "INVALID_EMAIL_CODE":
      return attemptsRemaining
        ? `邮箱验证码错误，还可尝试 ${attemptsRemaining} 次`
        : "邮箱验证码错误";
    case "EMAIL_CODE_TOO_MANY_ATTEMPTS":
      return "邮箱验证码错误次数过多，请重新获取验证码";
    case "INVALID_PASSWORD":
      return "新密码长度必须为 8～128 个字符";
    case "TOO_MANY_REQUESTS":
      return "请求过于频繁，请稍后再试";
    case "EMAIL_SERVICE_NOT_CONFIGURED":
      return "邮箱服务暂时不可用，请稍后再试";
    case "EMAIL_PROVIDER_ERROR":
    case "EMAIL_PROVIDER_UNREACHABLE":
      return "验证码发送失败，请稍后再试";
    case "PASSWORD_RESET_FAILED":
      return "密码重置失败，请重新获取验证码后再试";
    default:
      return "操作失败，请稍后再试";
  }
}

export default function ForgotPasswordForm() {
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
      showError("请输入有效的邮箱地址", emailRef);
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
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        showError(
          getErrorMessage(
            data?.error ?? "UNKNOWN_ERROR",
            data?.attemptsRemaining,
          ),
          emailRef,
        );
        return;
      }

      setEmail(normalizedEmail);
      setCodeSent(true);
      setCountdown(
        Number(data.retryAfter) || RESEND_COOLDOWN_SECONDS,
      );
      setSuccess("验证码已发送，请检查邮箱");

      window.setTimeout(() => {
        codeRef.current?.focus();
      }, 0);
    } catch {
      showError("网络请求失败，请检查网络后重试", emailRef);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    const code = emailCode.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showError("请输入有效的邮箱地址", emailRef);
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showError("请输入 6 位邮箱验证码", codeRef);
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      showError("新密码长度必须为 8～128 个字符", passwordRef);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("两次输入的新密码不一致", confirmPasswordRef);
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

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        showError(
          getErrorMessage(
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

      setSuccess("密码重置成功，请使用新密码登录");

      setEmailCode("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        window.location.href = `${import.meta.env.BASE_URL}`;
      }, 1500);
    } catch {
      showError("网络请求失败，请稍后再试");
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
          邮箱
        </label>

        <input
          ref={emailRef}
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="请输入注册邮箱"
          className="w-full rounded-lg border px-4 py-3 outline-none"
          disabled={loading || resetting}
        />
      </div>

      <div>
        <label
          htmlFor="forgot-code"
          className="mb-2 block text-sm font-medium"
        >
          邮箱验证码
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
            placeholder="6 位验证码"
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
              ? "发送中…"
              : countdown > 0
                ? `${countdown}s`
                : codeSent
                  ? "重新获取"
                  : "获取验证码"}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="forgot-password"
          className="mb-2 block text-sm font-medium"
        >
          新密码
        </label>

        <input
          ref={passwordRef}
          id="forgot-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="请输入新密码"
          className="w-full rounded-lg border px-4 py-3 outline-none"
          disabled={loading || resetting}
        />
      </div>

      <div>
        <label
          htmlFor="forgot-confirm-password"
          className="mb-2 block text-sm font-medium"
        >
          确认新密码
        </label>

        <input
          ref={confirmPasswordRef}
          id="forgot-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="请再次输入新密码"
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
        {resetting ? "重置中…" : "重置密码"}
      </button>

      <a
        href={import.meta.env.BASE_URL}
        className="block text-center text-sm underline"
      >
        返回登录
      </a>
    </form>
  );
}
