export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900">
          <img src="/q8-logo.png" alt="" className="h-7 w-7 object-contain" style={{ filter: "invert(1)" }} />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-neutral-900">Q8Top</div>
          <div className="text-[11px] text-neutral-400">q8top.cc.cd</div>
        </div>
      </div>
    </header>
  );
}
