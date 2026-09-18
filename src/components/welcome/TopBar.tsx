export default function TopBar() {
  return (
    <header className="relative overflow-hidden bg-white">
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-60 blur-2xl" />
      <div className="absolute right-20 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-transparent opacity-60 blur-2xl" />

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
