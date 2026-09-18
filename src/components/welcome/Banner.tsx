import { useState } from "react";

const BANNERS = [
  { tag: "热门推荐", title: "畅玩热门游戏", desc: "赢取丰厚奖励", cta: "立即查看", bg: "from-indigo-600 via-purple-700 to-fuchsia-700", emoji: "🎮" },
  { tag: "新人专享", title: "注册即送好礼", desc: "新人专属福利等你拿", cta: "立即领取", bg: "from-rose-500 via-pink-600 to-fuchsia-600", emoji: "🎁" },
  { tag: "每日签到", title: "签到领积分", desc: "天天签到天天领", cta: "去签到", bg: "from-sky-500 via-blue-600 to-indigo-600", emoji: "📅" },
  { tag: "限时活动", title: "限时双倍奖励", desc: "活动期间奖励翻倍", cta: "了解详情", bg: "from-amber-500 via-orange-500 to-red-500", emoji: "🔥" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className={`relative h-[150px] overflow-hidden rounded-2xl bg-gradient-to-br ${b.bg} shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]`}>
      {/* 光晕装饰 */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      {/* 星星点 */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1px, transparent 1.5px), radial-gradient(circle at 45% 85%, white 1px, transparent 1.5px)",
        backgroundSize: "120px 120px, 80px 80px, 100px 100px"
      }} />

      {/* 右侧大 emoji */}
      <div className="absolute -bottom-2 right-2 text-[100px] leading-none opacity-30 select-none pointer-events-none">
        {b.emoji}
      </div>

      <div className="relative flex h-full flex-col justify-between p-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-white" />
            {b.tag}
          </span>
          <div className="mt-2 text-[22px] font-black tracking-tight text-white drop-shadow-md">{b.title}</div>
          <div className="mt-0.5 text-xs text-white/90">{b.desc}</div>
        </div>
        <a href="#" className="inline-flex h-8 w-fit items-center gap-1 rounded-lg bg-white/95 px-4 text-xs font-bold text-neutral-900 shadow-lg backdrop-blur">
          {b.cta} <span>→</span>
        </a>
      </div>

      {/* 左右箭头 */}
      <button type="button" onClick={() => setIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50 active:scale-95">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button type="button" onClick={() => setIdx((i) => (i + 1) % BANNERS.length)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50 active:scale-95">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* 指示点 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
