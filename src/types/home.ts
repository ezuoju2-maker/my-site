export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  vipLevel: number;
  balance: number;
  role: string;
};

export type Game = {
  id: string;
  name: string;
  category: string;
  image: string;
  badge: "HOT" | "推荐" | null;
};

export type Category = {
  id: string;
  name: string;
  iconKey: "flame" | "gamepad" | "target" | "cards" | "fish" | "device";
};

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};
