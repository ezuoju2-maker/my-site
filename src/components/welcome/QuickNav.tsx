import { IconHome, IconDevices, IconLock, IconKey, IconGear, IconUser } from "./icons";

const ITEMS = [
  { key: "home", label: "首页", href: "/welcome/", Icon: IconHome, active: true },
  { key: "devices", label: "设备", href: "/settings/devices/", Icon: IconDevices },
  { key: "security", label: "安全", href: "/forgot-password/", Icon: IconLock },
  { key: "passkey", label: "Passkey", href: "/passkey/recover/", Icon: IconKey },
  { key: "settings", label: "设置", href: "/settings/devices/", Icon: IconGear },
  { key: "me", label: "我的", href: "/welcome/", Icon: IconUser },
];

export default function QuickNav() {
  return (
    <div className="grid grid-cols-6 rounded-2xl border border-neutral-100 bg-white py-2">
      {ITEMS.map(({ key, label, href, Icon, active }) => (
        <a key={key} href={href} className="relative flex flex-col items-center gap-1 py-2">
          <span className={active ? "text-neutral-900" : "text-neutral-700"}><Icon /></span>
          <span className={`text-[11px] ${active ? "font-medium text-neutral-900" : "text-neutral-600"}`}>{label}</span>
          {active && <span className="absolute -bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-yellow-400" />}
        </a>
      ))}
    </div>
  );
}
