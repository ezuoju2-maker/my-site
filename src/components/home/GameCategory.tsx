import { Flame, Gamepad2, Target, Layers, Fish, Smartphone } from "lucide-react";
import { CATEGORIES } from "../../data/home";
import type { Category } from "../../types/home";

const ICONS = {
  flame: Flame,
  gamepad: Gamepad2,
  target: Target,
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
    <aside className="h-card h-card-lg" style={{ padding: "8px 6px" }} aria-label="游戏分类">
      {CATEGORIES.map((c: Category) => {
        const isActive = active === c.id;
        const Icon = ICONS[c.iconKey];
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-label={c.name}
            className={`h-tap my-0.5 flex w-full flex-col items-center gap-1 rounded-2xl py-3 ${
              isActive
                ? "bg-gradient-to-br from-neutral-800 to-neutral-950 text-white shadow-[0_4px_12px_-3px_rgba(0,0,0,0.35)]"
                : "text-[#6f7075] hover:bg-neutral-50"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} />
            <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>{c.name}</span>
          </button>
        );
      })}
    </aside>
  );
}
