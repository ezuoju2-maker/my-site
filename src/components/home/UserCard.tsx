import { useState } from "react";
import { Copy, Check, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { User } from "../../types/home";

/** 默认头像：动漫男性风格（纯 SVG，无外部依赖） */
function DefaultAvatar() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="av-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <linearGradient id="av-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="av-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde8d3" />
          <stop offset="100%" stopColor="#f5d2b4" />
        </linearGradient>
      </defs>
      {/* 背景 */}
      <rect width="100" height="100" fill="url(#av-bg)" />
      {/* 身体/衣领 */}
      <path d="M20 100 Q50 78 80 100 Z" fill="#1e293b" />
      <path d="M42 92 L50 100 L58 92 L54 88 L50 92 L46 88 Z" fill="#0f172a" />
      {/* 脖子 */}
      <rect x="42" y="72" width="16" height="14" fill="url(#av-skin)" />
      {/* 脸 */}
      <ellipse cx="50" cy="55" rx="20" ry="23" fill="url(#av-skin)" />
      {/* 头发（前刘海） */}
      <path d="M28 48 Q30 24 50 22 Q70 24 72 48 Q68 40 62 38 L58 46 L54 36 L48 44 L44 34 L36 42 L32 36 Q30 42 28 48 Z" fill="url(#av-hair)" />
      {/* 侧发 */}
      <path d="M28 48 Q26 60 28 70 L34 68 Q33 58 34 50 Z" fill="url(#av-hair)" />
      <path d="M72 48 Q74 60 72 70 L66 68 Q67 58 66 50 Z" fill="url(#av-hair)" />
      {/* 眉毛 */}
      <path d="M40 52 Q44 50 47 52" stroke="#1f2937" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M53 52 Q56 50 60 52" stroke="#1f2937" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* 眼睛（冷峻） */}
      <ellipse cx="43" cy="58" rx="3" ry="3.5" fill="#0f172a" />
      <ellipse cx="57" cy="58" rx="3" ry="3.5" fill="#0f172a" />
      <circle cx="44" cy="57" r="1" fill="#fff" />
      <circle cx="58" cy="57" r="1" fill="#fff" />
      {/* 鼻子 */}
      <path d="M50 62 L49 66 L51 66 Z" fill="#d9a380" />
      {/* 嘴（轻微上扬） */}
      <path d="M46 72 Q50 74 54 72" stroke="#b08060" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** 黑金皇冠（装饰用，纯 SVG） */
function Crown() {
  return (
    <svg viewBox="0 0 140 110" width="76" height="60" aria-hidden="true">
      <defs>
        <linearGradient id="cg-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="cg-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d4a24a" />
          <stop offset="100%" stopColor="#8a5f1f" />
        </linearGradient>
        <linearGradient id="cg-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <radialGradient id="cg-shine" cx="0.5" cy="0.2" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 皇冠主体 */}
      <path
        d="M14 82 L18 34 L36 52 L52 16 L70 52 L88 20 L104 52 L122 34 L126 82 Z"
        fill="url(#cg-body)"
        stroke="url(#cg-line)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* 底座 */}
      <rect x="14" y="82" width="112" height="14" rx="4" fill="url(#cg-body)" stroke="url(#cg-line)" strokeWidth="2.2" />
      {/* 底座装饰线 */}
      <line x1="18" y1="89" x2="122" y2="89" stroke="url(#cg-line)" strokeWidth="1" opacity="0.7" />
      {/* 尖顶宝石 */}
      <circle cx="18" cy="34" r="4" fill="url(#cg-gem)" stroke="url(#cg-line)" strokeWidth="1" />
      <circle cx="52" cy="16" r="4" fill="url(#cg-gem)" stroke="url(#cg-line)" strokeWidth="1" />
      <circle cx="88" cy="20" r="4" fill="url(#cg-gem)" stroke="url(#cg-line)" strokeWidth="1" />
      <circle cx="122" cy="34" r="4" fill="url(#cg-gem)" stroke="url(#cg-line)" strokeWidth="1" />
      {/* 中心宝石 */}
      <circle cx="70" cy="52" r="3.5" fill="#3b82f6" stroke="url(#cg-line)" strokeWidth="1" />
      {/* 高光 */}
      <path d="M22 38 L30 58 Q24 70 22 80 Z" fill="url(#cg-shine)" />
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
    <section className="h-card h-card-lg relative overflow-hidden" style={{ padding: 20 }}>
      {/* 右上角皇冠 */}
      <div className="pointer-events-none absolute right-3 top-3 select-none opacity-95">
        <Crown />
      </div>

      {/* 用户信息 */}
      <div className="relative flex items-center gap-3" style={{ paddingRight: 86 }}>
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-[2.5px] ring-white shadow-[0_4px_14px_-3px_rgba(0,0,0,0.18)]">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <DefaultAvatar />
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
          <span className="text-[36px] font-bold leading-none tracking-tight text-neutral-900">
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
        <button type="button" className="h-tap flex h-[58px] items-center justify-center rounded-[18px] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-800">
          查看流水
        </button>
        <button type="button" className="h-tap flex h-[58px] items-center justify-center rounded-[18px] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-800">
          提现
        </button>
        <button type="button" className="h-tap flex h-[58px] items-center justify-center rounded-[18px] text-[13px] font-bold"
                style={{ background: "#fff4d8", color: "#80642b" }}>
          充值
        </button>
      </div>
    </section>
  );
}
