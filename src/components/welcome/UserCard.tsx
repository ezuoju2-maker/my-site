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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100">
      {/* 右侧皇冠装饰 */}
      <div className="pointer-events-none absolute -right-4 top-2 text-[80px] leading-none opacity-90 select-none">
        👑
      </div>
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br from-amber-100/40 to-transparent blur-2xl" />

      <div className="relative p-4">
        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-bold text-slate-700 ring-2 ring-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[17px] font-bold text-neutral-900">
                {user.displayName || user.username}
              </span>
              <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2 py-0.5 text-[10px] font-black text-white shadow-[0_2px_8px_-2px_rgba(251,191,36,0.6)]">
                👑 VIP 1
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-neutral-400">
              ID: {shortId}...
              <button type="button" className="text-neutral-400 hover:text-neutral-700">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              </button>
            </div>
          </div>
          <button type="button" className="text-neutral-400">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* 钱包余额 */}
        <div className="mt-5">
          <div className="text-[13px] text-neutral-500">钱包余额</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-black tracking-tight text-neutral-900">¥ 0.00</span>
            <button type="button" className="text-neutral-400 hover:text-neutral-700">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        {/* 3 个按钮 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 shadow-sm transition-all active:scale-[0.98]">
            <span className="text-base">📊</span>查看流水
          </button>
          <button type="button" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 shadow-sm transition-all active:scale-[0.98]">
            <span className="text-base">💳</span>提现
          </button>
          <button type="button" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 text-[13px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(251,191,36,0.7)] transition-all active:scale-[0.98]">
            <span className="text-base">👑</span>充值
          </button>
        </div>
      </div>
    </div>
  );
}
