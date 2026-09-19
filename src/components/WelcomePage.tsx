import "./home/home.css";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import Header from "./home/Header";
import UserCard from "./home/UserCard";
import HeroBanner from "./home/HeroBanner";
import Announcement from "./home/Announcement";
import BottomNavigation from "./home/BottomNavigation";
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
      <main className="h-shell">
        <div className="h-container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#a3a5aa" }}>加载中…</p>
        </div>
      </main>
    );
  }

  if (status === "error" || !user) {
    return (
      <main className="h-shell">
        <div className="h-container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#a3a5aa" }}>加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: 999,
              background: "#171717",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              border: 0,
            }}
          >
            重新加载
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-shell">
      <Header />
      <div
        className="h-container"
        style={{
          paddingTop: 4,
          paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <UserCard user={user} />
        <HeroBanner />
        <Announcement />
        <BottomNavigation />
        <GameSearch onSearch={setQuery} />
        <GameSection games={MOCK_GAMES} query={query} />
      </div>
    </main>
  );
}
