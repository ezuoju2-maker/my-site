import type { Game } from "../../types/home";

export default function GameCard({ game, onClick }: { game: Game; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-tap group relative block w-full overflow-hidden rounded-[16px] text-left"
      style={{ aspectRatio: "4 / 3" }}
      aria-label={game.name}
    >
      {/* 背景：深色 + 图 */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
      <img
        src={game.image}
        alt=""
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 底部暗角 */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      {/* HOT / 推荐 标签 */}
      <div className="absolute left-2 top-2">
        {game.hot ? (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide text-white"
                style={{ background: "#e53935" }}>
            HOT
          </span>
        ) : game.recommended ? (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide text-white"
                style={{ background: "#32a66a" }}>
            推荐
          </span>
        ) : null}
      </div>

      {/* 名称 */}
      <div className="absolute bottom-2 left-2.5 right-2 truncate text-[13px] font-black text-white"
           style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
        {game.name}
      </div>
    </button>
  );
}
