export type TabKey = "home" | "orders" | "support" | "me";

export type IconName =
  | "smartphone"
  | "send"
  | "crosshair"
  | "monitor"
  | "ticket";

export type Feature = {
  icon: IconName;
  title: string;
  subtitle: string;
  subtitleIcon: "globe" | "zap" | "shield" | "gem";
};

export const SITE_NAME = "网站名称";
export const ANNOUNCEMENT = "欢迎使用本平台，更多精彩功能持续更新中…";

export const FEATURES: Feature[] = [
  {
    icon: "smartphone",
    title: "接码系统",
    subtitle: "全球接码 · 全平台接码",
    subtitleIcon: "globe",
  },
  {
    icon: "send",
    title: "发码系统",
    subtitle: "快速发码 · 稳定高效",
    subtitleIcon: "zap",
  },
  {
    icon: "crosshair",
    title: "抓号系统",
    subtitle: "精准抓号 · 操作简单",
    subtitleIcon: "shield",
  },
  {
    icon: "monitor",
    title: "上号系统",
    subtitle: "安全上号 · 多平台支持",
    subtitleIcon: "shield",
  },
  {
    icon: "ticket",
    title: "卡券系统",
    subtitle: "多种卡券 · 优惠多多",
    subtitleIcon: "gem",
  },
];

export const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "首页" },
  { key: "orders", label: "订单" },
  { key: "support", label: "客服" },
  { key: "me", label: "我的" },
];
