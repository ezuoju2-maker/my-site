import { useState } from "react";
import { IconArrowLeft, IconArrowRight } from "./icons";

const BANNERS = [
  { tag: "安全推荐", title: "添加 Passkey", desc: "使用面容 / 指纹，1 秒登录", cta: "立即添加", href: "/passkey/recover/", emoji: "🔑" },
  { tag: "账号保护", title: "管理登录设备", desc: "查看所有登录记录，撤销陌生设备", cta: "前往查看", href: "/settings/devices/", emoji: "📱" },
  { tag: "安全提醒", title: "设置强密码", desc: "定期更换密码，保护账号安全", cta: "去修改", href: "/forgot-password/", emoji: "🔒" },
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const b = BANNERS[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white">
      <div className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium">
        {b.tag}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
          {b.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold">{b.title}</div>
          <div className="mt-0.5 text-xs opacity-80">{b.desc}</div>
        </div>
      </div>
      <a href={b.href} className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-yellow-400 px-4 text-xs font-bold text-neutral-900">
        {b.cta} →
      </a>

      <button
        type="button"
        onClick={() => setIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/20"
        aria-label="上一个"
      >
        <IconArrowLeft />
      </button>
      <button
        type="button"
        onClick={() => setIdx((i) => (i + 1) % BANNERS.length)}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/20"
        aria-label="下一个"
      >
        <IconArrowRight />
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
            aria-label={`第 ${i + 1} 个`}
          />
        ))}
      </div>
    </div>
  );
}
