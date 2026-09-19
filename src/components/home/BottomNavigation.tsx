import { Home, Gift, Bell, Headphones, LayoutGrid, User } from "lucide-react";
import { useState } from "react";

type Item = { key: string; label: string; href: string; Icon: typeof Home };

const ITEMS: Item[] = [
  { key: "home", label: "首页", href: "/welcome/", Icon: Home },
  { key: "promo", label: "优惠", href: "/promotions", Icon: Gift },
  { key: "notice", label: "通知", href: "/notifications", Icon: Bell },
  { key: "support", label: "客服", href: "/support", Icon: Headphones },
  { key: "other", label: "其他", href: "/other", Icon: LayoutGrid },
  { key: "me", label: "我的", href: "/profile", Icon: User },
];

export default function BottomNavigation() {
  const [active, setActive] = useState("home");

  return (
    <nav className="h-card h-card-lg grid grid-cols-6" style={{ padding: "12px 6px" }} aria-label="主导航">
      {ITEMS.map(({ key, label, href, Icon }) => {
        const isActive = active === key;
        return (
          <a
            key={key}
            href={href}
            onClick={() => setActive(key)}
            className="h-tap flex flex-col items-center justify-center gap-1.5 py-1"
            aria-label={label}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                isActive
                  ? "bg-gradient-to-br from-neutral-800 to-neutral-950 text-white shadow-[0_4px_12px_-3px_rgba(0,0,0,0.35)]"
                  : "bg-neutral-100 text-[#6f7075]"
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.9} />
            </span>
            <span className={`text-[11px] ${isActive ? "font-bold text-neutral-900" : "font-medium text-[#6f7075]"}`}>
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
