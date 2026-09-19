import { useState } from "react";
import { Home, Gift, Bell, Headphones, LayoutGrid, User } from "lucide-react";

type Item = {
  key: string;
  label: string;
  href: string;
  Icon: typeof Home;
};

const ITEMS: Item[] = [
  { key: "home", label: "首页", href: "/welcome/", Icon: Home },
  { key: "promo", label: "优惠", href: "/promotions", Icon: Gift },
  { key: "notice", label: "通知", href: "/notifications", Icon: Bell },
  { key: "support", label: "客服", href: "/support", Icon: Headphones },
  { key: "other", label: "其他", href: "/other", Icon: LayoutGrid },
  { key: "me", label: "我的", href: "/profile", Icon: User },
];

export default function MainNavigation() {
  const [active, setActive] = useState("home");

  return (
    <nav className="grid grid-cols-6 gap-1 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm" aria-label="主导航">
      {ITEMS.map(({ key, label, href, Icon }) => {
        const isActive = active === key;
        return (
          <a
            key={key}
            href={href}
            onClick={() => setActive(key)}
            className="flex flex-col items-center gap-1 rounded-lg py-1 transition-transform active:scale-95"
            aria-label={label}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-50 text-neutral-500"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            </span>
            <span className={`text-[11px] ${isActive ? "font-semibold text-neutral-900" : "font-medium text-neutral-500"}`}>
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
