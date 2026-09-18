import { useState } from "react";
import LoginForm from "./LoginForm";
import EmailCodeLoginForm from "./EmailCodeLoginForm";
import { API_BASE_URL } from "../lib/api";

type Method = "password" | "emailcode" | "github" | "passkey";

const METHODS: { id: Method; label: string; icon: string }[] = [
  { id: "password", label: "密码", icon: "🔒" },
  { id: "emailcode", label: "验证码", icon: "✉️" },
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "passkey", label: "Passkey", icon: "🔑" },
];

export default function LoginMethodTabs() {
  const [method, setMethod] = useState<Method>("password");
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
      const credential = await startAuthentication({ optionsJSON: optData.options });

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
        // 用户取消
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
        {METHODS.map((m) => (
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
            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition-colors ${
              method === m.id && (m.id === "password" || m.id === "emailcode")
                ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400"
            }`}
          >
            <span className="text-base leading-none">{m.icon}</span>
            <span className="leading-none">{m.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {method === "password" && <LoginForm />}
      {method === "emailcode" && <EmailCodeLoginForm />}

      {passkeyLoading && (
        <p className="mt-2 text-center text-xs text-neutral-500">正在调用 Passkey…</p>
      )}
      {passkeyError && (
        <p className="mt-2 text-center text-sm text-red-500">{passkeyError}</p>
      )}
    </div>
  );
}
