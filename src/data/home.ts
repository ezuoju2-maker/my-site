import type { Game, Category } from "../types/home";

export const CATEGORIES: Category[] = [
  { id: "hot", name: "热门", iconKey: "flame" },
  { id: "games", name: "游戏", iconKey: "gamepad" },
  { id: "sports", name: "体育", iconKey: "target" },
  { id: "cards", name: "棋牌", iconKey: "cards" },
  { id: "fishing", name: "捕鱼", iconKey: "fish" },
  { id: "electronic", name: "电子", iconKey: "device" },
];

export const MOCK_GAMES: Game[] = [
  { id: "go", name: "GO 棋牌", category: "cards", badge: "HOT" },
  { id: "wg", name: "WG 棋牌", category: "cards", badge: "推荐" },
  { id: "ky", name: "KY 棋牌", category: "cards", badge: "HOT" },
  { id: "leg", name: "LEG 棋牌", category: "cards", badge: "推荐" },
  { id: "baisheng", name: "百胜棋牌", category: "cards", badge: "HOT" },
  { id: "wl", name: "WL 棋牌", category: "cards", badge: "推荐" },
];
