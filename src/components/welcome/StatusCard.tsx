import { IconMail, IconCalendar, IconShield } from "./icons";
import { maskEmail } from "./utils";
import type { ReactNode } from "react";

type Props = {
  user: { email: string; role: string };
  deviceCount: number;
  joinedDays: number | null;
};

export default function StatusCard({ user, deviceCount, joinedDays }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/60"
         style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -8px rgba(0,0,0,0.06)" }}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-black text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]">
            <IconShield />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">账号状态</div>
            <div className="mt-0.5 text-[19px] font-bold tracking-tight text-neutral-900">
              {user.role === "admin" ? "管理员" : "已登录"}
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            在线
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <a href="/settings/devices/" className="flex h-10 items-center justify-center rounded-xl bg-neutral-50 text-[12px] font-medium text-neutral-700 transition-all hover:bg-neutral-100 active:scale-[0.98]">
            管理设备
          </a>
          <a href="/forgot-password/" className="flex h-10 items-center justify-center rounded-xl bg-neutral-50 text-[12px] font-medium text-neutral-700 transition-all hover:bg-neutral-100 active:scale-[0.98]">
            修改密码
          </a>
          <a href="/passkey/recover/" className="flex h-10 items-center justify-center rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-950 text-[12px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98]">
            Passkey
          </a>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat Icon={IconMail} label="邮箱" value={maskEmail(user.email)} />
          <Stat Icon={IconCalendar} label="注册" value={joinedDays ? `${joinedDays} 天` : "未知"} />
          <Stat Icon={IconShield} label="设备" value={`${deviceCount} 台`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: () => ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50/80 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        <span className="text-neutral-500"><Icon /></span>
        {label}
      </div>
      <div className="mt-1 truncate text-[12px] font-semibold text-neutral-800">{value}</div>
    </div>
  );
}
