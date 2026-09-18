import type { ReactNode } from "react";
import { IcoFire, IcoGamepad, IcoTarget, IcoDice, IcoCard, IcoTicket } from "./icons";

export type CatKey = "hot" | "chess" | "slot" | "lottery" | "fish" | "sport" | "esport";

export const CATS: { key: CatKey; label: string; Icon: () => ReactNode }[] = [
  { key: "hot", label: "热门", Icon: IcoFire },
  { key: "chess", label: "棋牌", Icon: IcoGamepad },
  { key: "slot", label: "电子", Icon: IcoTarget },
  { key: "lottery", label: "老虎机", Icon: IcoDice },
  { key: "fish", label: "捕鱼", Icon: IcoCard },
  { key: "sport", label: "体育", Icon: IcoTarget },
  { key: "esport", label: "电竞", Icon: IcoTicket },
];

export default function Sidebar({ active, onChange }: { active: CatKey; onChange: (k: CatKey) => void }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white py-2">
      {CATS.map(({ key, label, Icon }) => {
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
            <span className={isActive ? "text-amber-500" : "text-neutral-500"}>
              <Icon />
            </span>
            <span className={`text-[11px] ${isActive ? "font-semibold" : ""}`}>{label}</span>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
