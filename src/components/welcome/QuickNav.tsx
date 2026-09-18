import type { ReactNode } from "react";
import { IcoHome, IcoGift, IcoBell, IcoChat, IcoMore, IcoUser } from "./icons";

const ITEMS: { key: string; label: string; Icon: () => ReactNode; active?: boolean }[] = [
  { key: "home", label: "首页", Icon: IcoHome, active: true },
  { key: "gift", label: "优惠", Icon: IcoGift },
  { key: "bell", label: "通知", Icon: IcoBell },
  { key: "chat", label: "客服", Icon: IcoChat },
  { key: "more", label: "其他", Icon: IcoMore },
  { key: "me", label: "我的", Icon: IcoUser },
];

export default function QuickNav() {
  return (
    <div className="grid grid-cols-6 rounded-2xl border border-neutral-100 bg-white py-3">
      {ITEMS.map(({ key, label, Icon, active }) => (
        <button key={key} type="button" className="relative flex flex-col items-center gap-1.5">
          <span className={active ? "text-neutral-900" : "text-neutral-500"}><Icon /></span>
          <span className={`text-[11px] ${active ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>{label}</span>
          {active && <span className="absolute -bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-amber-400" />}
        </button>
      ))}
    </div>
  );
}
