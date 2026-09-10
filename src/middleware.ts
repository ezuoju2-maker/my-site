import { defineMiddleware } from "astro:middleware";

/**
 * 本 middleware 只负责添加安全响应头。
 *
 * 关于权限校验：
 * - 服务端 middleware 无法在 Cloudflare Pages 运行时读取 KV/D1（绑定在 my-site Worker 上）
 * - GitHub Pages 也是纯静态，同样无法读 session
 * - 因此会话和角色校验由前端 React 组件通过 /api/auth/me 完成
 *   （该 API 经 Service Binding 转发到 my-site Worker，Worker 有 KV/D1 绑定）
 * - /dashboard/* 和 /admin/* 页面本身只是占位 UI，无敏感数据；
 *   所有真实数据/操作都通过 /api/* 获取，API 端有完整鉴权
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy-Report-Only": [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://my-site-n7j.pages.dev https://cap-worker.ezuoju2.workers.dev",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; "),
};

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
