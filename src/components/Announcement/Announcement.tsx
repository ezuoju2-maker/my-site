import { Volume2, ChevronRight } from "lucide-react";
import "./Announcement.css";

export default function Announcement() {
  return (
    <a href="/announcements" className="q8-announce q8-tap">
      <Volume2 size={20} strokeWidth={1.9} className="q8-announce-icon" />
      <span className="q8-announce-label">公告</span>
      <span className="q8-announce-divider" />
      <span className="q8-announce-text">
        欢迎来到Q8Top平台，注册送好礼，充值享超值优惠...
      </span>
      <ChevronRight size={16} strokeWidth={2} className="q8-announce-arrow" />
    </a>
  );
}
