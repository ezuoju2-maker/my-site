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

export default function GameCategories({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <aside className="flex flex-col gap-0.5 rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
      {CATEGORIES.map((c: Category) => {
        const Icon = ICONS[c.iconKey];
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-label={c.name}
            onClick={() => onChange(c.id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 active:scale-95 ${
              isActive ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={`text-[10.5px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
              {c.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
