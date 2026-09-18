import { IconChevronRight } from "./icons";
import { maskEmail } from "./utils";

type Props = {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt?: string;
  };
  deviceCount: number;
};

export default function UserCard({ user, deviceCount }: Props) {
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  const shortId = user.id.slice(0, 8);
  const joinedDays = user.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : null;

  return (
    <>
      {/* 用户卡 */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-4">
        <div className="flex items-center gap-4">
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
          <IconChevronRight />
        </div>
      </div>

      {/* 账号状态卡 */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg">
            <span style={{ filter: "grayscale(1) brightness(2)" }}>👤</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-500">账号状态</div>
            <div className="mt-0.5 text-lg font-bold text-neutral-900">
              {user.role === "admin" ? "管理员" : "已登录"}
            </div>
          </div>
          <div className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
            在线
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href="/settings/devices/" className="flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
            管理设备
          </a>
          <a href="/forgot-password/" className="flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700">
            修改密码
          </a>
          <a href="/passkey/recover/" className="flex h-10 items-center justify-center rounded-lg bg-neutral-900 text-xs font-medium text-white">
            Passkey
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <div className="text-[11px] text-neutral-500">邮箱</div>
            <div className="mt-0.5 truncate font-medium text-neutral-900">{maskEmail(user.email)}</div>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <div className="text-[11px] text-neutral-500">已注册</div>
            <div className="mt-0.5 font-medium text-neutral-900">{joinedDays ? `${joinedDays} 天` : "未知"}</div>
          </div>
        </div>
      </div>
    </>
  );
}
