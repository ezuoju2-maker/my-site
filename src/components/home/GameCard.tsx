import type { Game } from "../../types/home";

function GameArt({ id }: { id: string }) {
  if (id === "go") {
    return (
      <svg viewBox="0 0 100 120" aria-hidden="true">
        <rect x="10" y="12" width="80" height="96" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
        <rect x="14" y="16" width="72" height="88" rx="8" fill="none" stroke="#dc2626" strokeWidth="1.5" />
        <text x="50" y="80" textAnchor="middle" fontSize="52" fontWeight="900" fill="#dc2626" fontFamily="serif">中</text>
      </svg>
    );
  }
  if (id === "wg" || id === "wl") {
    return (
      <svg viewBox="0 0 100 120" aria-hidden="true">
        <rect x="10" y="10" width="80" height="100" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
        <text x="18" y="32" fontSize="18" fontWeight="900" fill="#111827" fontFamily="serif">J</text>
        <circle cx="50" cy="68" r="16" fill="#fef3c7" stroke="#92400e" strokeWidth="1.5" />
        <circle cx="45" cy="65" r="2" fill="#111827" />
        <circle cx="55" cy="65" r="2" fill="#111827" />
        <path d="M44 74 Q50 79 56 74" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 58 L42 52 L47 58 L42 64 Z M53 58 L58 52 L62 58 L58 64 Z" fill="#dc2626" />
      </svg>
    );
  }
  if (id === "ky") {
    return (
      <svg viewBox="0 0 100 120" aria-hidden="true">
        <path d="M50 20 C 30 45, 15 60, 15 75 a 12 12 0 0 0 20 9 L35 105 L65 105 L65 84 a 12 12 0 0 0 20 -9 C 85 60, 70 45, 50 20 Z"
              fill="#111827" stroke="#374151" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === "leg") {
    return (
      <svg viewBox="0 0 100 120" aria-hidden="true">
        <rect x="10" y="10" width="80" height="100" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
        <text x="18" y="32" fontSize="18" fontWeight="900" fill="#111827" fontFamily="serif">A</text>
        <path d="M50 40 C 38 60, 28 70, 28 80 a 8 8 0 0 0 14 6 L42 96 L58 96 L58 86 a 8 8 0 0 0 14 -6 C 72 70, 62 60, 50 40 Z" fill="#111827" />
      </svg>
    );
  }
  if (id === "baisheng") {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <rect x="14" y="30" width="58" height="58" rx="12" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
        <circle cx="30" cy="46" r="4" fill="#111827" />
        <circle cx="30" cy="72" r="4" fill="#111827" />
        <circle cx="56" cy="46" r="4" fill="#111827" />
        <circle cx="56" cy="72" r="4" fill="#111827" />
        <circle cx="43" cy="59" r="4" fill="#dc2626" />
        <rect x="54" y="46" width="58" height="58" rx="12" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
        <circle cx="70" cy="64" r="4" fill="#111827" />
        <circle cx="96" cy="64" r="4" fill="#111827" />
        <circle cx="83" cy="76" r="4" fill="#dc2626" />
        <circle cx="83" cy="92" r="4" fill="#111827" />
      </svg>
    );
  }
  return null;
}

export default function GameCard({ game, onClick }: { game: Game; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block w-full overflow-hidden rounded-xl border border-neutral-100 text-left shadow-sm transition-transform active:scale-[0.98]"
      style={{ aspectRatio: "1.7 / 1" }}
      aria-label={game.name}
    >
      <div className={`absolute inset-0 ${
        game.id === "go" || game.id === "baisheng"
          ? "bg-gradient-to-br from-red-900 via-red-950 to-black"
          : game.id === "ky"
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-black"
            : "bg-gradient-to-br from-slate-700 via-slate-900 to-black"
      }`} />
      <img
        src={game.image}
        alt=""
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center pb-[22%]">
        <div className="h-[76%] w-auto drop-shadow-lg">
          <GameArt id={game.id} />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {game.badge === "HOT" && (
        <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
          HOT
        </span>
      )}
      {game.badge === "推荐" && (
        <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
          推荐
        </span>
      )}

      <span className="absolute bottom-2 left-2.5 right-2.5 truncate text-[13px] font-bold text-white drop-shadow-md">
        {game.name}
      </span>
    </button>
  );
}
