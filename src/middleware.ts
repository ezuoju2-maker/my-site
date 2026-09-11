import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

/**
 * 安全响应头 + CSP nonce 注入。
 *
 * CSP_MODE 开关（wrangler.toml [vars]）：
 *   - "report-only"（默认）：只上报违规，不阻断
 *   - "enforce"：真正阻断
 *
 * 流程：
 * 1. 生成 per-request nonce
 * 2. next() 拿到响应
 * 3. 若 HTML：HTMLRewriter 给所有 <script> 加 nonce
 * 4. 设置 CSP header（含 nonce，不含 unsafe-inline）
 * 5. Cache-Control: private, no-store（防 nonce 跨用户/跨请求共享）
 */

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function buildCsp(nonce: string | null): string {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline'";

  const styleSrc = nonce
    ? `'self' 'nonce-${nonce}' 'unsafe-inline'`
    : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    `style-src ${styleSrc}`,
    `script-src ${scriptSrc}`,
    "connect-src 'self' https://my-site-n7j.pages.dev",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function getCspHeaderName(): string {
  const mode = (env as any).CSP_MODE as string | undefined;
  return mode === "enforce"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

function hasHTMLRewriter(): boolean {
  return typeof (globalThis as any).HTMLRewriter !== "undefined";
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const cspHeaderName = getCspHeaderName();
  const contentType = headers.get("content-type") ?? "";

  // 非 HTML：不注入 nonce，直接加 CSP
  if (!contentType.includes("text/html")) {
    headers.set(cspHeaderName, buildCsp(null));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // HTML 但无 HTMLRewriter（本地 dev）：回退到 unsafe-inline
  if (!hasHTMLRewriter()) {
    headers.set(cspHeaderName, buildCsp(null));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // 生产：注入 nonce
  const nonce = generateNonce();

  const rewritten = new HTMLRewriter()
    .on("script", {
      element(el) {
        el.setAttribute("nonce", nonce);
      },
    })
    .transform(response);

  const newHeaders = new Headers(rewritten.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }
  newHeaders.set(cspHeaderName, buildCsp(nonce));
  // 关键：nonce 是 per-request，绝不能被任何缓存共享
  newHeaders.set("Cache-Control", "private, no-store");

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers: newHeaders,
  });
});
