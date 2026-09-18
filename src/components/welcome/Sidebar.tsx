import type { ReactNode } from "react";
import { IcoFire, IcoGamepad, IcoTarget, IcoDice, IcoCard, IcoTicket } from "./icons";

export type CatKey = "hot" | "chess" | "slot" | "lottery" | "fish" | "sport" | "esport";

export const CATS: { key: CatKey; label: string; Icon: () => ReactNode; bg: string }[] = [
  { key: "hot", label: "热门", Icon: IcoFire, bg: "from-red-400 to-orange-500" },
  { key: "chess", label: "棋牌", Icon: IcoGamepad, bg: "from-emerald-400 to-teal-500" },
  { key: "slot", label: "电子", Icon: IcoTarget, bg: "from-sky-400 to-blue-500" },
  { key: "lottery", label: "老虎机", Icon: IcoDice, bg: "from-fuchsia-400 to-purple-500" },
  { key: "fish", label: "捕鱼", Icon: IcoCard, bg: "from-cyan-400 to-blue-500" },
  { key: "sport", label: "体育", Icon: IcoTarget, bg: "from-amber-400 to-orange-500" },
  { key: "esport", label: "电竞", Icon: IcoTicket, bg: "from-indigo-400 to-violet-500" },
];

export default function Sidebar({ active, onChange }: { active: CatKey; onChange: (k: CatKey) => void }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 py-2 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur">
      {CATS.map(({ key, label, Icon, bg }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative mx-1.5 my-0.5 flex w-[calc(100%-12px)] flex-col items-center gap-1 rounded-xl py-2.5 transition-all active:scale-95 ${
              isActive ? "bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]" : "hover:bg-neutral-50"
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${bg} text-white shadow-sm ${isActive ? "" : "opacity-90"}`}>
              <Icon />
            </span>
            <span className={`text-[11px] ${isActive ? "font-bold text-white" : "font-medium text-neutral-600"}`}>
              {label}
            </span>
            {isActive && (
              <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-amber-300 to-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
