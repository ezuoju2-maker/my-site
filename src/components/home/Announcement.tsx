import { Volume2, ChevronRight } from "lucide-react";

export default function Announcement() {
  return (
    <a
      href="/announcements"
      className="h-card h-card-md h-tap flex items-center gap-3"
      style={{ padding: "0 18px", height: 60 }}
    >
      <Volume2 size={20} strokeWidth={1.9} className="shrink-0 text-neutral-800" />
      <span className="shrink-0 text-[15px] font-black text-neutral-900">公告</span>
      <span className="h-4 w-px shrink-0 bg-neutral-200" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-[#777b82]">
        欢迎来到Q8Top平台，注册送好礼，充值享超值优惠...
      </span>
      <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-neutral-300" />
    </a>
  );
}
