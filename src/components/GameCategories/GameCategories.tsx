import { Flame, Gamepad2, CircleDot, Layers, Fish, Smartphone } from "lucide-react";
import type { Category } from "../../types/home";
import "./GameCategories.css";

const CATS: Category[] = [
  { id: "hot", name: "热门", iconKey: "flame" },
  { id: "games", name: "游戏", iconKey: "gamepad" },
  { id: "sports", name: "体育", iconKey: "target" },
  { id: "cards", name: "棋牌", iconKey: "cards" },
  { id: "fishing", name: "捕鱼", iconKey: "fish" },
  { id: "electronic", name: "电子", iconKey: "device" },
];

const ICONS = {
  flame: Flame,
  gamepad: Gamepad2,
  target: CircleDot,
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
    <aside className="q8-cats" aria-label="游戏分类">
      {CATS.map((c) => {
        const Icon = ICONS[c.iconKey];
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-label={c.name}
            aria-pressed={isActive}
            onClick={() => onChange(c.id)}
            className={`q8-cat ${isActive ? "active" : ""}`}
          >
            <span className="q8-cat-icon">
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
            </span>
            <span className="q8-cat-label">{c.name}</span>
          </button>
        );
      })}
    </aside>
  );
}
