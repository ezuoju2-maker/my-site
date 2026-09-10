import { API_BASE_URL } from "./api";

// Cap 脚本走同源（my-site-n7j.pages.dev 或 GitHub Pages）
export const CAP_SCRIPT_URL = `${import.meta.env.BASE_URL}cap.min.js`;

// Cap API 走 my-site 后端代理（Service Binding → cap-worker）
export const CAP_API_ENDPOINT = `${API_BASE_URL}/api/cap/`;
