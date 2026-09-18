type Props = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
};

export default function UserCard({ user }: Props) {
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  const shortId = user.id.slice(0, 8);

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100">
      {/* 右上角皇冠（精细） */}
      <div className="pointer-events-none absolute right-2 top-2 select-none">
        <svg viewBox="0 0 120 90" width="76" height="58">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fde68a" />
              <stop offset="50%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>
          </defs>
          <path d="M10 70 L14 30 L32 48 L44 12 L58 48 L72 14 L86 48 L102 30 L106 70 Z" fill="url(#cg)" stroke="#92400e" stroke-width="1.5" stroke-linejoin="round" />
          <rect x="10" y="70" width="96" height="10" rx="2" fill="url(#cg)" stroke="#92400e" stroke-width="1.5" />
          <circle cx="14" cy="30" r="4" fill="#ef4444" />
          <circle cx="44" cy="12" r="4" fill="#ef4444" />
          <circle cx="72" cy="14" r="4" fill="#ef4444" />
          <circle cx="102" cy="30" r="4" fill="#ef4444" />
          <circle cx="58" cy="48" r="3" fill="#3b82f6" />
        </svg>
      </div>

      <div className="relative p-4">
        {/* 用户信息 */}
        <div className="flex items-center gap-3 pr-20">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xl font-bold text-slate-600 ring-2 ring-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[16px] font-bold text-neutral-900">
                {user.displayName || user.username}
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-1.5 py-[3px] text-[9px] font-black text-white shadow-[0_2px_6px_-1px_rgba(245,158,11,0.6)]">
                <svg viewBox="0 0 12 12" width="9" height="9" fill="#fff">
                  <path d="M1 9 L1.5 3.5 L3.5 5.5 L5 1.5 L6.5 5.5 L8.5 3.5 L9 9 Z" />
                </svg>
                VIP 1
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
              <span>ID: {shortId}...</span>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            </div>
          </div>
        </div>

        {/* 钱包 */}
        <div className="mt-5">
          <div className="text-[12px] text-neutral-500">钱包余额</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-black tracking-tight text-neutral-900">¥ 0.00</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* 3 按钮 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 shadow-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 9h6M7 13h10M7 17h4" />
            </svg>
            查看流水
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 shadow-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M2 11h20" />
            </svg>
            提现
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-[12px] font-bold text-white shadow-[0_4px_14px_-3px_rgba(245,158,11,0.7)]">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M3 19 L4 9 L8 13 L12 3 L16 13 L20 9 L21 19 Z" />
            </svg>
            充值
          </button>
        </div>
      </div>
    </div>
  );
}
