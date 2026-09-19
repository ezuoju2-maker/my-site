import { useEffect, useRef, useState } from "react";
import { MOCK_BANNERS } from "../../data/home";

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % MOCK_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [paused]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setIdx((i) => (i + 1) % MOCK_BANNERS.length);
      else setIdx((i) => (i - 1 + MOCK_BANNERS.length) % MOCK_BANNERS.length);
    }
    touchStartX.current = null;
  }

  const b = MOCK_BANNERS[idx];

  return (
    <section
      className="h-card h-card-lg relative overflow-hidden"
      style={{ height: 150 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="活动轮播"
    >
      {/* 背景：优先真实图，没有则降级为深色渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black" />
      <img
        src={b.image}
        alt=""
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 左侧加深，保证文字可读 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />

      {/* 文案 */}
      <div className="relative flex h-full flex-col justify-center" style={{ padding: "0 20px" }}>
        <div className="text-[26px] font-black leading-tight tracking-tight text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          {b.title}
        </div>
        <div className="mt-2 text-[13px] tracking-wide text-white/75">{b.subtitle}</div>
      </div>

      {/* 轮播指示器 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {MOCK_BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`切换到第 ${i + 1} 张`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-5 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
