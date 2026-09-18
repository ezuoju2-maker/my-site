import { IcoFire, IcoArrow } from "./icons";

type Game = { id: string; name: string; tag: string; tagColor: string; bg: string; emoji: string };

const GAMES: Game[] = [
  { id: "1", name: "GO 棋牌", tag: "热门", tagColor: "from-red-500 to-orange-500", bg: "from-fuchsia-500 via-purple-600 to-indigo-600", emoji: "🀄" },
  { id: "2", name: "WG 棋牌", tag: "推荐", tagColor: "from-emerald-500 to-teal-500", bg: "from-emerald-500 via-teal-600 to-cyan-600", emoji: "🃏" },
  { id: "3", name: "KY 棋牌", tag: "热门", tagColor: "from-red-500 to-orange-500", bg: "from-rose-500 via-pink-600 to-fuchsia-600", emoji: "🎴" },
  { id: "4", name: "LEG 棋牌", tag: "推荐", tagColor: "from-emerald-500 to-teal-500", bg: "from-sky-500 via-blue-600 to-indigo-600", emoji: "♠️" },
  { id: "5", name: "百胜棋牌", tag: "热门", tagColor: "from-red-500 to-orange-500", bg: "from-amber-500 via-orange-600 to-red-600", emoji: "🎲" },
  { id: "6", name: "WL 棋牌", tag: "推荐", tagColor: "from-emerald-500 to-teal-500", bg: "from-violet-500 via-purple-600 to-fuchsia-600", emoji: "🃏" },
];

export default function GameGrid() {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur">
      {/* 头部 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-orange-500 text-white shadow-sm">
            <IcoFire />
          </span>
          <span className="text-sm font-bold text-neutral-900">热门游戏</span>
        </div>
        <button type="button" className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800">
          全部 <IcoArrow />
        </button>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-2 gap-2.5">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className="group text-left transition-transform active:scale-[0.97]">
            <div className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${g.bg} shadow-[0_4px_16px_-4px_rgba(0,0,0,0.25)]`}>
              {/* 光晕 */}
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1.5px)",
                backgroundSize: "30px 30px"
              }} />
              <div className="relative flex h-full items-center justify-center text-[56px] leading-none drop-shadow-lg">
                {g.emoji}
              </div>
              {/* 底部暗角 */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              <span className={`rounded-md bg-gradient-to-r ${g.tagColor} px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm`}>
                {g.tag}
              </span>
              <span className="truncate text-[10px] text-neutral-500">推荐</span>
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-neutral-800">{g.name}</div>
          </button>
        ))}
      </div>

      {/* 更多 */}
      <button type="button" className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100 text-xs font-semibold text-neutral-700 shadow-sm transition-all hover:from-neutral-100 hover:to-neutral-200 active:scale-[0.98]">
        更多游戏 <IcoArrow />
      </button>
    </div>
  );
}
