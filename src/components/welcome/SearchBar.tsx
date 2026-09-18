import { IcoSearch } from "./icons";

export default function SearchBar() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-neutral-100">
      <IcoSearch />
      <input
        type="text"
        placeholder="搜索游戏 / 输入关键词"
        className="h-7 w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-neutral-400"
      />
      <button type="button" className="shrink-0 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-950 px-4 py-1.5 text-[12px] font-bold text-white shadow-sm">
        搜索
      </button>
    </div>
  );
}
