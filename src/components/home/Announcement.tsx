import { Volume2, ChevronRight } from "lucide-react";

export default function Announcement() {
  return (
    <a
      href="/announcements"
      className="flex h-14 items-center gap-2.5 rounded-2xl border border-neutral-100 bg-white px-4 shadow-sm transition-colors active:bg-neutral-50"
    >
      <Volume2 size={18} strokeWidth={1.9} className="shrink-0 text-neutral-800" />
      <span className="shrink-0 text-[14px] font-semibold text-neutral-900">公告</span>
      <span className="h-3.5 w-px shrink-0 bg-neutral-200" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-500">
        欢迎来到Q8Top平台，注册送好礼，充值享超值优惠...
      </span>
      <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-neutral-300" />
    </a>
  );
}
