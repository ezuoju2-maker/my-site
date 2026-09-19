import { useState } from "react";
import { Copy, Check, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { User } from "../../types/home";

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="av-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde8d3" />
          <stop offset="100%" stopColor="#f5d2b4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#av-bg)" />
      <path d="M18 100 Q50 76 82 100 Z" fill="#374151" />
      <rect x="42" y="70" width="16" height="14" fill="url(#av-skin)" />
      <ellipse cx="50" cy="55" rx="20" ry="23" fill="url(#av-skin)" />
      <path d="M28 48 Q30 24 50 22 Q70 24 72 48 Q68 40 62 38 L58 46 L54 36 L48 44 L44 34 L36 42 L32 36 Q30 42 28 48 Z" fill="#1f2937" />
      <path d="M28 48 Q26 60 28 70 L34 68 Q33 58 34 50 Z" fill="#1f2937" />
      <path d="M72 48 Q74 60 72 70 L66 68 Q67 58 66 50 Z" fill="#1f2937" />
      <ellipse cx="43" cy="58" rx="2.8" ry="3.3" fill="#0f172a" />
      <ellipse cx="57" cy="58" rx="2.8" ry="3.3" fill="#0f172a" />
      <circle cx="44" cy="57" r="0.9" fill="#fff" />
      <circle cx="58" cy="57" r="0.9" fill="#fff" />
      <path d="M47 72 Q50 73.5 53 72" stroke="#b08060" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

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

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      {/* 用户信息 */}
      <div className="flex items-center gap-3 p-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-2 ring-white shadow-sm">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <DefaultAvatar />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[16px] font-semibold text-neutral-900">
              {user.displayName || user.username}
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-[3px] text-[10px] font-bold text-amber-700">
              <svg viewBox="0 0 12 12" width="8" height="8" fill="currentColor" aria-hidden="true">
                <path d="M1 9 L1.5 3.5 L3.5 5.5 L5 1.5 L6.5 5.5 L8.5 3.5 L9 9 Z" />
              </svg>
              VIP {user.vipLevel}
            </span>
          </div>
          <button
            type="button"
            onClick={copyId}
            className="mt-1 flex items-center gap-1 text-[12px] text-neutral-400"
          >
            ID: {shortId}...
            {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
          </button>
        </div>

        <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-neutral-300" />
      </div>

      {/* 钱包 */}
      <div className="border-t border-neutral-100 p-4">
        <div className="text-[13px] text-neutral-500">钱包余额</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[32px] font-bold leading-none tracking-tight text-neutral-900">
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
          <button type="button" className="h-11 rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 transition-colors active:scale-[0.98]">
            查看流水
          </button>
          <button type="button" className="h-11 rounded-xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 transition-colors active:scale-[0.98]">
            提现
          </button>
          <button type="button" className="h-11 rounded-xl bg-neutral-900 text-[13px] font-semibold text-white transition-colors active:scale-[0.98]">
            充值
          </button>
        </div>
      </div>
    </section>
  );
}
