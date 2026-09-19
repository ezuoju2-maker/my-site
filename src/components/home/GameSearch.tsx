import { useState } from "react";
import { Search } from "lucide-react";

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
    <form
      className="flex h-14 items-center gap-2 rounded-2xl border border-neutral-100 bg-white pl-4 pr-1.5 shadow-sm"
      onSubmit={handleSubmit}
      role="search"
    >
      <Search size={18} strokeWidth={2} className="shrink-0 text-neutral-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索游戏 / 输入关键词"
        aria-label="搜索游戏"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white transition-transform active:scale-95"
      >
        搜索
      </button>
    </form>
  );
}
