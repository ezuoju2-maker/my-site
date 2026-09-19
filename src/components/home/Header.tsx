import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("中文");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("q8_lang") : null;
    if (saved) setLang(saved);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  function choose(l: string) {
    setLang(l);
    try { localStorage.setItem("q8_lang", l); } catch {}
    setOpen(false);
  }

  return (
    <header className="mx-auto flex max-w-[820px] items-center justify-between gap-3 px-4 pt-4 pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900">
          <img src="/q8-logo.png" alt="Q8" className="h-6 w-6 object-contain invert" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[17px] font-semibold tracking-tight text-neutral-900">Q8Top</div>
          <div className="truncate text-[11px] text-neutral-400">www.q8top.cc</div>
        </div>
      </div>

      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="切换语言"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 active:scale-95"
        >
          <Globe size={14} strokeWidth={2} />
          <span>{lang}</span>
          <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-xl border border-neutral-100 bg-white py-1 shadow-lg">
            {["中文", "English"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => choose(l)}
                className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-neutral-50 ${lang === l ? "font-semibold text-neutral-900" : "text-neutral-600"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
