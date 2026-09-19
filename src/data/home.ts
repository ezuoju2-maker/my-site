import type { Game, Category, Banner } from "../types/home";

export const MOCK_GAMES: Game[] = [
  { id: "go", name: "GO 棋牌", category: "cards", image: "/images/games/go.webp", hot: true, recommended: false },
  { id: "wg", name: "WG 棋牌", category: "cards", image: "/images/games/wg.webp", hot: false, recommended: true },
  { id: "ky", name: "KY 棋牌", category: "cards", image: "/images/games/ky.webp", hot: true, recommended: false },
  { id: "leg", name: "LEG 棋牌", category: "cards", image: "/images/games/leg.webp", hot: false, recommended: true },
  { id: "baisheng", name: "百胜棋牌", category: "cards", image: "/images/games/baisheng.webp", hot: true, recommended: false },
  { id: "wl", name: "WL 棋牌", category: "cards", image: "/images/games/wl.webp", hot: false, recommended: true },
];

export const CATEGORIES: Category[] = [
  { id: "hot", name: "热门", iconKey: "flame" },
  { id: "games", name: "游戏", iconKey: "gamepad" },
  { id: "sports", name: "体育", iconKey: "target" },
  { id: "cards", name: "棋牌", iconKey: "cards" },
  { id: "fishing", name: "捕鱼", iconKey: "fish" },
  { id: "electronic", name: "电子", iconKey: "device" },
];

export const MOCK_BANNERS: Banner[] = [
  { id: "b1", title: "顶级游戏体验", subtitle: "安全 · 稳定 · 专业 · 贴心", image: "/images/banner-1.webp", dark: true },
  { id: "b2", title: "新人专享礼包", subtitle: "注册即送，福利多多", image: "/images/banner-2.webp", dark: true },
  { id: "b3", title: "每日签到奖励", subtitle: "天天签到，天天领取", image: "/images/banner-3.webp", dark: true },
];
