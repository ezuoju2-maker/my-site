import type { Game } from "../../types/home";

export default function GameCard({ game, onClick }: { game: Game; onClick?: () => void }) {
  const bgClass = game.id === "go" || game.id === "baisheng"
    ? "from-red-800 via-red-900 to-black"
    : game.id === "ky"
      ? "from-slate-800 via-slate-900 to-black"
      : "from-slate-700 via-slate-800 to-neutral-900";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative block w-full overflow-hidden rounded-xl bg-gradient-to-br ${bgClass} border border-neutral-100 shadow-sm active:scale-[0.98]`}
      style={{ aspectRatio: "1.7 / 1" }}
      aria-label={game.name}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {game.badge && (
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white ${
          game.badge === "HOT" ? "bg-red-500" : "bg-emerald-500"
        }`}>
          {game.badge}
        </span>
      )}

      <span className="absolute bottom-2 left-2.5 right-2.5 truncate text-left text-[13px] font-bold text-white">
        {game.name}
      </span>
    </button>
  );
}
