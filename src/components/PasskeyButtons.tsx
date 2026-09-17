import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { API_BASE_URL } from "../lib/api";
import { withBase } from "../lib/url";

export default function PasskeyButtons() {
  const [loading, setLoading] = useState<"register" | "login" | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

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
      const msg = e instanceof Error ? e.message : "注册失败";
      if (msg.includes("cancel") || msg.includes("Cancel")) {
        setError("");
      } else {
        setError(msg);
        setShowModal(false);
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
      const msg = e instanceof Error ? e.message : "登录失败";
      if (msg.includes("cancel") || msg.includes("Cancel")) {
        setError("");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openModal}
          disabled={loading !== null}
          className="h-12 w-full rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50"
        >
          注册 Passkey（指纹/面容）
        </button>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading !== null}
          className="h-12 w-full rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700 disabled:opacity-50"
        >
          {loading === "login" ? "登录中…" : "使用 Passkey 登录"}
        </button>
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
