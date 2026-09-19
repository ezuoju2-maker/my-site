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
    <section className="h-card h-card-lg relative overflow-hidden" style={{ padding: 16 }}>
      {/* 右上角皇冠 SVG */}
      <div className="pointer-events-none absolute right-4 top-3 select-none">
        <svg viewBox="0 0 120 90" width="70" height="52" aria-hidden="true">
          <defs>
            <linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="55%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="crown-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6d678" />
              <stop offset="100%" stopColor="#a47a2d" />
            </linearGradient>
          </defs>
          <path
            d="M10 72 L14 30 L32 48 L44 12 L58 48 L72 14 L86 48 L102 30 L106 72 Z"
            fill="url(#crown-g)"
            stroke="url(#crown-line)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="10" y="72" width="96" height="10" rx="3" fill="url(#crown-g)" stroke="url(#crown-line)" strokeWidth="2" />
          <circle cx="14" cy="30" r="3.5" fill="#f6d678" />
          <circle cx="44" cy="12" r="3.5" fill="#f6d678" />
          <circle cx="72" cy="14" r="3.5" fill="#f6d678" />
          <circle cx="102" cy="30" r="3.5" fill="#f6d678" />
          <circle cx="58" cy="48" r="2.5" fill="#dc2626" />
        </svg>
      </div>

      {/* 用户信息 */}
      <div className="relative flex items-center gap-3" style={{ paddingRight: 80 }}>
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-600">{initial}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[17px] font-bold text-neutral-900">
              {user.displayName || user.username}
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-[3px] text-[9px] font-black"
                  style={{ background: "#f3e7cf", color: "#80642b" }}>
              <svg viewBox="0 0 12 12" width="9" height="9" fill="#80642b" aria-hidden="true">
                <path d="M1 9 L1.5 3.5 L3.5 5.5 L5 1.5 L6.5 5.5 L8.5 3.5 L9 9 Z" />
              </svg>
              VIP {user.vipLevel}
            </span>
          </div>

          <button
            type="button"
            onClick={copyId}
            className="mt-1 flex items-center gap-1 text-[13px] text-[#8c8c8c]"
          >
            ID: {shortId}...
            {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
          </button>
        </div>

        <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-neutral-300" />
      </div>

      {/* 钱包 */}
      <div className="mt-5">
        <div className="text-[13px] text-[#777b82]">钱包余额</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[34px] font-bold leading-none tracking-tight text-neutral-900">
            {hidden ? "¥ ****" : `¥ ${user.balance.toFixed(2)}`}
          </span>
          <button
            type="button"
            aria-label={hidden ? "显示余额" : "隐藏余额"}
            onClick={() => setHidden((v) => !v)}
            className="text-neutral-400"
          >
            {hidden ? <EyeOff size={20} strokeWidth={1.8} /> : <Eye size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {/* 三个按钮 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button type="button" className="h-tap flex h-14 items-center justify-center gap-1.5 rounded-[18px] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-800">
          查看流水
        </button>
        <button type="button" className="h-tap flex h-14 items-center justify-center gap-1.5 rounded-[18px] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-800">
          提现
        </button>
        <button type="button" className="h-tap flex h-14 items-center justify-center gap-1.5 rounded-[18px] text-[13px] font-bold"
                style={{ background: "#fff4dc", color: "#80642b" }}>
          充值
        </button>
      </div>
    </section>
  );
}
