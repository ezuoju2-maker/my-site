import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { EyeIcon } from "./icons/EyeIcon";
import { ClearIcon } from "./icons/ClearIcon";
import CapWidget from "./CapWidget";
import { withBase } from "../lib/url";
import { Requirement } from "./Requirement";
import { useTranslation } from "../i18n/useTranslation";

const ENABLE_CAP_FOR_TEST = false;

export default function RegisterForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeError, setEmailCodeError] = useState("");
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(0);
  const sendingEmailCodeRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [capKey, setCapKey] = useState(0);
  const [agreement, setAgreement] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailCodeInputRef = useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [agreementError, setAgreementError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const validPasswordRules = Object.values(passwordRules).filter(
    Boolean,
  ).length;

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        label: t("register.strength_none"),
        percent: 0,
      };
    }

    if (validPasswordRules <= 2) {
      return {
        label: t("register.strength_weak"),
        percent: 35,
      };
    }

    if (validPasswordRules <= 4) {
      return {
        label: t("register.strength_medium"),
        percent: 65,
      };
    }

    return {
      label: t("register.strength_strong"),
      percent: 100,
    };
  }, [password, validPasswordRules, t]);


  function validateUsername(value: string) {
    if (!value.trim()) {
      return t("register.error.username_required");
    }

    if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
      return t("register.error.username_format");
    }

    return "";
  }

  function validateEmail(value: string) {
    if (!value.trim()) {
      return t("register.error.email_required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t("register.error.email_invalid");
    }

    return "";
  }

  function handleUsernameChange(value: string) {
    setUsername(value);

    if (!value) {
      setUsernameError("");
      return;
    }

    setUsernameError(validateUsername(value));
  }

  function handleEmailChange(value: string) {
    setEmail(value);

    if (!value) {
      setEmailError("");
      return;
    }

    setEmailError(validateEmail(value));
  }

  function handleEmailCodeChange(value: string) {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setEmailCode(cleanValue);

    if (emailCodeError) {
      setEmailCodeError("");
    }
  }

  async function handleSendEmailCode() {
    if (!email.trim()) {
      setEmailCodeError(t("register.error.email_required_first"));
      return;
    }

    const emailValidation = validateEmail(email);

    if (emailValidation) {
      setEmailCodeError(emailValidation);
      return;
    }

    if (emailCodeCooldown > 0 || sendingEmailCodeRef.current) {
      return;
    }

    if (ENABLE_CAP_FOR_TEST && !captchaToken) {
      setCaptchaError(t("register.error.captcha_required"));
      return;
    }

    setEmailCodeError("");
    sendingEmailCodeRef.current = true;

    // 点击后立即锁定按钮，避免网络延迟导致重复发送。
    setEmailCodeCooldown(60);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/send-code`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            captchaToken,
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        const retryAfter =
          typeof data?.retryAfter === "number"
            ? data.retryAfter
            : 60;

        const message =
          data?.error === "TOO_MANY_REQUESTS"
            ? t("register.error.wait_seconds").replace("{n}", String(retryAfter))
            : data?.error === "FORBIDDEN_ORIGIN"
              ? t("register.error.forbidden_origin")
              : data?.error === "EMAIL_SERVICE_NOT_CONFIGURED"
                ? t("register.error.email_service_not_configured")
                : data?.error === "EMAIL_PROVIDER_ERROR"
                  ? t("register.error.send_code_failed")
                  : data?.error === "EMAIL_PROVIDER_UNREACHABLE"
                    ? t("register.error.email_provider_unreachable")
                    : data?.error === "INVALID_EMAIL"
                      ? t("register.error.email_invalid")
                      : data?.error === "EMAIL_SEND_FAILED"
                        ? t("register.error.send_code_failed")
                        : t("register.error.send_code_failed");

        setEmailCodeError(message);

        if (data?.error === "CAPTCHA_FAILED") {
          setCaptchaToken("");
          setCapKey((k) => k + 1);
        }

        if (data?.error === "TOO_MANY_REQUESTS") {
          setEmailCodeCooldown(retryAfter);
        } else {
          setEmailCodeCooldown(0);
        }

        return;
      }

      setEmailCodeError("");
      setEmailCodeCooldown(60);
    } catch {
      setEmailCodeCooldown(0);
      setEmailCodeError(t("common.network_error"));
    } finally {
      sendingEmailCodeRef.current = false;
    }
  }

  useEffect(() => {
    if (emailCodeCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setEmailCodeCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [emailCodeCooldown]);

  function scrollToRegisterError(
    field: "username" | "email" | "emailCode",
  ) {
    const element =
      field === "username"
        ? usernameInputRef.current
        : field === "email"
          ? emailInputRef.current
          : emailCodeInputRef.current;

    if (!element) {
      return;
    }

    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      element.focus();
    });
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setPasswordError("");
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);

    if (!value) {
      setConfirmPasswordError("");
      return;
    }

    setConfirmPasswordError(
      value === password ? "" : t("register.error.password_mismatch"),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);

    const nextPasswordError = !password
      ? t("register.error.password_required")
      : validPasswordRules !== 5
        ? t("register.error.password_invalid")
        : "";

    const nextConfirmPasswordError = !confirmPassword
      ? t("register.error.confirm_password_required")
      : confirmPassword !== password
        ? t("register.error.password_mismatch")
        : "";

    const nextEmailCodeError = !emailCode.trim()
      ? t("register.error.email_code_required")
      : !/^\d{6}$/.test(emailCode)
        ? t("register.error.email_code_format")
        : "";

    const nextAgreementError = agreement
      ? ""
      : t("register.error.agreement_required");

    setUsernameError(usernameValidation);
    setEmailError(emailValidation);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setEmailCodeError(nextEmailCodeError);
    setAgreementError(nextAgreementError);

    if (
      usernameValidation ||
      emailValidation ||
      nextPasswordError ||
      nextConfirmPasswordError ||
      nextEmailCodeError ||
      nextAgreementError
    ) {
      if (usernameValidation) {
        scrollToRegisterError("username");
      } else if (emailValidation) {
        scrollToRegisterError("email");
      } else if (nextEmailCodeError) {
        scrollToRegisterError("emailCode");
      }

      return;
    }

    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
            emailCode: emailCode.trim(),
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        const error = data?.error;

        if (error === "USERNAME_EXISTS") {
          setUsernameError(t("register.error.username_exists"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "EMAIL_EXISTS") {
          setUsernameError("");
          setEmailError(t("register.error.email_exists"));
          setEmailCodeError("");
          scrollToRegisterError("email");
        } else if (error === "EMAIL_CODE_EXPIRED") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError(t("register.error.email_code_expired"));
          scrollToRegisterError("emailCode");
        } else if (error === "INVALID_EMAIL_CODE") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError(
            data?.attemptsRemaining
              ? t("register.error.email_code_invalid_with_attempts").replace("{n}", String(data.attemptsRemaining))
              : t("register.error.email_code_invalid"),
          );
          scrollToRegisterError("emailCode");
        } else if (error === "EMAIL_CODE_TOO_MANY_ATTEMPTS") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError(t("register.error.email_code_too_many"));
          scrollToRegisterError("emailCode");
        } else if (error === "CAPTCHA_FAILED") {
          setUsernameError(t("register.error.captcha_failed"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "FORBIDDEN_ORIGIN") {
          setUsernameError(t("register.error.forbidden_origin"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "SESSION_SERVICE_NOT_CONFIGURED") {
          setUsernameError(t("register.error.service_unavailable"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "REGISTRATION_FAILED") {
          setUsernameError(t("register.error.registration_failed"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else {
          setUsernameError(t("register.error.registration_failed"));
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        }

        setCaptchaToken("");
        setCapKey((k) => k + 1);
        return;
      }

      window.location.href = withBase(`register-success/?username=${encodeURIComponent(username.trim())}`);
    } catch {
      setUsernameError(t("common.network_error"));
      setCaptchaToken("");
      setCapKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="register-username"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("register.username")}
        </label>

        <div className="relative">
          <input
            id="register-username"
            ref={usernameInputRef}
            name="username"
            value={username}
            onChange={(event) =>
              handleUsernameChange(event.target.value)
            }
            type="text"
            autoComplete="username"
            maxLength={20}
            placeholder={t("register.error.username_required")}
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
            aria-label={t("register.username_clear")}
          >
            <ClearIcon />
          </button>
        </div>

        {usernameError ? (
          <p className="mt-1.5 text-sm text-red-500">
            {usernameError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs leading-5 text-neutral-500">
            3～20 个字符，支持字母、数字和下划线
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("register.email")}
        </label>

        <div className="relative">
          <input
            id="register-email"
            ref={emailInputRef}
            name="email"
            value={email}
            onChange={(event) =>
              handleEmailChange(event.target.value)
            }
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("register.error.email_required")}
            aria-invalid={Boolean(emailError)}
            className={`h-12 w-full rounded-lg bg-white px-4 pr-12 text-base outline-none ${
              emailError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <button
            type="button"
            onClick={() => {
              setEmail("");
              setEmailError("");
            }}
            disabled={!email}
            className={`absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full ${
              email
                ? "text-neutral-500"
                : "pointer-events-none text-transparent"
            }`}
            aria-label={t("register.email_clear")}
          >
            <ClearIcon />
          </button>
        </div>

        {emailError && (
          <p className="mt-1.5 text-sm text-red-500">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("register.password")}
        </label>

        <div className="relative">
          <input
            id="register-password"
            name="password"
            value={password}
            onChange={(event) =>
              handlePasswordChange(event.target.value)
            }
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={20}
            placeholder={t("register.error.password_required")}
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
              aria-label={t("register.password_clear")}
            >
              <ClearIcon />
            </button>

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showPassword ? t("register.password_hide") : t("register.password_show")}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
        </div>

        {passwordError && (
          <p className="mt-1.5 text-sm text-red-500">
            {passwordError}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">
          {t("register.password_requirements")}
        </p>

        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:text-sm">
          <Requirement valid={passwordRules.length}>
            {t("register.req_length")}
          </Requirement>

          <Requirement valid={passwordRules.uppercase}>
            {t("register.req_uppercase")}
          </Requirement>

          <Requirement valid={passwordRules.lowercase}>
            {t("register.req_lowercase")}
          </Requirement>

          <Requirement valid={passwordRules.number}>
            {t("register.req_number")}
          </Requirement>

          <Requirement valid={passwordRules.special}>
            {t("register.req_special")}
          </Requirement>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">
            {t("register.password_strength")}
          </span>

          <span
            className={`text-sm ${
              passwordStrength.label === t("register.strength_strong")
                ? "text-green-600"
                : passwordStrength.label === t("register.strength_medium")
                  ? "text-neutral-700"
                  : "text-neutral-500"
            }`}
          >
            {passwordStrength.label}
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={passwordStrength.percent}
          aria-label={t("register.password_strength")}
        >
          <div
            className="h-full rounded-full bg-neutral-800"
            style={{
              width: `${passwordStrength.percent}%`,
              transition: "width 120ms linear",
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("register.confirm_password")}
        </label>

        <div className="relative">
          <input
            id="register-confirm-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) =>
              handleConfirmPasswordChange(event.target.value)
            }
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={20}
            placeholder={t("register.error.confirm_password_required")}
            aria-invalid={Boolean(confirmPasswordError)}
            className={`h-12 w-full rounded-lg bg-white px-4 pr-24 text-base outline-none ${
              confirmPasswordError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
            <button
              type="button"
              onClick={() => {
                setConfirmPassword("");
                setConfirmPasswordError("");
              }}
              disabled={!confirmPassword}
              className={`flex h-10 w-10 items-center justify-center ${
                confirmPassword
                  ? "text-neutral-500"
                  : "pointer-events-none text-transparent"
              }`}
              aria-label={t("register.confirm_password_clear")}
            >
              <ClearIcon />
            </button>

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((value) => !value)
              }
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={
                showConfirmPassword
                  ? t("register.confirm_password_hide")
                  : t("register.confirm_password_show")
              }
            >
              <EyeIcon hidden={!showConfirmPassword} />
            </button>
          </div>
        </div>

        {confirmPasswordError && (
          <p className="mt-1.5 text-sm text-red-500">
            {confirmPasswordError}
          </p>
        )}
      </div>

      {/* 邮箱验证码 */}
      <div>
        <label
          htmlFor="register-email-code"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {t("register.email_code")}
        </label>

        <div className="flex h-12 w-full gap-2">
          <input
            id="register-email-code"
            ref={emailCodeInputRef}
            name="emailCode"
            value={emailCode}
            onChange={(event) =>
              handleEmailCodeChange(event.target.value)
            }
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("register.error.email_code_required")}
            aria-invalid={Boolean(emailCodeError)}
            className={`min-w-0 flex-1 rounded-lg bg-white px-4 text-base outline-none ${
              emailCodeError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <button
            type="button"
            onClick={handleSendEmailCode}
            disabled={emailCodeCooldown > 0}
            className="h-12 w-[108px] shrink-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emailCodeCooldown > 0
              ? t("register.resend_in_seconds").replace("{n}", String(emailCodeCooldown))
              : t("register.send_code")}
          </button>
        </div>

        {emailCodeError && (
          <p className="mt-1.5 text-sm text-red-500">
            {emailCodeError}
          </p>
        )}
      </div>

      {/* 人机验证 */}
      {ENABLE_CAP_FOR_TEST && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            {t("register.captcha")}
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

      <div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={agreement}
            onChange={(event) => {
              setAgreement(event.target.checked);
              if (event.target.checked) {
                setAgreementError("");
              }
            }}
            className="h-4 w-4 rounded border-neutral-300"
          />

          <span>
            {t("register.agreement_prefix")}
            <a
              href="#"
              onClick={(event) => event.stopPropagation()}
              className="mx-1 font-medium text-neutral-800 underline underline-offset-4"
            >
              {t("register.agreement_link")}
            </a>
          </span>
        </label>

        {agreementError && (
          <p className="mt-1.5 text-sm text-red-500">
            {agreementError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-neutral-900 px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("register.submitting") : t("register.submit")}
      </button>

      <p className="pt-1 text-center text-sm text-neutral-500">
        {t("register.have_account")}
        <a
          href={withBase("")}
          className="ml-1 font-medium text-neutral-800 underline underline-offset-4"
        >
          {t("register.login")}
        </a>
      </p>
    </form>
  );
}
