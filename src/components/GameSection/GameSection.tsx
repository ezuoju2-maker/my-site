import { useMemo, useState } from "react";
import { Flame, ChevronRight } from "lucide-react";
import type { Game } from "../../types/home";
import GameCategories from "../GameCategories/GameCategories";
import GameCard from "../GameCard/GameCard";
import "./GameSection.css";

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
    <section className="q8-games-layout">
      <GameCategories active={cat} onChange={setCat} />

      <div className="q8-games-panel">
        <div className="q8-games-header">
          <div className="q8-games-title">
            <Flame size={18} strokeWidth={2.3} className="q8-games-title-flame" />
            热门游戏
          </div>
          <a href="/games" className="q8-games-more">
            更多游戏 <ChevronRight size={13} strokeWidth={2.2} />
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="q8-games-empty">暂无相关游戏</div>
        ) : (
          <div className="q8-games-grid">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => { window.location.href = `/games/${g.id}`; }} />
            ))}
          </div>
        )}

        <a href="/games" className="q8-games-footer">
          更多游戏 <ChevronRight size={14} strokeWidth={2.2} />
        </a>
      </div>
    </section>
  );
}
