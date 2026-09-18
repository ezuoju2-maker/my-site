import { IcoArrow } from "./icons";

type Props = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
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

      {/* 账号状态 */}
      <div className="border-t border-neutral-100 p-4">
        <div className="text-xs text-neutral-500">账号状态</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          {user.role === "admin" ? "管理员" : "已登录"}
        </div>
      </div>

      {/* 3 个操作按钮 */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <a href="/settings/devices/" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
          <span>📱</span>管理设备
        </a>
        <a href="/forgot-password/" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
          <span>🔒</span>修改密码
        </a>
        <a href="/passkey/recover/" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-xs font-medium text-white">
          <span>🔑</span>Passkey
        </a>
      </div>
    </div>
  );
}
