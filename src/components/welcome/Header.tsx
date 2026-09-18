import { IconMenu } from "./icons";

export default function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-neutral-950/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-black ring-1 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/25 via-transparent to-transparent" />
            <img
              src="/q8-logo.png"
              alt=""
              className="relative h-7 w-7 object-contain"
              style={{ filter: "invert(1) brightness(1.5)" }}
            />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-white">Q8Top</div>
            <div className="text-[11px] tracking-wide text-neutral-400">q8top.cc.cd</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
          aria-label="菜单"
        >
          <IconMenu />
        </button>
      </div>
    </header>
  );
}
