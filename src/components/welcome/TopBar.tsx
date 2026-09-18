export default function TopBar() {
  return (
    <header className="relative overflow-hidden bg-white">
      {/* 背景光晕 */}
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-70 blur-2xl" />
      <div className="absolute right-10 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-transparent opacity-70 blur-2xl" />

      <div className="relative mx-auto flex max-w-2xl items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]">
            <img src="/q8-logo.png" alt="" className="h-8 w-8 object-contain" style={{ filter: "invert(1)" }} />
          </div>
          <div className="leading-tight">
            <div className="text-[19px] font-black tracking-tight text-neutral-900">Q8Top</div>
            <div className="text-[11px] text-neutral-400">www.q8top.cc</div>
          </div>
        </div>
        <button type="button" className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm">
          <span className="text-base">🌐</span>
          中文
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </header>
  );
}
