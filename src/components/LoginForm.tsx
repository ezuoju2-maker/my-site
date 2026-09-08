import { useEffect, useRef, useState, type FormEvent } from "react";

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

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
      <path d="M21 20v-5h-5" />
    </svg>
  );
}

/* 演示用验证码：正式登录时会改成 Worker + KV 服务器验证码 */
const CAPTCHA_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function createCaptcha() {
  const result: string[] = [];

  while (result.length < 5) {
    const char =
      CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];

    if (!result.includes(char)) {
      result.push(char);
    }
  }

  return result;
}

function CaptchaImage({
  characters,
  refreshKey,
}: {
  characters: string[];
  refreshKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 256;
    const height = 88;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 70; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = i % 4 === 0 ? 1.4 : 0.7;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? "#555555" : "#888888";
      ctx.globalAlpha = i % 3 === 0 ? 0.58 : 0.32;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(2, 18);
    ctx.bezierCurveTo(45, 65, 72, 8, 128, 45);
    ctx.bezierCurveTo(170, 75, 205, 10, 254, 62);
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.62;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, 70);
    ctx.bezierCurveTo(48, 10, 82, 78, 135, 28);
    ctx.bezierCurveTo(180, 4, 212, 72, 254, 14);
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.68;
    ctx.stroke();

    ctx.globalAlpha = 1;

    const rotations = [-8, 6, -5, 7, -6];

    characters.forEach((char, index) => {
      const x = 26 + index * 51;
      const y = 57 + (index % 2 === 0 ? -4 : 4);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotations[index] * Math.PI) / 180);

      ctx.font = '700 40px Arial, "Helvetica Neue", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = index % 2 === 0 ? "#111111" : "#333333";
      ctx.fillText(char, 0, 0);

      ctx.restore();
    });
  }, [characters, refreshKey]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="图文验证码"
      className="h-full w-full rounded-lg"
      style={{
        display: "block",
        background: "#ffffff",
        colorScheme: "light",
        forcedColorAdjust: "none",
      }}
    />
  );
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [captchaCharacters, setCaptchaCharacters] = useState(() =>
    createCaptcha(),
  );

  const [captchaKey, setCaptchaKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  function refreshCaptcha() {
    setCaptchaCharacters(createCaptcha());
    setCaptchaKey((value) => value + 1);
    setCaptcha("");
    setCaptchaError("");
  }

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

  function handleCaptchaChange(value: string) {
    setCaptcha(value);
    if (value.trim()) {
      setCaptchaError("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setUsernameError("");
    setPasswordError("");
    setCaptchaError("");

    let hasError = false;

    if (!username.trim()) {
      setUsernameError("请输入用户名或邮箱");
      hasError = true;
    }

    if (!password) {
      setPasswordError("请输入密码");
      hasError = true;
    }

    if (!captcha.trim()) {
      setCaptchaError("请输入验证码");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // 收起手机键盘
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setLoading(true);

    // 目前只是演示登录流程。
    // 后续接入 Cloudflare Worker 后，这里会改成真实 API 请求。
    window.setTimeout(() => {
      setLoading(false);
      alert("登录功能正在开发中");
    }, 700);
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
            placeholder="请输入用户名或邮箱"
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
            aria-label="清除用户名或邮箱"
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
              onClick={() => setShowPassword((value) => !value)}
              className="flex h-10 w-10 items-center justify-center text-neutral-500"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
        </div>

        {passwordError && (
          <p className="mt-1.5 text-sm text-red-500">{passwordError}</p>
        )}
      </div>

      {/* 验证码 */}
      <div>
        <label
          htmlFor="captcha"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          验证码
        </label>

        <div className="flex h-12 w-full gap-2">
          <input
            id="captcha"
            name="captcha"
            value={captcha}
            onChange={(event) => handleCaptchaChange(event.target.value)}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={5}
            placeholder="请输入验证码"
            aria-invalid={Boolean(captchaError)}
            className={`min-w-0 flex-1 rounded-lg bg-white px-4 text-base outline-none ${
              captchaError
                ? "border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            }`}
          />

          <div className="h-12 w-[118px] shrink-0 overflow-hidden rounded-lg border border-neutral-300 bg-white">
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
          <p className="mt-1.5 text-sm text-red-500">{captchaError}</p>
        )}
      </div>

      {/* 记住登录 / 忘记密码 */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-neutral-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          记住登录
        </label>

        <a
          href="#"
          className="py-2 text-neutral-600 underline-offset-4"
        >
          忘记密码？
        </a>
      </div>

      {/* 登录按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-neutral-900 px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "登录中…" : "登录"}
      </button>

      <p className="pt-1 text-center text-sm text-neutral-500">
        还没有账号？{" "}
        <a
          href={`${import.meta.env.BASE_URL}register/`}
          className="font-medium text-neutral-800 underline underline-offset-4"
        >
          注册
        </a>
      </p>
    </form>
  );
}
