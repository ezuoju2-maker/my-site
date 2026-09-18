import { IcoMegaphone, IcoArrow } from "./icons";

export default function Notice() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-neutral-100">
      <span className="shrink-0 text-neutral-800"><IcoMegaphone /></span>
      <span className="shrink-0 text-[15px] font-black text-neutral-900">公告</span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-500">
        欢迎来到Q8Top平台，注册送好礼，充值享超值优惠...
      </span>
      <IcoArrow />
    </div>
  );
}
