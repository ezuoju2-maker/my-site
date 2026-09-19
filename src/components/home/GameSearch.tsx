import { Search } from "lucide-react";
import { useState } from "react";

export default function GameSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(q.trim());
  }

  return (
    <form
      onSubmit={submit}
      className="h-card h-card-lg flex items-center gap-2"
      style={{ padding: "8px 8px 8px 18px", height: 60 }}
    >
      <Search size={18} strokeWidth={2} className="shrink-0 text-neutral-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); onSearch(e.target.value.trim()); }}
        placeholder="搜索游戏 / 输入关键词"
        aria-label="搜索游戏"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        className="h-tap h-[44px] shrink-0 rounded-full bg-neutral-900 px-5 text-[13px] font-bold text-white"
      >
        搜索
      </button>
    </form>
  );
}
