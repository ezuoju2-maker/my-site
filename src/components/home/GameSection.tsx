import { useMemo, useState } from "react";
import { Flame, ChevronRight } from "lucide-react";
import type { Game } from "../../types/home";
import GameCategories from "./GameCategories";
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
    <section className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-2.5">
      <GameCategories active={cat} onChange={setCat} />

      <div className="rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame size={16} strokeWidth={2.3} className="text-red-500" />
            <span className="text-[15px] font-bold tracking-tight text-neutral-900">热门游戏</span>
          </div>
          <a href="/games" className="flex items-center gap-0.5 text-[11px] font-medium text-neutral-400">
            更多游戏 <ChevronRight size={12} strokeWidth={2.2} />
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[13px] text-neutral-400">
            暂无相关游戏
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => { window.location.href = `/games/${g.id}`; }} />
            ))}
          </div>
        )}

        <a
          href="/games"
          className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white text-[13px] font-semibold text-neutral-800 transition-colors active:bg-neutral-50"
        >
          更多游戏 <ChevronRight size={13} strokeWidth={2.2} />
        </a>
      </div>
    </section>
  );
}
