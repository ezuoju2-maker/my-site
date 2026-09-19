import { useEffect, useRef, useState } from "react";
import type { BannerSlide } from "../../types/home";
import "./HeroBanner.css";

const SLIDES: BannerSlide[] = [
  {
    id: "b1",
    title: "每日签到奖励",
    subtitle: "天天签到，天天领取",
    image: "/assets/banners/banner-01.webp",
  },
  {
    id: "b2",
    title: "顶级游戏体验",
    subtitle: "安全 · 稳定 · 专业 · 贴心",
    image: "/assets/banners/banner-02.webp",
  },
  {
    id: "b3",
    title: "热门游戏推荐",
    subtitle: "更多精彩游戏等你体验",
    image: "/assets/banners/banner-03.webp",
  },
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

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      setIdx((i) => (dx < 0 ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length));
    }
    touchX.current = null;
  }

  const current = SLIDES[idx];

  return (
    <section
      className="q8-banner"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="活动轮播"
    >
      {SLIDES.map((s, i) => (
        <img
          key={s.id}
          src={s.image}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          className={`q8-banner-img ${i === idx ? "active" : ""}`}
        />
      ))}
      <div className="q8-banner-overlay" />

      <div className="q8-banner-copy">
        <div className="q8-banner-title">{current.title}</div>
        <div className="q8-banner-sub">{current.subtitle}</div>
      </div>

      <div className="q8-banner-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`q8-banner-dot ${i === idx ? "active" : ""}`}
            aria-label={`切换到第 ${i + 1} 张`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </section>
  );
}
