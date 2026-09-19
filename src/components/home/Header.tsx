import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("中文");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("q8_lang") : null;
    if (saved) setLang(saved);
  }, []);

  function choose(l: string) {
    setLang(l);
    try { window.localStorage.setItem("q8_lang", l); } catch {}
    setOpen(false);
  }

  return (
    <header className="h-container" style={{ paddingTop: 18, paddingBottom: 6 }}>
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.35)]">
            <img src="/q8-logo.png" alt="Q8" className="h-7 w-7 object-contain" style={{ filter: "invert(1)" }} />
          </div>
          <div className="leading-tight">
            <div className="text-[20px] font-black tracking-tight text-neutral-900">Q8Top</div>
            <div className="text-[12px] text-[#8c8c8c]">www.q8top.cc</div>
          </div>
        </div>

        {/* 语言选择 */}
        <div className="relative">
          <button
            type="button"
            aria-label="切换语言"
            onClick={() => setOpen((v) => !v)}
            className="h-tap flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 shadow-sm"
          >
            <Globe size={15} strokeWidth={2} />
            {lang}
            <ChevronDown size={13} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-32 overflow-hidden rounded-2xl border border-neutral-100 bg-white py-1 shadow-lg">
              {["中文", "English"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => choose(l)}
                  className={`block w-full px-4 py-2 text-left text-[13px] transition-colors hover:bg-neutral-50 ${lang === l ? "font-semibold text-neutral-900" : "text-neutral-600"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
