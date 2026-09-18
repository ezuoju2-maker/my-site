import { IconHome, IconDevices, IconLock, IconKey, IconGear, IconUser } from "./icons";
import type { ReactNode } from "react";

const ITEMS: { key: string; label: string; href: string; Icon: () => ReactNode; bg: string; fg: string; active?: boolean }[] = [
  { key: "home", label: "首页", href: "/welcome/", Icon: IconHome, bg: "from-amber-400 to-orange-500", fg: "text-white", active: true },
  { key: "devices", label: "设备", href: "/settings/devices/", Icon: IconDevices, bg: "from-sky-50 to-blue-100", fg: "text-blue-600" },
  { key: "security", label: "安全", href: "/forgot-password/", Icon: IconLock, bg: "from-emerald-50 to-green-100", fg: "text-emerald-600" },
  { key: "passkey", label: "Passkey", href: "/passkey/recover/", Icon: IconKey, bg: "from-violet-50 to-purple-100", fg: "text-violet-600" },
  { key: "settings", label: "设置", href: "/settings/devices/", Icon: IconGear, bg: "from-neutral-100 to-neutral-200", fg: "text-neutral-700" },
  { key: "me", label: "我的", href: "/welcome/", Icon: IconUser, bg: "from-rose-50 to-pink-100", fg: "text-rose-600" },
];

export default function QuickNav() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-neutral-200/60 py-3"
         style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -8px rgba(0,0,0,0.06)" }}>
      <div className="grid grid-cols-6">
        {ITEMS.map(({ key, label, href, Icon, bg, fg, active }) => (
          <a key={key} href={href} className="flex flex-col items-center gap-1.5 py-1 transition-transform active:scale-95">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${bg} ${fg} shadow-sm`}>
              <Icon />
            </span>
            <span className={`text-[11px] ${active ? "font-semibold text-neutral-900" : "font-medium text-neutral-500"}`}>
              {label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
