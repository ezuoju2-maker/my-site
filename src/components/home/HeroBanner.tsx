import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  accent: string;
  art: "sword" | "shield" | "crown";
};

const SLIDES: Slide[] = [
  { id: "s1", title: "顶级游戏体验", subtitle: "安全 · 稳定 · 专业 · 贴心", bg: "from-neutral-900 via-neutral-800 to-black", accent: "#d4a24a", art: "sword" },
  { id: "s2", title: "新人专享礼包", subtitle: "注册即送，福利多多", bg: "from-rose-950 via-neutral-900 to-black", accent: "#f87171", art: "shield" },
  { id: "s3", title: "每日签到奖励", subtitle: "天天签到，天天领取", bg: "from-amber-950 via-neutral-900 to-black", accent: "#fbbf24", art: "crown" },
];

/** 右侧装饰插画（纯 SVG） */
function BannerArt({ kind, color }: { kind: Slide["art"]; color: string }) {
  if (kind === "sword") {
    return (
      <svg viewBox="0 0 200 200" className="h-[140%] w-auto opacity-90" aria-hidden="true">
        <defs>
          <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          <linearGradient id="hilt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        <path d="M120 30 L135 45 L65 155 L50 140 Z" fill="url(#blade)" stroke="#374151" strokeWidth="1" />
        <path d="M50 140 L60 130 L70 140 L60 150 Z" fill="url(#hilt)" stroke="#78350f" strokeWidth="1" />
        <circle cx="60" cy="140" r="6" fill={color} stroke="#78350f" strokeWidth="1" />
        <path d="M120 30 L128 38 L122 44 L114 36 Z" fill="#fbbf24" />
      </svg>
    );
  }
  if (kind === "shield") {
    return (
      <svg viewBox="0 0 200 200" className="h-[130%] w-auto opacity-90" aria-hidden="true">
        <defs>
          <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
        <path d="M100 30 L160 55 V110 Q160 155 100 175 Q40 155 40 110 V55 Z" fill="url(#sh)" stroke={color} strokeWidth="2.5" />
        <path d="M100 50 L145 68 V110 Q145 145 100 160 Q55 145 55 110 V68 Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <path d="M100 80 L115 100 L100 120 L85 100 Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className="h-[130%] w-auto opacity-90" aria-hidden="true">
      <defs>
        <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <path d="M40 130 L50 60 L80 90 L100 40 L120 90 L150 60 L160 130 Z" fill="url(#cr)" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="40" y="130" width="120" height="18" rx="4" fill="url(#cr)" stroke={color} strokeWidth="2.5" />
      <circle cx="50" cy="60" r="5" fill="#dc2626" />
      <circle cx="100" cy="40" r="5" fill="#dc2626" />
      <circle cx="150" cy="60" r="5" fill="#dc2626" />
    </svg>
  );
}

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(timer);
  }, [paused]);

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setIdx((i) => (i + 1) % SLIDES.length);
      else setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);
    }
    touchStartX.current = null;
  }

  const s = SLIDES[idx];

  return (
    <section
      className={`h-card-lg relative overflow-hidden bg-gradient-to-br ${s.bg}`}
      style={{ height: 150 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="活动轮播"
    >
      {/* 右侧装饰插画 */}
      <div className="absolute -right-6 top-0 flex h-full items-center justify-end">
        <BannerArt kind={s.art} color={s.accent} />
      </div>
      {/* 左侧渐变遮罩（保证文字可读） */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      {/* 光晕 */}
      <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

      {/* 文案 */}
      <div className="relative flex h-full flex-col justify-center" style={{ padding: "0 22px" }}>
        <div className="text-[26px] font-black leading-tight tracking-tight text-white"
             style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
          {s.title}
        </div>
        <div className="mt-2 text-[13px] tracking-wide text-white/80" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {s.subtitle}
        </div>
      </div>

      {/* 指示器 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`切换到第 ${i + 1} 张`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "w-1.5 bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
