import { IcoFire, IcoArrow } from "./icons";

type Game = { id: string; name: string; hot: boolean; bg: string; emoji: string };

const GAMES: Game[] = [
  { id: "1", name: "GO 棋牌", hot: true, bg: "from-red-700 via-red-800 to-red-950", emoji: "🀄" },
  { id: "2", name: "WG 棋牌", hot: false, bg: "from-slate-700 via-slate-800 to-neutral-950", emoji: "🃏" },
  { id: "3", name: "KY 棋牌", hot: true, bg: "from-slate-800 via-neutral-900 to-black", emoji: "♠️" },
  { id: "4", name: "LEG 棋牌", hot: false, bg: "from-slate-700 via-slate-800 to-neutral-950", emoji: "♠️" },
  { id: "5", name: "百胜棋牌", hot: true, bg: "from-red-700 via-red-800 to-red-950", emoji: "🎲" },
  { id: "6", name: "WL 棋牌", hot: false, bg: "from-slate-700 via-slate-800 to-neutral-950", emoji: "🃏" },
];

export default function GameGrid() {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-neutral-100">
      {/* 头部 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500"><IcoFire /></span>
          <span className="text-[15px] font-black text-neutral-900">热门游戏</span>
        </div>
        <button type="button" className="flex items-center gap-0.5 text-[11px] font-medium text-neutral-400">
          更多游戏 <IcoArrow />
        </button>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-2 gap-2.5">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className="group text-left transition-transform active:scale-[0.97]">
            <div className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${g.bg} shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]`}>
              {/* 暗角 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* emoji 中偏右 */}
              <div className="relative flex h-full items-center justify-end pr-3 text-[58px] leading-none drop-shadow-xl">
                {g.emoji}
              </div>
              {/* HOT / 推荐 标签（左上） */}
              <div className="absolute left-2 top-2">
                {g.hot ? (
                  <span className="rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white shadow-md">
                    HOT
                  </span>
                ) : (
                  <span className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white shadow-md">
                    推荐
                  </span>
                )}
              </div>
              {/* 名称（左下） */}
              <div className="absolute bottom-1.5 left-2 right-2 truncate text-[13px] font-black text-white drop-shadow-md">
                {g.name}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 更多 */}
      <button type="button" className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-neutral-50 text-[13px] font-bold text-neutral-700 ring-1 ring-neutral-200 transition-all hover:bg-neutral-100 active:scale-[0.98]">
        更多游戏 <IcoArrow />
      </button>
    </div>
  );
}
