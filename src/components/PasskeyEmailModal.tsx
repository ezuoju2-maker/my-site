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
          请输入邮箱，用于设备丢失时找回账号
        </p>
        <p className="mt-1 text-xs text-amber-600">
          提示：此邮箱仅用于绑定，不会收到验证邮件
        </p>

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
