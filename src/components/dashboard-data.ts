export type TabKey = "home" | "orders" | "support" | "me";

export type Feature = {
  emoji: string;
  title: string;
  subtitle: string;
};

export const SITE_NAME = "网站名称";
export const ANNOUNCEMENT = "欢迎使用本平台，更多精彩功能持续更新中…";

export const FEATURES: Feature[] = [
  { emoji: "📱", title: "接码系统", subtitle: "全球接码 · 全平台接码" },
  { emoji: "✈️", title: "发码系统", subtitle: "快速发码 · 稳定高效" },
  { emoji: "🎯", title: "抓号系统", subtitle: "精准抓号 · 操作简单" },
  { emoji: "💻", title: "上号系统", subtitle: "安全上号 · 多平台支持" },
  { emoji: "🎫", title: "卡券系统", subtitle: "多种卡券 · 优惠多多" },
];

export const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: "home", emoji: "🏠", label: "首页" },
  { key: "orders", emoji: "📋", label: "订单" },
  { key: "support", emoji: "🎧", label: "客服" },
  { key: "me", emoji: "👤", label: "我的" },
];
