import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import VerifyCodeInput from "./VerifyCodeInput";

type Status = "idle" | "success" | "error";

export default function VerifyCodeForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const verifyingRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setCooldown(60);
        setError("");
        setStatus("idle");
        setCode("");
      } else {
        setError("重新发送失败，请稍后再试");
      }
    } catch {
      setError("网络错误");
    }
  }

  async function verifyCode(v: string) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: v }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setStatus("success");
        // TODO: 你后续开发 —— 验证成功后创建账号 / 跳转
      } else {
        setStatus("error");
        const map: Record<string, string> = {
          EMAIL_CODE_EXPIRED: "验证码已过期，请重新发送",
          INVALID_CODE: "验证码错误，请重试",
          TOO_MANY_ATTEMPTS: "尝试次数过多，请重新发送验证码",
        };
        setError(map[data.error as string] || "验证失败，请重试");
      }
    } catch {
      setStatus("error");
      setError("网络错误，请重试");
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  }

  function handleChange(v: string) {
    setCode(v);
    if (status !== "idle") setStatus("idle");
    if (error) setError("");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-sm font-medium text-neutral-900">人机验证</h2>
      </div>

      <div className="p-6">
        <p className="text-center text-sm text-neutral-600">验证码已发送至</p>
        <p className="mt-1 text-center text-sm font-medium text-neutral-900 break-all">
          {email || "（未知邮箱）"}
        </p>

        <div className="mt-6">
          <VerifyCodeInput
            value={code}
            onChange={handleChange}
            onComplete={verifyCode}
            status={status}
            disabled={verifying}
            autoFocus
          />
        </div>

        {verifying && (
          <p className="mt-4 text-center text-xs text-neutral-500">验证中…</p>
        )}
        {!verifying && error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}
        {!verifying && status === "success" && (
          <p className="mt-4 text-center text-sm text-green-600">验证成功</p>
        )}

        <div className="mt-6 text-center text-xs text-neutral-500">
          {cooldown > 0 ? (
            <span>重新发送 ({cooldown}s)</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-neutral-800 underline underline-offset-4"
            >
              重新发送验证码
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
