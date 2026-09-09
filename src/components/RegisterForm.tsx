import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { EyeIcon } from "./icons/EyeIcon";
import { ClearIcon } from "./icons/ClearIcon";
import { RefreshIcon } from "./icons/RefreshIcon";
import { CaptchaImage, createCaptcha } from "./CaptchaImage";
import { Requirement } from "./Requirement";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeError, setEmailCodeError] = useState("");
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(0);
  const sendingEmailCodeRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [agreement, setAgreement] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [captchaCharacters, setCaptchaCharacters] = useState(() =>
    createCaptcha(),
  );
  const [captchaKey, setCaptchaKey] = useState(0);

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
        label: "未设置",
        percent: 0,
      };
    }

    if (validPasswordRules <= 2) {
      return {
        label: "弱",
        percent: 35,
      };
    }

    if (validPasswordRules <= 4) {
      return {
        label: "中等",
        percent: 65,
      };
    }

    return {
      label: "强",
      percent: 100,
    };
  }, [password, validPasswordRules]);

  function refreshCaptcha() {
    setCaptchaCharacters(createCaptcha());
    setCaptchaKey((value) => value + 1);
    setCaptcha("");
    setCaptchaError("");
  }

  function validateUsername(value: string) {
    if (!value.trim()) {
      return "请输入用户名";
    }

    if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
      return "用户名为 3～20 个字符，仅支持字母、数字和下划线";
    }

    return "";
  }

  function validateEmail(value: string) {
    if (!value.trim()) {
      return "请输入邮箱地址";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "请输入正确的邮箱地址";
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
      setEmailCodeError("请先输入邮箱");
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

    setEmailCodeError("");
    sendingEmailCodeRef.current = true;

    // 点击后立即锁定按钮，避免网络延迟导致重复发送。
    setEmailCodeCooldown(60);

    try {
      const response = await fetch(
        "https://my-site-n7j.pages.dev/api/auth/send-code",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const retryAfter =
          typeof data?.retryAfter === "number"
            ? data.retryAfter
            : 60;

        const message =
          data?.error === "TOO_MANY_REQUESTS"
            ? `请等待 ${retryAfter} 秒后再试`
            : data?.error === "FORBIDDEN_ORIGIN"
              ? "请求来源不被允许"
              : data?.error === "EMAIL_SERVICE_NOT_CONFIGURED"
                ? "邮箱服务尚未配置"
                : data?.error === "EMAIL_PROVIDER_ERROR"
                  ? "验证码发送失败，请稍后重试"
                  : data?.error === "EMAIL_PROVIDER_UNREACHABLE"
                    ? "邮箱服务暂时无法连接，请稍后重试"
                    : data?.error === "INVALID_EMAIL"
                      ? "请输入正确的邮箱地址"
                      : data?.error === "EMAIL_SEND_FAILED"
                        ? "验证码发送失败，请稍后重试"
                        : "验证码发送失败，请稍后重试";

        setEmailCodeError(message);

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
      setEmailCodeError("网络连接失败，请检查网络后重试");
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
      value === password ? "" : "两次输入的密码不一致",
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
      ? "请输入密码"
      : validPasswordRules !== 5
        ? "密码不符合要求"
        : "";

    const nextConfirmPasswordError = !confirmPassword
      ? "请再次输入密码"
      : confirmPassword !== password
        ? "两次输入的密码不一致"
        : "";

    const nextEmailCodeError = !emailCode.trim()
      ? "请输入邮箱验证码"
      : !/^\d{6}$/.test(emailCode)
        ? "请输入 6 位数字邮箱验证码"
        : "";

    const nextCaptchaError = !captcha.trim()
      ? "请输入验证码"
      : "";

    const nextAgreementError = agreement
      ? ""
      : "请先阅读并同意用户协议";

    setUsernameError(usernameValidation);
    setEmailError(emailValidation);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setEmailCodeError(nextEmailCodeError);
    setCaptchaError(nextCaptchaError);
    setAgreementError(nextAgreementError);

    if (
      usernameValidation ||
      emailValidation ||
      nextPasswordError ||
      nextConfirmPasswordError ||
      nextEmailCodeError ||
      nextCaptchaError ||
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
        "https://my-site-n7j.pages.dev/api/auth/register",
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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = data?.error;

        if (error === "USERNAME_EXISTS") {
          setUsernameError("用户名已存在");
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "EMAIL_EXISTS") {
          setUsernameError("");
          setEmailError("该邮箱已被注册");
          setEmailCodeError("");
          scrollToRegisterError("email");
        } else if (error === "EMAIL_CODE_EXPIRED") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError("邮箱验证码已过期，请重新获取验证码");
          scrollToRegisterError("emailCode");
        } else if (error === "INVALID_EMAIL_CODE") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError(
            data?.attemptsRemaining
              ? `邮箱验证码错误，还可尝试 ${data.attemptsRemaining} 次`
              : "邮箱验证码错误",
          );
          scrollToRegisterError("emailCode");
        } else if (error === "EMAIL_CODE_TOO_MANY_ATTEMPTS") {
          setUsernameError("");
          setEmailError("");
          setEmailCodeError("邮箱验证码错误次数过多，请重新获取验证码");
          scrollToRegisterError("emailCode");
        } else if (error === "FORBIDDEN_ORIGIN") {
          setUsernameError("请求来源不被允许");
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "SESSION_SERVICE_NOT_CONFIGURED") {
          setUsernameError("注册服务暂时不可用，请稍后重试");
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else if (error === "REGISTRATION_FAILED") {
          setUsernameError("注册失败，请稍后重试");
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        } else {
          setUsernameError("注册失败，请稍后重试");
          setEmailError("");
          setEmailCodeError("");
          scrollToRegisterError("username");
        }

        refreshCaptcha();
        return;
      }

      window.location.href = `${import.meta.env.BASE_URL}register-success/`;
    } catch {
      setUsernameError("网络连接失败，请检查网络后重试");
      refreshCaptcha();
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
          用户名
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
            placeholder="请输入用户名"
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
            aria-label="清除用户名"
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
          邮箱
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
            placeholder="请输入邮箱地址"
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
            aria-label="清除邮箱"
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
          密码
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
            placeholder="请输入密码"
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
              aria-label="清除密码"
            >
              <ClearIcon />
            </button>

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
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
          密码要求
        </p>

        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:text-sm">
          <Requirement valid={passwordRules.length}>
            8～20 个字符
          </Requirement>

          <Requirement valid={passwordRules.uppercase}>
            大写字母
          </Requirement>

          <Requirement valid={passwordRules.lowercase}>
            小写字母
          </Requirement>

          <Requirement valid={passwordRules.number}>
            数字
          </Requirement>

          <Requirement valid={passwordRules.special}>
            特殊符号
          </Requirement>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">
            密码强度
          </span>

          <span
            className={`text-sm ${
              passwordStrength.label === "强"
                ? "text-green-600"
                : passwordStrength.label === "中等"
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
          aria-label="密码强度"
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
          确认密码
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
            placeholder="请再次输入密码"
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
              aria-label="清除确认密码"
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
                  ? "隐藏确认密码"
                  : "显示确认密码"
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
          邮箱验证码
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
            placeholder="请输入邮箱验证码"
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
              ? `${emailCodeCooldown} 秒后重发`
              : "获取验证码"}
          </button>
        </div>

        {emailCodeError && (
          <p className="mt-1.5 text-sm text-red-500">
            {emailCodeError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-captcha"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          验证码
        </label>

        <div className="flex h-12 w-full gap-2">
          <input
            id="register-captcha"
            name="captcha"
            value={captcha}
            onChange={(event) => {
              setCaptcha(event.target.value);
              if (event.target.value.trim()) {
                setCaptchaError("");
              }
            }}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={4}
            placeholder="请输入验证码"
            aria-invalid={Boolean(captchaError)}
            className={`min-w-0 flex-1 rounded-lg bg-white px-4 text-base outline-none ${
              captchaError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <div className="h-12 w-[96px] shrink-0 overflow-hidden rounded-lg border border-neutral-300 bg-white">
            <CaptchaImage
              characters={captchaCharacters}
              refreshKey={captchaKey}
            />
          </div>

          <button
            type="button"
            onClick={refreshCaptcha}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600"
            aria-label="刷新验证码"
          >
            <RefreshIcon />
          </button>
        </div>

        {captchaError && (
          <p className="mt-1.5 text-sm text-red-500">
            {captchaError}
          </p>
        )}
      </div>

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
            我已阅读并同意
            <a
              href="#"
              onClick={(event) => event.stopPropagation()}
              className="mx-1 font-medium text-neutral-800 underline underline-offset-4"
            >
              用户协议
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
        {loading ? "注册中…" : "注 册"}
      </button>

      <p className="pt-1 text-center text-sm text-neutral-500">
        已有账号？
        <a
          href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/`}
          className="ml-1 font-medium text-neutral-800 underline underline-offset-4"
        >
          登录
        </a>
      </p>
    </form>
  );
}
