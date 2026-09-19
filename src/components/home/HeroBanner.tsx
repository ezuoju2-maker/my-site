import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: string;
};

const SLIDES: Slide[] = [
  { id: "b1", title: "每日签到奖励", subtitle: "天天签到，天天领取", image: "/assets/banners/banner-01.webp", gradient: "from-neutral-900 via-neutral-800 to-black" },
  { id: "b2", title: "顶级游戏体验", subtitle: "安全 · 稳定 · 专业 · 贴心", image: "/assets/banners/banner-02.webp", gradient: "from-slate-900 via-neutral-900 to-black" },
  { id: "b3", title: "热门游戏推荐", subtitle: "更多精彩游戏等你体验", image: "/assets/banners/banner-03.webp", gradient: "from-rose-950 via-neutral-900 to-black" },
];

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      setIdx((i) => (dx < 0 ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length));
    }
    touchX.current = null;
  }

  const cur = SLIDES[idx];

  return (
    <section
      className="relative h-[150px] overflow-hidden rounded-2xl border border-neutral-100 shadow-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="活动轮播"
    >
      {/* 每张 slide 独立背景 */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? "opacity-100" : "opacity-0"}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
          <img
            src={s.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        </div>
      ))}

      {/* 文案 */}
      <div className="relative flex h-full flex-col justify-center px-5">
        <div className="text-[22px] font-bold leading-tight tracking-tight text-white">
          {cur.title}
        </div>
        <div className="mt-1.5 text-[13px] text-white/80">{cur.subtitle}</div>
      </div>

      {/* 指示点 */}
      <div className="absolute bottom-3 left-5 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`切换到第 ${i + 1} 张`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
