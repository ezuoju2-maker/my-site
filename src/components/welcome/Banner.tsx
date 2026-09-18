import { useState } from "react";

const BANNERS = [
  { tag: "热门推荐", title: "畅玩热门游戏", desc: "赢取丰厚奖励", cta: "立即查看", bg: "from-neutral-900 via-neutral-800 to-neutral-900", emoji: "🎮", accent: "text-amber-400" },
  { tag: "新人专享", title: "注册即送好礼", desc: "新人专属福利等你拿", cta: "立即领取", bg: "from-purple-900 via-neutral-900 to-neutral-900", emoji: "🎁", accent: "text-pink-400" },
  { tag: "每日签到", title: "签到领积分", desc: "天天签到天天领", cta: "去签到", bg: "from-blue-900 via-neutral-900 to-neutral-900", emoji: "📅", accent: "text-sky-400" },
  { tag: "限时活动", title: "限时双倍奖励", desc: "活动期间奖励翻倍", cta: "了解详情", bg: "from-rose-900 via-neutral-900 to-neutral-900", emoji: "🔥", accent: "text-rose-400" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${b.bg} h-[140px]`}>
      {/* 装饰 */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute bottom-2 right-4 text-6xl opacity-20">{b.emoji}</div>

      <div className="relative flex h-full flex-col justify-between p-4">
        <div>
          <span className={`inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium ${b.accent} backdrop-blur`}>
            <span className="h-1 w-1 rounded-full bg-current" />
            {b.tag}
          </span>
          <div className="mt-2 text-xl font-bold text-white">{b.title}</div>
          <div className="mt-0.5 text-xs text-white/70">{b.desc}</div>
        </div>
        <a href="#" className="inline-flex h-8 w-fit items-center gap-1 rounded-lg bg-amber-400 px-3.5 text-xs font-bold text-neutral-900">
          {b.cta} <span>→</span>
        </a>
      </div>

      {/* 左右箭头 */}
      <button type="button" onClick={() => setIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button type="button" onClick={() => setIdx((i) => (i + 1) % BANNERS.length)}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* 指示点 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
