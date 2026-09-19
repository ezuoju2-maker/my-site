import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import "./Header.css";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("中文");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("q8_lang") : null;
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
    try { window.localStorage.setItem("q8_lang", l); } catch {}
    setOpen(false);
  }

  return (
    <header className="q8-container q8-header">
      <div className="q8-header-brand">
        <div className="q8-logo-box">
          <img src="/q8-logo.png" alt="Q8" />
        </div>
        <div className="q8-brand-text">
          <div className="q8-brand-name">Q8Top</div>
          <div className="q8-brand-url">www.q8top.cc</div>
        </div>
      </div>

      <div className="q8-lang-wrap" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="切换语言"
          className={`q8-lang-btn q8-tap ${open ? "open" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <Globe size={16} strokeWidth={2} />
          <span>{lang}</span>
          <ChevronDown size={14} strokeWidth={2.5} className="q8-lang-chev" />
        </button>

        {open && (
          <div className="q8-lang-menu">
            {["中文", "English"].map((l) => (
              <button
                key={l}
                type="button"
                className={`q8-lang-item ${lang === l ? "active" : ""}`}
                onClick={() => choose(l)}
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
