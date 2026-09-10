import { API_BASE_URL } from "./api";

/**
 * 获取规范化的站点根路径（带尾斜杠）。
 *
 * - GitHub Pages: "/my-site/" （BASE_URL = "/my-site" → 补尾斜杠）
 * - Cloudflare Pages: "/" （BASE_URL = "/" → 保持）
 * - 本地开发: "/" （BASE_URL 未定义 → 默认）
 */
export function getBase(): string {
  const raw = import.meta.env.BASE_URL || "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/**
 * 拼接站点内路径。
 *
 * @example
 *   withBase("register-success/")  // "/my-site/register-success/"
 *   withBase("/register-success/") // "/my-site/register-success/"
 *   withBase("")                   // "/my-site/"
 */
export function withBase(path: string): string {
  const base = getBase();
  const clean = path.replace(/^\/+/, "");
  return `${base}${clean}`;
}

/**
 * 拼接 API 路径（前端调用后端）。
 *
 * @example
 *   apiUrl("/api/auth/login")  // "https://my-site-n7j.pages.dev/api/auth/login"
 */
export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
