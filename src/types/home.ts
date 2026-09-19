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
  hot: boolean;
  recommended: boolean;
};

export type Category = {
  id: string;
  name: string;
  iconKey: "flame" | "gamepad" | "target" | "cards" | "fish" | "device";
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  dark: boolean;
};
