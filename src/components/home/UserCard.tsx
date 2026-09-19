import { useState } from "react";
import { Copy, Check, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { User } from "../../types/home";

export default function UserCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  const shortId = user.id.slice(0, 8);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const initial = (user.displayName || user.username || "U").charAt(0).toUpperCase();

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-lg font-semibold text-neutral-600">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[16px] font-semibold text-neutral-900">
              {user.displayName || user.username}
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-[3px] text-[10px] font-bold text-amber-700">
              VIP {user.vipLevel}
            </span>
          </div>
          <button type="button" onClick={copyId} className="mt-1 flex items-center gap-1 text-[12px] text-neutral-400">
            ID: {shortId}...
            {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
          </button>
        </div>

        <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-neutral-300" />
      </div>

      <div className="border-t border-neutral-100 p-4">
        <div className="text-[13px] text-neutral-500">钱包余额</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[30px] font-bold leading-none tracking-tight text-neutral-900">
            {hidden ? "¥ ****" : `¥ ${user.balance.toFixed(2)}`}
          </span>
          <button
            type="button"
            aria-label={hidden ? "显示余额" : "隐藏余额"}
            onClick={() => setHidden((v) => !v)}
            className="text-neutral-400"
          >
            {hidden ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" className="h-11 rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 active:scale-[0.98]">查看流水</button>
          <button type="button" className="h-11 rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 active:scale-[0.98]">提现</button>
          <button type="button" className="h-11 rounded-xl bg-neutral-900 text-[13px] font-semibold text-white active:scale-[0.98]">充值</button>
        </div>
      </div>
    </section>
  );
}
