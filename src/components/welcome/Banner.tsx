import { useState } from "react";

const BANNERS = [
  { title: "顶级游戏体验", desc: "安全 · 稳定 · 专业 · 贴心", bg: "from-neutral-900 via-neutral-800 to-black", emoji: "🎮" },
  { title: "新人专享礼包", desc: "注册即送，福利多多", bg: "from-rose-950 via-neutral-900 to-black", emoji: "🎁" },
  { title: "每日签到奖励", desc: "天天签到，天天领取", bg: "from-sky-950 via-neutral-900 to-black", emoji: "📅" },
  { title: "限时双倍返利", desc: "活动期间，奖励翻倍", bg: "from-amber-950 via-neutral-900 to-black", emoji: "🔥" },
  { title: "VIP 专属特权", desc: "尊享服务，贴心呵护", bg: "from-violet-950 via-neutral-900 to-black", emoji: "👑" },
  { title: "邀请好友返现", desc: "好友入驻，即享返现", bg: "from-emerald-950 via-neutral-900 to-black", emoji: "🤝" },
  { title: "24 小时客服", desc: "全天候服务，随叫随到", bg: "from-cyan-950 via-neutral-900 to-black", emoji: "💬" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className={`relative h-[150px] overflow-hidden rounded-2xl bg-gradient-to-br ${b.bg} shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]`}>
      {/* 右侧大装饰 */}
      <div className="pointer-events-none absolute -right-3 bottom-0 select-none text-[110px] leading-none opacity-30">
        {b.emoji}
      </div>
      {/* 左侧光晕 */}
      <div className="absolute -left-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex h-full flex-col justify-center p-5">
        <div className="text-[24px] font-black leading-tight tracking-tight text-white drop-shadow-md">
          {b.title}
        </div>
        <div className="mt-2 text-[12px] tracking-wide text-white/70">{b.desc}</div>
      </div>

      {/* 指示点：当前金色长条 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-1 rounded-full transition-all ${
              i === idx ? "w-6 bg-amber-400" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
