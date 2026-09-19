import { Flame, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Game } from "../../types/home";
import GameCategory from "./GameCategory";
import GameCard from "./GameCard";

export default function GameSection({
  games,
  query,
}: {
  games: Game[];
  query: string;
}) {
  const [cat, setCat] = useState("hot");

  const filtered = useMemo(() => {
    let list = games;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    } else if (cat !== "hot") {
      list = list.filter((g) => g.category === cat);
    }
    return list;
  }, [games, cat, query]);

  return (
    <section className="grid gap-3" style={{ gridTemplateColumns: "80px 1fr" }}>
      <GameCategory active={cat} onChange={setCat} />

      <div className="h-card h-card-lg" style={{ padding: 14 }}>
        {/* 头部 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame size={18} strokeWidth={2.2} style={{ color: "#e53935" }} />
            <span className="text-[15px] font-black text-neutral-900">热门游戏</span>
          </div>
          <a href="/games" className="flex items-center gap-0.5 text-[11px] font-medium text-[#a0a4aa]">
            更多游戏 <ChevronRight size={13} strokeWidth={2.2} />
          </a>
        </div>

        {/* 网格 */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[13px] text-neutral-400">
            暂无相关游戏
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}

        {/* 更多 */}
        <a
          href="/games"
          className="h-tap mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-full border border-neutral-200 bg-white text-[13px] font-bold text-neutral-800"
        >
          更多游戏 <ChevronRight size={14} strokeWidth={2.2} />
        </a>
      </div>
    </section>
  );
}
