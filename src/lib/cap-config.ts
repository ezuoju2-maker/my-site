import { API_BASE_URL } from "./api";

// BASE_URL 在 GitHub Pages 下是 "/my-site"（无尾斜杠），
// 在 Cloudflare Pages 下是 "/"，需要统一成带尾斜杠的路径。
const rawBase = import.meta.env.BASE_URL || "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

// Cap 脚本走同源（GitHub Pages 或 Cloudflare Pages）
export const CAP_SCRIPT_URL = `${base}cap.min.js`;

// Cap API 走 my-site 后端代理（Service Binding → cap-worker）
// API_BASE_URL 在 GitHub Pages 下是 "https://my-site-n7j.pages.dev"，
// 在 Cloudflare Pages 下是空字符串（同源）
export const CAP_API_ENDPOINT = `${API_BASE_URL}/api/cap/`;
