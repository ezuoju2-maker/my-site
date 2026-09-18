import { useState } from "react";

const BANNERS = [
  { title: "顶级游戏体验", desc: "安全 · 稳定 · 专业 · 贴心", bg: "from-slate-900 via-neutral-800 to-neutral-900", emoji: "🎮" },
  { title: "新人专享礼包", desc: "注册即送，福利多多", bg: "from-rose-900 via-pink-900 to-neutral-900", emoji: "🎁" },
  { title: "每日签到奖励", desc: "天天签到，天天领取", bg: "from-sky-900 via-blue-900 to-neutral-900", emoji: "📅" },
  { title: "限时双倍返利", desc: "活动期间，奖励翻倍", bg: "from-amber-900 via-orange-900 to-neutral-900", emoji: "🔥" },
  { title: "VIP 专属特权", desc: "尊享服务，贴心呵护", bg: "from-violet-900 via-purple-900 to-neutral-900", emoji: "👑" },
  { title: "邀请好友返现", desc: "好友入驻，即享返现", bg: "from-emerald-900 via-teal-900 to-neutral-900", emoji: "🤝" },
  { title: "24 小时客服", desc: "全天候服务，随叫随到", bg: "from-cyan-900 via-blue-900 to-neutral-900", emoji: "💬" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className={`relative h-[140px] overflow-hidden rounded-2xl bg-gradient-to-br ${b.bg} shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]`}>
      {/* 右侧大装饰 */}
      <div className="absolute -right-2 -bottom-2 text-[120px] leading-none opacity-25 select-none pointer-events-none">
        {b.emoji}
      </div>
      {/* 光晕 */}
      <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex h-full flex-col justify-center p-5">
        <div className="text-[22px] font-black tracking-tight text-white drop-shadow">{b.title}</div>
        <div className="mt-1 text-[12px] text-white/70">{b.desc}</div>
      </div>

      {/* 指示点 */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1">
        {BANNERS.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            className={`h-1 rounded-full transition-all ${i === idx ? "w-5 bg-amber-400" : "w-1 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
