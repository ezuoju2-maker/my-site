import { useState } from "react";
import { Search } from "lucide-react";
import "./GameSearch.css";

export default function GameSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");

  function handleChange(v: string) {
    setQ(v);
    onSearch(v.trim());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(q.trim());
  }

  return (
    <form className="q8-search" onSubmit={handleSubmit} role="search">
      <Search size={20} strokeWidth={2} className="q8-search-icon" />
      <input
        type="search"
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索游戏 / 输入关键词"
        aria-label="搜索游戏"
        className="q8-search-input"
      />
      <button type="submit" className="q8-search-btn">搜索</button>
    </form>
  );
}
