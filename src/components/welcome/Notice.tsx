import { IcoMegaphone, IcoArrow } from "./icons";

export default function Notice() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
      <span className="shrink-0 text-neutral-800"><IcoMegaphone /></span>
      <span className="shrink-0 text-sm font-bold text-neutral-900">公告</span>
      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
        系统已升级，欢迎使用 Q8Top 账号中心
      </span>
      <IcoArrow />
    </div>
  );
}
