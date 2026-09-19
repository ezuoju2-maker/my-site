import { Flame, Gamepad2, CircleDot, Layers, Fish, Smartphone } from "lucide-react";
import { CATEGORIES } from "../../data/home";
import type { Category } from "../../types/home";

const ICONS = {
  flame: Flame,
  gamepad: Gamepad2,
  target: CircleDot,
  cards: Layers,
  fish: Fish,
  device: Smartphone,
} as const;

export default function GameCategory({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <aside className="h-card h-card-lg self-start" style={{ padding: "10px 6px" }} aria-label="游戏分类">
      {CATEGORIES.map((c: Category) => {
        const isActive = active === c.id;
        const Icon = ICONS[c.iconKey];
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-label={c.name}
            aria-pressed={isActive}
            className={`h-tap my-0.5 flex w-full flex-col items-center gap-1.5 rounded-2xl py-3 transition-all ${
              isActive
                ? "bg-gradient-to-br from-neutral-800 to-neutral-950 text-white"
                : "text-[#6f7075] hover:bg-neutral-50"
            }`}
            style={isActive ? { boxShadow: "0 4px 12px -3px rgba(0,0,0,0.3)" } : undefined}
          >
            <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
            <span className={`text-[11px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>
              {c.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
