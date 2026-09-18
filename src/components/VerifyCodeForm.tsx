import { useEffect, useState } from "react";
import VerifyCodeInput from "./VerifyCodeInput";

export default function VerifyCodeForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60);

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
    window.location.href = "/";
  }

  async function handleResend() {
    if (cooldown > 0) return;
    // TODO: 后续接入重新发送验证码
    setCooldown(60);
  }

  function handleComplete(v: string) {
    // TODO: 后续接入验证 + 创建账号
    setCode(v);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("请输入完整的 6 位验证码");
      return;
    }
    setSubmitting(true);
    // TODO: 用户后续开发
    setTimeout(() => {
      setSubmitting(false);
      setError("验证码验证功能开发中");
    }, 400);
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

      <form onSubmit={handleSubmit} className="p-6">
        <p className="text-center text-sm text-neutral-600">
          验证码已发送至
        </p>
        <p className="mt-1 text-center text-sm font-medium text-neutral-900 break-all">
          {email || "（未知邮箱）"}
        </p>

        <div className="mt-6">
          <VerifyCodeInput
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            autoFocus
          />
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
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

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="mt-6 h-12 w-full rounded-lg bg-neutral-900 px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "验证中…" : "下一步"}
        </button>
      </form>
    </div>
  );
}
