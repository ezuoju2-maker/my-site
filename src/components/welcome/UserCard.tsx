import { ICONS } from "./assets";

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
    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-white via-white to-slate-50/80 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100">
      {/* 右上角皇冠 */}
      <div className="pointer-events-none absolute right-3 top-3 select-none">
        <img src={ICONS.crownGold} alt="" className="h-12 w-12 object-contain drop-shadow-lg" />
      </div>

      <div className="relative p-4">
        <div className="flex items-center gap-3 pr-16">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-lg font-bold text-slate-600 ring-[2.5px] ring-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]">
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
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-1.5 py-[3px] text-[9px] font-black text-white shadow-[0_2px_6px_-1px_rgba(245,158,11,0.5)]">
                <img src={ICONS.crownGold} alt="" className="h-2.5 w-2.5 brightness-0 invert" />
                VIP 1
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
              <span>ID: {shortId}...</span>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[12px] text-neutral-500">钱包余额</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-black tracking-tight text-neutral-900">¥ 0.00</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 shadow-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 9h6M7 13h10M7 17h4" />
            </svg>
            查看流水
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 shadow-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M2 11h20" />
            </svg>
            提现
          </button>
          <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-[12px] font-bold text-white shadow-[0_4px_14px_-3px_rgba(245,158,11,0.7)]">
            <img src={ICONS.crownGold} alt="" className="h-3.5 w-3.5 brightness-0 invert" />
            充值
          </button>
        </div>
      </div>
    </div>
  );
}
