import { useState } from "react";
import { IconArrowLeft, IconArrowRight } from "./icons";

const BANNERS = [
  { tag: "安全推荐", title: "添加 Passkey", desc: "使用面容 / 指纹，1 秒登录", cta: "立即添加", href: "/passkey/recover/", emoji: "🔑", accent: "from-amber-400 to-orange-500" },
  { tag: "账号保护", title: "管理登录设备", desc: "查看所有登录记录，撤销陌生设备", cta: "前往查看", href: "/settings/devices/", emoji: "📱", accent: "from-sky-400 to-blue-500" },
  { tag: "安全提醒", title: "设置强密码", desc: "定期更换密码，保护账号安全", cta: "去修改", href: "/forgot-password/", emoji: "🔒", accent: "from-emerald-400 to-green-500" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-black ring-1 ring-white/5"
         style={{ boxShadow: "0 8px 32px -8px rgba(0,0,0,0.25)" }}>
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${b.accent} opacity-25 blur-3xl`} />
      <div className={`absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-tr ${b.accent} opacity-20 blur-3xl`} />

      <div className="relative p-5">
        <span className={`absolute right-5 top-5 rounded-full bg-gradient-to-r ${b.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg`}>
          {b.tag}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/15 backdrop-blur">
            {b.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-bold tracking-tight text-white">{b.title}</div>
            <div className="mt-0.5 text-[12px] text-white/70">{b.desc}</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <a href={b.href}
             className={`inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r ${b.accent} px-5 text-[13px] font-bold text-white shadow-lg transition-transform active:scale-[0.97]`}>
            {b.cta}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>

          <div className="flex items-center gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
                aria-label={`第 ${i + 1} 个`}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20 active:scale-95"
        aria-label="上一个"
      >
        <IconArrowLeft />
      </button>
      <button
        type="button"
        onClick={() => setIdx((i) => (i + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20 active:scale-95"
        aria-label="下一个"
      >
        <IconArrowRight />
      </button>
    </div>
  );
}
