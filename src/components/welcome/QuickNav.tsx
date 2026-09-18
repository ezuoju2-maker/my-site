import type { ReactNode } from "react";
import { IcoHome, IcoGift, IcoBell, IcoChat, IcoMore, IcoUser } from "./icons";

type Item = {
  key: string;
  label: string;
  Icon: () => ReactNode;
  bg: string;
  fg: string;
  active?: boolean;
};

const ITEMS: Item[] = [
  { key: "home", label: "首页", Icon: IcoHome, bg: "from-sky-400 to-blue-500", fg: "text-white", active: true },
  { key: "gift", label: "优惠", Icon: IcoGift, bg: "from-rose-400 to-pink-500", fg: "text-white" },
  { key: "bell", label: "通知", Icon: IcoBell, bg: "from-amber-400 to-orange-500", fg: "text-white" },
  { key: "chat", label: "客服", Icon: IcoChat, bg: "from-emerald-400 to-teal-500", fg: "text-white" },
  { key: "more", label: "其他", Icon: IcoMore, bg: "from-violet-400 to-purple-500", fg: "text-white" },
  { key: "me", label: "我的", Icon: IcoUser, bg: "from-neutral-600 to-neutral-800", fg: "text-white" },
];

export default function QuickNav() {
  return (
    <div className="grid grid-cols-6 rounded-2xl border border-white/60 bg-white/70 py-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur">
      {ITEMS.map(({ key, label, Icon, bg, fg, active }) => (
        <button key={key} type="button" className="relative flex flex-col items-center gap-1.5 py-1 transition-transform active:scale-95">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${bg} ${fg} shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]`}>
            <Icon />
          </span>
          <span className={`text-[11px] ${active ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>{label}</span>
          {active && <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm" />}
        </button>
      ))}
    </div>
  );
}
