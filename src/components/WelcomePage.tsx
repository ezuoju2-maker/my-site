import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import Header from "./home/Header";
import UserCard from "./home/UserCard";
import HeroBanner from "./home/HeroBanner";
import Announcement from "./home/Announcement";
import MainNavigation from "./home/MainNavigation";
import GameSearch from "./home/GameSearch";
import GameSection from "./home/GameSection";
import { MOCK_GAMES } from "../data/home";
import type { User } from "../types/home";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
};

export default function WelcomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) { window.location.replace(getBase()); return; }
        const data = await parseApiResponse(res);
        if (cancelled) return;
        if (!data.ok || !data.user) { window.location.replace(getBase()); return; }
        const u = data.user as ApiUser;
        setUser({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatar: u.avatarUrl || undefined,
          vipLevel: 1,
          balance: 0,
          role: u.role,
        });
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-neutral-50">
        <p className="text-[13px] text-neutral-400">加载中…</p>
      </main>
    );
  }

  if (status === "error" || !user) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-neutral-50">
        <p className="text-[13px] text-neutral-400">加载失败，请稍后重试</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-semibold text-white"
        >
          重新加载
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-neutral-50 pb-8">
      <Header />
      <div className="mx-auto flex max-w-[820px] flex-col gap-3 px-4 pb-2">
        <UserCard user={user} />
        <HeroBanner />
        <Announcement />
        <MainNavigation />
        <GameSearch onSearch={setQuery} />
        <GameSection games={MOCK_GAMES} query={query} />
      </div>
    </main>
  );
}
