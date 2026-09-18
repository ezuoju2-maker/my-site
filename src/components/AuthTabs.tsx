import { useState } from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { API_BASE_URL } from "../lib/api";
import PasskeyEmailModal from "./PasskeyEmailModal";

type LoginMethod = "account" | "emailuser" | "github" | "passkey";
type RegisterMethod = "account-reg" | "email-reg" | "github-reg" | "passkey-reg";
type View = "auth" | "login-form" | "register-form";
type IconName = "lock" | "mail" | "github" | "fingerprint" | "arrow-left" | "chevron-right";

const LOGIN_METHODS: { id: LoginMethod; label: string; desc: string; icon: IconName }[] = [
  { id: "account", label: "账密登录", desc: "账号 + 密码", icon: "lock" },
  { id: "emailuser", label: "邮箱登录", desc: "邮箱 + 密码", icon: "mail" },
  { id: "github", label: "GitHub 登录", desc: "使用 GitHub 账号快速登录", icon: "github" },
  { id: "passkey", label: "Passkey 登录", desc: "使用指纹 / 面容 / 设备 PIN", icon: "fingerprint" },
];

const REGISTER_METHODS: { id: RegisterMethod; label: string; desc: string; icon: IconName }[] = [
  { id: "account-reg", label: "账密注册", desc: "创建账号 + 密码", icon: "lock" },
  { id: "email-reg", label: "邮箱注册", desc: "邮箱 + 密码", icon: "mail" },
  { id: "github-reg", label: "GitHub 注册", desc: "使用 GitHub 账号快速注册", icon: "github" },
  { id: "passkey-reg", label: "Passkey 注册", desc: "使用指纹 / 面容 / 设备 PIN", icon: "fingerprint" },
];

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "lock":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case "fingerprint":
      return (
        <svg viewBox="0 0 24 24" {...common} className={className}>
          <path d="M7 3H5a2 2 0 0 0-2 2v2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
          <path d="M9 10v1" />
          <path d="M15 10v1" />
          <path d="M9 15s1.2 1.5 3 1.5 3-1.5 3-1.5" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg viewBox="0 0 24 24" {...common} strokeWidth={2} className={className}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg viewBox="0 0 24 24" {...common} strokeWidth={2} className={className}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

export default function AuthTabs() {
  const [view, setView] = useState<View>("auth");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod | null>(null);
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [showPasskeyEmailModal, setShowPasskeyEmailModal] = useState(false);

  // ============ Passkey 登录 ============
  async function handlePasskeyLogin() {
    setPasskeyError("");
    setPasskeyLoading(true);
    try {
      const optRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const optData = (await optRes.json()) as { challengeId?: string; options?: unknown; error?: string };
      if (!optData.challengeId || !optData.options) throw new Error(optData.error || "获取选项失败");

      const { startAuthentication } = await import("@simplewebauthn/browser");
      const credential = await startAuthentication({ optionsJSON: optData.options as never });

      const verRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login-verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optData.challengeId, credential }),
      });
      const verData = (await verRes.json()) as { ok?: boolean; error?: string };
      if (!verData.ok) throw new Error(verData.error || "登录失败");

      window.location.href = "/welcome/";
    } catch (e: any) {
      const name = e?.name || "";
      if (name !== "AbortError" && name !== "NotAllowedError") {
        setPasskeyError("Passkey 登录失败，请重试");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  // ============ Passkey 注册 ============
  async function handlePasskeyRegister(email: string) {
    setShowPasskeyEmailModal(false);
    setPasskeyError("");
    setPasskeyLoading(true);
    try {
      const optRes = await fetch(`${API_BASE_URL}/api/auth/passkey/register-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const optData = (await optRes.json()) as { challengeId?: string; options?: unknown; error?: string };
      if (!optData.challengeId || !optData.options) throw new Error(optData.error || "获取选项失败");

      const { startRegistration } = await import("@simplewebauthn/browser");
      const credential = await startRegistration({ optionsJSON: optData.options as never });

      const verRes = await fetch(`${API_BASE_URL}/api/auth/passkey/register-verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optData.challengeId, credential }),
      });
      const verData = (await verRes.json()) as { ok?: boolean; error?: string };
      if (!verData.ok) throw new Error(verData.error || "注册失败");

      window.location.href = "/welcome/";
    } catch (e: any) {
      const name = e?.name || "";
      if (name !== "AbortError" && name !== "NotAllowedError") {
        setPasskeyError("Passkey 注册失败，请重试");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  // ============ 登录方式点击 ============
  function handleLoginClick(id: LoginMethod) {
    if (id === "github") {
      window.location.href = `${API_BASE_URL}/api/auth/github`;
      return;
    }
    if (id === "passkey") {
      void handlePasskeyLogin();
      return;
    }
    setLoginMethod(id);
    setView("login-form");
  }

  // ============ 注册方式点击 ============
  function handleRegisterClick(id: RegisterMethod) {
    if (id === "github-reg") {
      window.location.href = `${API_BASE_URL}/api/auth/github`;
      return;
    }
    if (id === "passkey-reg") {
      setShowPasskeyEmailModal(true);
      return;
    }
    setRegisterMethod(id);
    setView("register-form");
  }

  function goBack() {
    setView("auth");
    setLoginMethod(null);
    setRegisterMethod(null);
    setPasskeyError("");
  }

  // ============ 选择页 ============
  if (view === "auth") {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {/* 一级 Tab */}
        <div className="flex border-b border-neutral-100">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "login" ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            登录
            {tab === "login" && (
              <span className="absolute inset-x-8 -bottom-px h-0.5 rounded-full bg-neutral-900" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "register" ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            注册
            {tab === "register" && (
              <span className="absolute inset-x-8 -bottom-px h-0.5 rounded-full bg-neutral-900" />
            )}
          </button>
        </div>

        {/* 方式列表 */}
        <div className="space-y-2 p-4">
          {tab === "login"
            ? LOGIN_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleLoginClick(m.id)}
                  disabled={passkeyLoading && m.id === "passkey"}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <Icon name={m.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-neutral-900">{m.label}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{m.desc}</span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-neutral-400" />
                </button>
              ))
            : REGISTER_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleRegisterClick(m.id)}
                  disabled={passkeyLoading && m.id === "passkey-reg"}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <Icon name={m.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-neutral-900">{m.label}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{m.desc}</span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-neutral-400" />
                </button>
              ))}
        </div>

        {tab === "login" && (
          <div className="border-t border-neutral-100 pt-3 pb-1">
            <a
              href="/passkey/recover/"
              className="flex items-center justify-center gap-1 py-2 text-xs text-neutral-500 hover:text-neutral-800"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              换设备了？用邮箱找回 Passkey
            </a>
          </div>
        )}

        {passkeyLoading && (
          <p className="px-4 pb-3 text-center text-xs text-neutral-500">正在调用 Passkey…</p>
        )}
        {passkeyError && (
          <p className="px-4 pb-3 text-center text-sm text-red-500">{passkeyError}</p>
        )}

        {showPasskeyEmailModal && (
          <PasskeyEmailModal
            onClose={() => setShowPasskeyEmailModal(false)}
            onConfirm={(email) => handlePasskeyRegister(email)}
          />
        )}
      </div>
    );
  }

  // ============ 登录表单页 ============
  if (view === "login-form") {
    const title = loginMethod === "account" ? "账密登录" : "邮箱登录";
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3">
          <button
            type="button"
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
            aria-label="返回"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-medium text-neutral-900">{title}</h2>
        </div>
        <div className="p-5">
          {loginMethod === "account" ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-neutral-700">账密登录 · 开发中</p>
              <p className="mt-1 text-xs text-neutral-400">此功能即将上线</p>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    );
  }

  // ============ 注册表单页 ============
  const regTitle = registerMethod === "account-reg" ? "账密注册" : "邮箱注册";
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="返回"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium text-neutral-900">{regTitle}</h2>
      </div>
      <div className="p-5">
        {registerMethod === "account-reg" ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-neutral-700">账密注册 · 开发中</p>
            <p className="mt-1 text-xs text-neutral-400">此功能即将上线</p>
          </div>
        ) : (
          <RegisterForm />
        )}
      </div>
    </div>
  );
}
