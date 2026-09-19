import { useState } from "react";
import { Home, Gift, Bell, Headphones, LayoutGrid, UserRound } from "lucide-react";
import "./MainNavigation.css";

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
  { key: "me", label: "我的", href: "/profile", Icon: UserRound },
];

export default function MainNavigation() {
  const [active, setActive] = useState("home");

  return (
    <nav className="q8-nav" aria-label="主导航">
      {ITEMS.map(({ key, label, href, Icon }) => {
        const isActive = active === key;
        return (
          <a
            key={key}
            href={href}
            onClick={() => setActive(key)}
            className={`q8-nav-item ${isActive ? "active" : ""}`}
            aria-label={label}
          >
            <span className="q8-nav-icon">
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.9} />
            </span>
            <span className="q8-nav-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
