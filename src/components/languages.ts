/**
 * 全球使用率排名前 20 的语言（按 Ethnologue 总使用人数）。
 * 显示用 native 名（母语名），并附中文名供搜索/辅助。
 */

export type Language = {
  code: string;
  native: string;
  zh: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", native: "English", zh: "英语" },
  { code: "zh", native: "中文", zh: "中文" },
  { code: "hi", native: "हिन्दी", zh: "印地语" },
  { code: "es", native: "Español", zh: "西班牙语" },
  { code: "ar", native: "العربية", zh: "阿拉伯语" },
  { code: "fr", native: "Français", zh: "法语" },
  { code: "bn", native: "বাংলা", zh: "孟加拉语" },
  { code: "pt", native: "Português", zh: "葡萄牙语" },
  { code: "ru", native: "Русский", zh: "俄语" },
  { code: "ur", native: "اردو", zh: "乌尔都语" },
  { code: "id", native: "Bahasa Indonesia", zh: "印度尼西亚语" },
  { code: "de", native: "Deutsch", zh: "德语" },
  { code: "ja", native: "日本語", zh: "日语" },
  { code: "mr", native: "मराठी", zh: "马拉地语" },
  { code: "te", native: "తెలుగు", zh: "泰卢固语" },
  { code: "tr", native: "Türkçe", zh: "土耳其语" },
  { code: "ta", native: "தமிழ்", zh: "泰米尔语" },
  { code: "yue", native: "粵語", zh: "粤语" },
  { code: "vi", native: "Tiếng Việt", zh: "越南语" },
  { code: "ko", native: "한국어", zh: "韩语" },
];

export const DEFAULT_LANG = "zh";

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[1];
}
