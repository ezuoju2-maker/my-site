import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import VerifyCodeInput from "./VerifyCodeInput";

type Step = "email" | "code" | "done";

export default function PasskeyRecoverForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function isValidEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) { setError("请输入有效邮箱地址"); return; }
    setSending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/passkey/recover-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; retryAfter?: number };
      if (!res.ok || !data.ok) {
        if (data.error === "TOO_MANY_REQUESTS") setError("请求过于频繁，请稍后再试");
        else setError("发送失败，请重试");
        return;
      }
      setEmail(e);
      setStep("code");
      setCooldown(60);
      setInfo("验证码已发送，请查收邮件");
    } catch {
      setError("网络错误");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(v: string) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/passkey/recover-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: v }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; ticket?: string };
      if (data.ok && data.ticket) {
        setCodeStatus("success");
        // TODO: 第 3b 批 — 用 ticket 在新设备注册 Passkey
        setTimeout(() => setStep("done"), 800);
      } else {
        setCodeStatus("error");
        const map: Record<string, string> = {
          CODE_EXPIRED: "验证码已过期，请重新发送",
          INVALID_CODE: "验证码错误，请重试",
          TOO_MANY_ATTEMPTS: "尝试次数过多，请重新发送",
          USER_NOT_FOUND: "该邮箱未绑定 Passkey",
        };
        setError(map[data.error as string] || "验证失败，请重试");
      }
    } catch {
      setCodeStatus("error");
      setError("网络错误");
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  }

  function handleCodeChange(v: string) {
    setCode(v);
    if (codeStatus !== "idle") setCodeStatus("idle");
    if (error) setError("");
  }

  async function resend() {
    if (cooldown > 0) return;
    setCode("");
    setCodeStatus("idle");
    await sendCode();
  }

  function goBack() {
    if (step === "code") { setStep("email"); setCode(""); setError(""); setInfo(""); return; }
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-sm font-medium text-neutral-900">
          {step === "email" ? "找回 Passkey" : step === "code" ? "输入验证码" : "验证成功"}
        </h2>
      </div>

      {step === "email" && (
        <div className="p-6">
          <p className="text-sm text-neutral-600">
            输入注册时绑定的邮箱，我们会发送验证码帮你找回账号。
          </p>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              autoFocus
              disabled={sending}
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={sendCode}
            disabled={sending || !email.trim()}
            className="mt-5 h-11 w-full rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-50"
          >
            {sending ? "发送中…" : "发送验证码"}
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="p-6">
          <p className="text-center text-sm text-neutral-600">验证码已发送至</p>
          <p className="mt-1 text-center text-sm font-medium text-neutral-900 break-all">{email}</p>

          <div className="mt-6">
            <VerifyCodeInput
              value={code}
              onChange={handleCodeChange}
              onComplete={verifyCode}
              status={codeStatus}
              disabled={verifying}
              autoFocus
            />
          </div>

          {verifying && <p className="mt-4 text-center text-xs text-neutral-500">验证中…</p>}
          {!verifying && error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
          {!verifying && info && !error && <p className="mt-4 text-center text-xs text-green-600">{info}</p>}

          <div className="mt-6 text-center text-xs text-neutral-500">
            {cooldown > 0 ? (
              <span>重新发送 ({cooldown}s)</span>
            ) : (
              <button type="button" onClick={resend} className="text-neutral-800 underline underline-offset-4">
                重新发送验证码
              </button>
            )}
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-900">验证成功</p>
          <p className="mt-1 text-xs text-neutral-500">下一步：在新设备上注册 Passkey（开发中）</p>
        </div>
      )}
    </div>
  );
}
