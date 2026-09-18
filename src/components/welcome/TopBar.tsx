import { ICONS } from "./assets";

export default function TopBar() {
  return (
    <header className="relative overflow-hidden bg-white">
      {/* 背景光晕 */}
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-60 blur-2xl" />
      <div className="absolute right-24 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-transparent opacity-60 blur-2xl" />

      {/* 右侧六边形冰块装饰 */}
      <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none opacity-40">
        <img src={ICONS.hexIce} alt="" className="h-16 w-16 object-contain" />
      </div>
      <div className="pointer-events-none absolute right-16 top-3 select-none opacity-25">
        <img src={ICONS.hexIce} alt="" className="h-8 w-8 object-contain" />
      </div>
      <div className="pointer-events-none absolute right-0 top-8 select-none opacity-20">
        <img src={ICONS.hexIce} alt="" className="h-10 w-10 object-contain" />
      </div>

      <div className="relative mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]">
          <img src="/q8-logo.png" alt="" className="h-8 w-8 object-contain" style={{ filter: "invert(1)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[20px] font-black tracking-tight text-neutral-900">Q8Top</div>
          <div className="text-[11px] text-neutral-400">www.q8top.cc</div>
        </div>
      </div>
    </header>
  );
}
