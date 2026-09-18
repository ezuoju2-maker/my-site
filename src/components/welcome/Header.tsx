import { IconMenu } from "./icons";

export default function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900">
            <img src="/q8-logo.png" alt="" className="h-7 w-7 object-contain" style={{ filter: "invert(1)" }} />
          </div>
          <div>
            <div className="text-base font-bold leading-tight text-neutral-900">Q8Top</div>
            <div className="text-[11px] leading-tight text-neutral-400">q8top.cc.cd</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-800 hover:bg-neutral-100"
          aria-label="菜单"
        >
          <IconMenu />
        </button>
      </div>
    </header>
  );
}
