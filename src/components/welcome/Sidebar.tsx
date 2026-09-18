import type { ReactNode } from "react";
import { IcoFire, IcoGamepad, IcoBell, IcoDice, IcoCard, IcoGift } from "./icons";

export type CatKey = "hot" | "game" | "sport" | "chess" | "fish" | "slot";

export const CATS: { key: CatKey; label: string; Icon: () => ReactNode }[] = [
  { key: "hot", label: "热门", Icon: IcoFire },
  { key: "game", label: "游戏", Icon: IcoGamepad },
  { key: "sport", label: "体育", Icon: IcoBell },
  { key: "chess", label: "棋牌", Icon: IcoGift },
  { key: "fish", label: "捕鱼", Icon: IcoCard },
  { key: "slot", label: "电子", Icon: IcoDice },
];

export default function Sidebar({ active, onChange }: { active: CatKey; onChange: (k: CatKey) => void }) {
  return (
    <div className="rounded-2xl bg-white py-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-neutral-100">
      {CATS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`mx-1.5 my-0.5 flex w-[calc(100%-12px)] flex-col items-center gap-1 rounded-xl py-3 transition-all ${
              isActive
                ? "bg-gradient-to-br from-neutral-800 to-neutral-950 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
                : "text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            <span className={isActive ? "text-white" : "text-neutral-500"}>
              <Icon />
            </span>
            <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
