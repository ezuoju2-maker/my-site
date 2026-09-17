import { useEffect } from "react";
import { API_BASE_URL } from "../lib/api";
import { parseApiResponse } from "../lib/api-response";
import { withBase } from "../lib/url";

/**
 * 登录页加载时执行：
 * - 调用 /api/auth/me
 * - 已登录（含 device_token 自动续期）→ 跳 /welcome/
 * - 未登录 → 什么都不做（停在登录页）
 */
export default function AutoLoginRedirect() {
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (cancelled) return;

        if (!response.ok) {
          // 未登录：什么都不做
          return;
        }

        const data = await parseApiResponse(response);
        if (cancelled) return;

        if (data.ok && data.user) {
          window.location.replace(withBase("welcome/"));
        }
      } catch {
        // 网络错误：忽略，停在登录页
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
