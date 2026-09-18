import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import TopBar from "./welcome/TopBar";
import UserCard from "./welcome/UserCard";
import Banner from "./welcome/Banner";
import Notice from "./welcome/Notice";
import QuickNav from "./welcome/QuickNav";
import SearchBar from "./welcome/SearchBar";
import Sidebar, { type CatKey } from "./welcome/Sidebar";
import GameGrid from "./welcome/GameGrid";

type UserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt?: string;
};

export default function WelcomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok">("loading");
  const [cat, setCat] = useState<CatKey>("hot");

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
        setUser(data.user as UserInfo);
        setStatus("ok");
      } catch {
        if (!cancelled) window.location.replace(getBase());
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (status === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-4 text-sm text-neutral-500">正在加载…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      <TopBar />

      <div className="mx-auto max-w-2xl space-y-3 px-4">
        <UserCard user={user} />
        <Banner />
        <Notice />
        <QuickNav />
        <SearchBar />

        {/* 两栏：侧栏 + 游戏网格 */}
        <div className="grid grid-cols-[80px_1fr] gap-2.5 pb-4">
          <Sidebar active={cat} onChange={setCat} />
          <GameGrid />
        </div>
      </div>
    </main>
  );
}
