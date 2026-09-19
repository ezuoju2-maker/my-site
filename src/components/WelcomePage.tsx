import "../styles/globals.css";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { getBase } from "../lib/url";
import Header from "./Header/Header";
import UserCard from "./UserCard/UserCard";
import HeroBanner from "./HeroBanner/HeroBanner";
import Announcement from "./Announcement/Announcement";
import MainNavigation from "./MainNavigation/MainNavigation";
import GameSearch from "./GameSearch/GameSearch";
import GameSection from "./GameSection/GameSection";
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
      <main className="q8-page">
        <div className="q8-container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#a1a4aa" }}>加载中…</p>
        </div>
      </main>
    );
  }

  if (status === "error" || !user) {
    return (
      <main className="q8-page">
        <div className="q8-container" style={{ paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#a1a4aa" }}>加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16, padding: "8px 20px", borderRadius: 999,
              background: "#171717", color: "#fff", fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer",
            }}
          >
            重新加载
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="q8-page">
      <Header />
      <div className="q8-container">
        <div className="q8-stack">
          <UserCard user={user} />
          <HeroBanner />
          <Announcement />
          <MainNavigation />
          <GameSearch onSearch={setQuery} />
          <GameSection games={MOCK_GAMES} query={query} />
        </div>
      </div>
    </main>
  );
}
