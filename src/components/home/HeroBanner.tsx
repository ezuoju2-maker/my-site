import { useEffect, useState } from "react";

const SLIDES = [
  { id: "b1", title: "每日签到奖励", subtitle: "天天签到，天天领取" },
  { id: "b2", title: "顶级游戏体验", subtitle: "安全 · 稳定 · 专业 · 贴心" },
  { id: "b3", title: "热门游戏推荐", subtitle: "更多精彩游戏等你体验" },
];

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  const cur = SLIDES[idx];

  return (
    <section
      className="relative h-[148px] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-900 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="活动轮播"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black" />
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex h-full flex-col justify-center px-5">
        <div className="text-[22px] font-bold leading-tight tracking-tight text-white">{cur.title}</div>
        <div className="mt-1.5 text-[13px] text-white/75">{cur.subtitle}</div>
      </div>

      <div className="absolute bottom-3 left-5 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`切换到第 ${i + 1} 张`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
