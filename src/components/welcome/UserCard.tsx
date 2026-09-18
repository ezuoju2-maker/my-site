import { IcoArrow } from "./icons";

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
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white to-neutral-50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      {/* 用户信息 */}
      <div className="flex items-center gap-4 p-4">
        <div className="relative">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-white shadow-[0_4px_12px_-2px_rgba(251,146,60,0.5)]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-bold text-neutral-900">
              {user.displayName || user.username}
            </span>
            {user.role === "admin" && (
              <span className="shrink-0 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                ADMIN
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-neutral-400">ID: {shortId}...</div>
        </div>
        <IcoArrow />
      </div>

      {/* 钱包余额 */}
      <div className="border-t border-neutral-100/80 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-lg shadow-[0_2px_8px_rgba(251,146,60,0.4)]">
            💰
          </span>
          <span className="text-[13px] text-white/70">钱包余额</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-amber-400">¥</span>
          <span className="text-3xl font-bold tracking-tight text-white">0.00</span>
        </div>
      </div>

      {/* 3 个操作按钮 */}
      <div className="grid grid-cols-3 gap-2 bg-white p-4">
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 text-xs font-medium text-neutral-700 shadow-sm transition-all active:scale-[0.97]">
          <span>📊</span>查看流水
        </button>
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 text-xs font-medium text-neutral-700 shadow-sm transition-all active:scale-[0.97]">
          <span>💳</span>提现
        </button>
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-xs font-bold text-white shadow-[0_4px_12px_-2px_rgba(251,146,60,0.5)] transition-all active:scale-[0.97]">
          <span>💰</span>充值
        </button>
      </div>
    </div>
  );
}
