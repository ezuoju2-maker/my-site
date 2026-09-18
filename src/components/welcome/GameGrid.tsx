import { IcoFire, IcoArrow } from "./icons";

type Game = { id: string; name: string; tag: string; tagColor: string };

const GAMES: Game[] = [
  { id: "1", name: "游戏名称", tag: "热门", tagColor: "bg-amber-500" },
  { id: "2", name: "游戏名称", tag: "推荐", tagColor: "bg-neutral-400" },
  { id: "3", name: "游戏名称", tag: "热门", tagColor: "bg-amber-500" },
  { id: "4", name: "游戏名称", tag: "推荐", tagColor: "bg-neutral-400" },
  { id: "5", name: "游戏名称", tag: "热门", tagColor: "bg-amber-500" },
  { id: "6", name: "游戏名称", tag: "推荐", tagColor: "bg-neutral-400" },
];

export default function GameGrid() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-3">
      {/* 头部 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500"><IcoFire /></span>
          <span className="text-sm font-bold text-neutral-900">热门游戏</span>
        </div>
        <button type="button" className="text-neutral-400 hover:text-neutral-700">
          <IcoArrow />
        </button>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-2 gap-2">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className="text-left transition-transform active:scale-[0.98]">
            <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
              <div className="flex h-full items-center justify-center text-3xl text-neutral-300">🖼️</div>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <span className={`rounded ${g.tagColor} px-1.5 py-0.5 text-[9px] font-bold text-white`}>{g.tag}</span>
              <span className="truncate text-[11px] text-neutral-500">推荐</span>
            </div>
            <div className="mt-0.5 truncate text-xs font-medium text-neutral-800">{g.name}</div>
          </button>
        ))}
      </div>

      {/* 更多 */}
      <button type="button" className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-neutral-50 text-xs font-medium text-neutral-700 hover:bg-neutral-100">
        更多游戏 <IcoArrow />
      </button>
    </div>
  );
}
