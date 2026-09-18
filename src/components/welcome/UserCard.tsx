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
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      {/* 用户信息 */}
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xl font-semibold text-neutral-700">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-neutral-900">
            {user.displayName || user.username}
          </div>
          <div className="mt-0.5 text-xs text-neutral-400">ID: {shortId}...</div>
        </div>
        <IcoArrow />
      </div>

      {/* 钱包余额 */}
      <div className="border-t border-neutral-100 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-lg">💰</span>
          <span className="text-sm text-neutral-500">钱包余额</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-neutral-900">¥</span>
          <span className="text-3xl font-bold tracking-tight text-neutral-900">0.00</span>
        </div>
      </div>

      {/* 3 个操作按钮 */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
          <span>📊</span>查看流水
        </button>
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
          <span>💳</span>提现
        </button>
        <button type="button" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-xs font-medium text-white">
          <span>💰</span>充值
        </button>
      </div>
    </div>
  );
}
