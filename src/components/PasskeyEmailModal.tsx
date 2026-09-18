import { useState } from "react";

export default function PasskeyEmailModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("请输入有效邮箱地址");
      return;
    }
    onConfirm(e);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
      onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900">Passkey 注册</h2>
        <p className="mt-1 text-xs text-neutral-500">
          请填写真实且可正常接收邮件的邮箱地址
        </p>
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
          <p className="font-medium">⚠️ 邮箱的重要性</p>
          <p className="mt-1">
            当你更换设备或 Passkey 丢失时，我们只能通过此邮箱发送验证码帮你找回账号。
            邮箱错误将导致账号无法恢复。
          </p>
        </div>

        <input
          type="email"
          value={email}
          onChange={(ev) => { setEmail(ev.target.value); setError(""); }}
          placeholder="your@email.com"
          autoFocus
          className="mt-4 h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!email.trim()}
            className="h-11 flex-1 rounded-lg bg-neutral-900 text-base font-medium text-white disabled:opacity-50"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
