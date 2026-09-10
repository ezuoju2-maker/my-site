import { useState } from "react";
import LanguagePicker from "./LanguagePicker";
import { DEFAULT_LANG, getLanguage } from "./languages";
import { setLanguage, useTranslation } from "../i18n/useTranslation";

export default function GlobalLangSwitcher() {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex items-center gap-1 rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-sm text-neutral-700 shadow-sm backdrop-blur"
        aria-label="Change language"
      >
        🌐 {getLanguage(lang || DEFAULT_LANG).native}
      </button>

      <LanguagePicker
        open={open}
        current={lang || DEFAULT_LANG}
        onClose={() => setOpen(false)}
        onSelect={(code) => setLanguage(code)}
      />
    </>
  );
}
