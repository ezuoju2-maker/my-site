import { useState } from "react";
import LoginForm from "./LoginForm";
import { API_BASE_URL } from "../lib/api";

type Method = "account" | "emailuser" | "github" | "passkey";

const METHODS: { id: Method; label: string; icon: string }[] = [
  { id: "account", label: "账密登录", icon: "🔐" },
  { id: "emailuser", label: "邮箱/用户名", icon: "✉️" },
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "passkey", label: "Passkey", icon: "🔑" },
];

export default function LoginMethodTabs() {
  const [method, setMethod] = useState<Method>("emailuser");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

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
      if (name === "AbortError" || name === "NotAllowedError") {
        // 用户主动取消，不显示错误
      } else {
        setPasskeyError("Passkey 登录失败，请重试");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <div>
      {/* 4 个方式选择器 */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {METHODS.map((m) => {
          const active = (method === m.id) && (m.id === "account" || m.id === "emailuser");
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.id === "github") {
                  window.location.href = `${API_BASE_URL}/api/auth/github`;
                  return;
                }
                if (m.id === "passkey") {
                  handlePasskeyLogin();
                  return;
                }
                setMethod(m.id);
              }}
              className={`flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2.5 text-[11px] transition-colors ${
                active
                  ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400"
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <span className="leading-none">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* 内容区 */}
      {method === "account" && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
          <p className="text-sm text-neutral-500">账密登录 · 开发中</p>
          <p className="mt-1 text-xs text-neutral-400">此功能即将上线</p>
        </div>
      )}
      {method === "emailuser" && <LoginForm />}

      {passkeyLoading && (
        <p className="mt-2 text-center text-xs text-neutral-500">正在调用 Passkey…</p>
      )}
      {passkeyError && (
        <p className="mt-2 text-center text-sm text-red-500">{passkeyError}</p>
      )}
    </div>
  );
}
