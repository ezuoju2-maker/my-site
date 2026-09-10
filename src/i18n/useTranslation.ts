import { useCallback, useEffect, useState } from "react";
import { translations } from "./translations";
import { DEFAULT_LANG } from "../components/languages";

const STORAGE_KEY = "lang";
const EVENT_NAME = "lang-change";

/**
 * 读取当前语言（从 localStorage，回退到默认）。
 */
function readLang(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * 写入当前语言，并广播变更事件，让所有 useTranslation 实例同步。
 */
export function setLanguage(code: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage 不可用
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

/**
 * React Hook：获取翻译函数 t 和当前语言。
 *
 * - 自动监听语言变更，切换后所有使用 t 的组件都会重新渲染
 * - 缺失的翻译键回退链：current → en → key 本身
 */
export function useTranslation() {
  const [lang, setLang] = useState(DEFAULT_LANG);

  useEffect(() => {
    setLang(readLang());

    const handler = () => setLang(readLang());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const current = translations[lang];
      if (current && key in current) return current[key];

      const fallback = translations.en;
      if (fallback && key in fallback) return fallback[key];

      return key;
    },
    [lang],
  );

  return { t, lang };
}
