import type { ReactNode } from "react";
import { IconGrid, IconDevices, IconLock, IconKey, IconList } from "./icons";

export type SidebarKey = "overview" | "devices" | "security" | "passkey" | "history";

const ITEMS: { key: SidebarKey; label: string; Icon: () => ReactNode }[] = [
  { key: "overview", label: "概览", Icon: IconGrid },
  { key: "devices", label: "设备", Icon: IconDevices },
  { key: "security", label: "安全", Icon: IconLock },
  { key: "passkey", label: "Passkey", Icon: IconKey },
  { key: "history", label: "记录", Icon: IconList },
];

export default function Sidebar({ active, onChange }: { active: SidebarKey; onChange: (k: SidebarKey) => void }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white py-2">
      {ITEMS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex w-full flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span className="text-neutral-800"><Icon /></span>
            <span className={`text-[11px] ${isActive ? "font-medium" : ""}`}>{label}</span>
            {isActive && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-yellow-400" />}
          </button>
        );
      })}
    </div>
  );
}
