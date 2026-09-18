import type { ReactNode } from "react";
import { IcoHome, IcoGift, IcoBell, IcoChat, IcoMore, IcoUser } from "./icons";

type Item = { key: string; label: string; Icon: () => ReactNode; active?: boolean };

const ITEMS: Item[] = [
  { key: "home", label: "首页", Icon: IcoHome, active: true },
  { key: "gift", label: "优惠", Icon: IcoGift },
  { key: "bell", label: "通知", Icon: IcoBell },
  { key: "chat", label: "客服", Icon: IcoChat },
  { key: "more", label: "其他", Icon: IcoMore },
  { key: "me", label: "我的", Icon: IcoUser },
];

export default function QuickNav() {
  return (
    <div className="grid grid-cols-6 rounded-2xl bg-white py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-neutral-100">
      {ITEMS.map(({ key, label, Icon, active }) => (
        <button key={key} type="button" className="flex flex-col items-center gap-1.5">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            active
              ? "bg-gradient-to-br from-neutral-800 to-neutral-950 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
              : "bg-neutral-100 text-neutral-600"
          }`}>
            <Icon />
          </span>
          <span className={`text-[11px] ${active ? "font-bold text-neutral-900" : "font-medium text-neutral-500"}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
