import type { Game } from "../../types/home";

/** 每个游戏对应的独立 SVG 牌面图形 */
function GameArt({ id }: { id: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "go":
      // 麻将「中」
      return (
        <svg viewBox="0 0 100 120" className="h-[78%] w-auto" aria-hidden="true">
          <rect x="12" y="14" width="76" height="92" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <rect x="16" y="18" width="68" height="84" rx="8" fill="none" stroke="#dc2626" strokeWidth="2" />
          <text x="50" y="78" textAnchor="middle" fontSize="52" fontWeight="900" fill="#dc2626" fontFamily="serif">中</text>
        </svg>
      );
    case "wg":
      // 小丑牌
      return (
        <svg viewBox="0 0 100 120" className="h-[78%] w-auto" aria-hidden="true">
          <rect x="10" y="10" width="80" height="100" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <text x="20" y="34" fontSize="18" fontWeight="900" fill="#111827" fontFamily="serif">J</text>
          <circle cx="50" cy="65" r="18" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
          <circle cx="44" cy="62" r="2.5" fill="#111827" />
          <circle cx="56" cy="62" r="2.5" fill="#111827" />
          <path d="M42 72 Q50 78 58 72" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 55 L42 48 L48 55 L42 62 Z M52 55 L58 48 L65 55 L58 62 Z" fill="#dc2626" />
        </svg>
      );
    case "ky":
      // 黑桃
      return (
        <svg viewBox="0 0 100 120" className="h-[82%] w-auto text-neutral-900" aria-hidden="true">
          <path d="M50 20 C 30 45, 15 60, 15 75 a 12 12 0 0 0 20 9 L35 105 L65 105 L65 84 a 12 12 0 0 0 20 -9 C 85 60, 70 45, 50 20 Z"
                fill="#111827" stroke="#374151" strokeWidth="1.5" />
        </svg>
      );
    case "leg":
      // 黑桃 A
      return (
        <svg viewBox="0 0 100 120" className="h-[78%] w-auto" aria-hidden="true">
          <rect x="10" y="10" width="80" height="100" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <text x="18" y="30" fontSize="16" fontWeight="900" fill="#111827" fontFamily="serif">A</text>
          <path d="M50 40 C 38 60, 28 70, 28 80 a 8 8 0 0 0 14 6 L42 96 L58 96 L58 86 a 8 8 0 0 0 14 -6 C 72 70, 62 60, 50 40 Z" fill="#111827" />
          <text x="82" y="112" textAnchor="end" fontSize="16" fontWeight="900" fill="#111827" fontFamily="serif">A</text>
        </svg>
      );
    case "baisheng":
      // 双骰
      return (
        <svg viewBox="0 0 120 120" className="h-[78%] w-auto" aria-hidden="true">
          <rect x="12" y="28" width="60" height="60" rx="12" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <circle cx="30" cy="46" r="4" fill="#111827" />
          <circle cx="30" cy="70" r="4" fill="#111827" />
          <circle cx="54" cy="46" r="4" fill="#111827" />
          <circle cx="54" cy="70" r="4" fill="#111827" />
          <circle cx="42" cy="58" r="4" fill="#dc2626" />
          <rect x="52" y="46" width="60" height="60" rx="12" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <circle cx="70" cy="66" r="4" fill="#111827" />
          <circle cx="94" cy="66" r="4" fill="#111827" />
          <circle cx="82" cy="76" r="4" fill="#111827" />
          <circle cx="82" cy="92" r="4" fill="#dc2626" />
        </svg>
      );
    case "wl":
    default:
      // 扑克 J
      return (
        <svg viewBox="0 0 100 120" className="h-[78%] w-auto" aria-hidden="true">
          <rect x="10" y="10" width="80" height="100" rx="10" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
          <text x="18" y="30" fontSize="18" fontWeight="900" fill="#111827" fontFamily="serif">J</text>
          <circle cx="50" cy="68" r="16" fill="#fef3c7" stroke="#92400e" strokeWidth="1.5" />
          <circle cx="45" cy="65" r="2" fill="#111827" />
          <circle cx="55" cy="65" r="2" fill="#111827" />
          <path d="M44 74 Q50 79 56 74" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 58 L42 52 L47 58 L42 64 Z M53 58 L58 52 L62 58 L58 64 Z" fill="#dc2626" />
        </svg>
      );
  }
}

export default function GameCard({ game, onClick }: { game: Game; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-[16px] text-left"
      style={{ aspectRatio: "4 / 3" }}
      aria-label={game.name}
    >
      {/* 每张卡独立渐变背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gameGradient(game.id)}`} />
      {/* 装饰光斑 */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-2xl" />

      {/* 牌面图形 */}
      <div className="relative flex h-full items-center justify-center pb-4">
        <GameArt id={game.id} />
      </div>

      {/* 底部暗角 */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

      {/* 标签 */}
      <div className="absolute left-2 top-2">
        {game.hot ? (
          <span className="rounded-full px-2 py-[3px] text-[10px] font-black tracking-wider text-white shadow-sm" style={{ background: "#e53935" }}>
            HOT
          </span>
        ) : game.recommended ? (
          <span className="rounded-full px-2 py-[3px] text-[10px] font-black tracking-wider text-white shadow-sm" style={{ background: "#32a66a" }}>
            推荐
          </span>
        ) : null}
      </div>

      {/* 名称 */}
      <div className="absolute bottom-2 left-2.5 right-2 truncate text-[13px] font-black text-white"
           style={{ textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}>
        {game.name}
      </div>
    </button>
  );
}

function gameGradient(id: string): string {
  switch (id) {
    case "go": return "from-red-800 via-red-900 to-black";
    case "wg": return "from-slate-700 via-slate-900 to-black";
    case "ky": return "from-neutral-800 via-neutral-900 to-black";
    case "leg": return "from-slate-800 via-slate-900 to-black";
    case "baisheng": return "from-red-700 via-red-900 to-black";
    case "wl": return "from-slate-800 via-slate-900 to-black";
    default: return "from-neutral-800 to-black";
  }
}
