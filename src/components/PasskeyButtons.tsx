import { useEffect, useState } from "react";
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { API_BASE_URL } from "../lib/api";
import { withBase } from "../lib/url";

function translatePasskeyError(e: unknown): string {
  if (!e) return "操作失败，请重试";

  const err = e as { name?: string; message?: string };
  const name = err.name || "";
  const raw = err.message || "";
  const msg = raw.toLowerCase();

  // === 用户主动取消 / 被拒绝 ===
  // 覆盖：NotAllowedError、AbortError、SecurityError 里的拒绝场景
  if (name === "AbortError") return "";
  if (name === "NotAllowedError") {
    // 包含 "not allowed" / "denied" / "cancel" / "no credentials" 都视为取消
    if (
      msg.includes("not allowed") ||
      msg.includes("denied") ||
      msg.includes("cancel") ||
      msg.includes("user denied") ||
      msg.includes("no credentials") ||
      msg.includes("not found")
    ) {
      return "";
    }
    return "该设备暂时无法使用 Passkey，请检查系统设置后重试";
  }

  // 直接扫 message（不依赖 name）
  if (msg.includes("user agent") || msg.includes("not allowed by the user agent")) {
    return "";
  }
  if (msg.includes("cancel") || msg.includes("user canceled")) {
    return "";
  }

  // === 其他已知错误 ===
  if (name === "SecurityError") {
    return "当前环境不安全（需要 HTTPS），或浏览器禁止了 Passkey";
  }
  if (name === "NotSupportedError") {
    return "此设备或浏览器不支持 Passkey";
  }
  if (name === "InvalidStateError") {
    return "此设备已经注册过 Passkey，请直接点「使用 Passkey 登录」";
  }
  if (name === "TimeoutError") {
    return "验证超时，请重试";
  }
  if (name === "ConstraintError") {
    return "设备不满足注册要求（需要指纹、面容或设备 PIN）";
  }
  if (name === "UnknownError") {
    return "设备验证失败，请重试";
  }

  // === 后端返回的错误码 ===
  if (raw.includes("CHALLENGE_NOT_FOUND")) return "验证已过期，请重试";
  if (raw.includes("CHALLENGE_EXPIRED")) return "验证已过期，请重试";
  if (raw.includes("PASSKEY_NOT_FOUND")) return "此设备未注册 Passkey，请先注册";
  if (raw.includes("NOT_VERIFIED")) return "验证失败，请重试";
  if (raw.includes("VERIFICATION_FAILED")) return "验证失败，请重试";
  if (raw.includes("USER_NOT_FOUND")) return "用户不存在";
  if (raw.includes("EMAIL_REQUIRED")) return "请输入邮箱";
  if (raw.includes("CHALLENGE_")) return "验证已过期，请重试";

  return "操作失败，请重试";
}

export default function PasskeyButtons() {
  const [loading, setLoading] = useState<"register" | "login" | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [supports, setSupports] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 第 1 层：浏览器是否有 WebAuthn API
        const apiOk = browserSupportsWebAuthn();
        if (!apiOk) {
          if (!cancelled) setSupports(false);
          return;
        }

        // 第 2 层：设备是否真的有平台验证器（指纹/面容/PIN）
        if (
          typeof PublicKeyCredential !== "undefined" &&
          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ) {
          const uvpaa =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (!cancelled) setSupports(uvpaa);
        } else {
          // 没有这个 API → 保守认为不支持
          if (!cancelled) setSupports(false);
        }
      } catch {
        if (!cancelled) setSupports(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openModal() {
    setError("");
    setEmailInput("");
    setShowModal(true);
  }

  function closeModal() {
    if (loading === "register") return;
    setShowModal(false);
    setEmailInput("");
  }

  async function submitRegister() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    setError("");
    setLoading("register");
    try {
      const optRes = await fetch(`${API_BASE_URL}/api/auth/passkey/register-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const optData = (await optRes.json()) as {
        challengeId?: string;
        options?: unknown;
        error?: string;
      };
      if (optData.error || !optData.challengeId || !optData.options) {
        throw new Error(optData.error || "获取选项失败");
      }

      const credential = await startRegistration({ optionsJSON: optData.options as never });

      const verRes = await fetch(`${API_BASE_URL}/api/auth/passkey/register-verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optData.challengeId, credential }),
      });
      const verData = (await verRes.json()) as { ok?: boolean; error?: string };
      if (!verData.ok) {
        throw new Error(verData.error || "注册失败");
      }

      window.location.href = withBase("welcome/");
    } catch (e) {
      const msg = translatePasskeyError(e);
      if (msg) {
        setError(msg);
        setShowModal(false);
      } else {
        setError("");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleLogin() {
    setError("");
    setLoading("login");
    try {
      const optRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const optData = (await optRes.json()) as {
        challengeId?: string;
        options?: unknown;
        error?: string;
      };
      if (optData.error || !optData.challengeId || !optData.options) {
        throw new Error(optData.error || "获取选项失败");
      }

      const credential = await startAuthentication({ optionsJSON: optData.options as never });

      const verRes = await fetch(`${API_BASE_URL}/api/auth/passkey/login-verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: optData.challengeId, credential }),
      });
      const verData = (await verRes.json()) as { ok?: boolean; error?: string };
      if (!verData.ok) {
        throw new Error(verData.error || "登录失败");
      }

      window.location.href = withBase("welcome/");
    } catch (e) {
      const msg = translatePasskeyError(e);
      if (msg) {
        setError(msg);
      } else {
        setError("");
      }
    } finally {
      setLoading(null);
    }
  }

  const passkeyDisabled = supports !== true;

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openModal}
          disabled={loading !== null || passkeyDisabled}
          className="h-12 w-full rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          注册 Passkey（指纹/面容）
        </button>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading !== null || passkeyDisabled}
          className="h-12 w-full rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "login" ? "登录中…" : "使用 Passkey 登录"}
        </button>
        {supports === false && (
          <p className="text-center text-xs text-neutral-400">
            此设备或浏览器不支持 Passkey
          </p>
        )}
        {error && !showModal && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">注册 Passkey</h2>
            <p className="mt-1 text-sm text-neutral-500">
              请输入邮箱，用于将 Passkey 关联到你的账号
            </p>

            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              className="mt-4 h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />

            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading === "register"}
                className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitRegister}
                disabled={!emailInput.trim() || loading === "register"}
                className="h-11 flex-1 rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-50"
              >
                {loading === "register" ? "注册中…" : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
