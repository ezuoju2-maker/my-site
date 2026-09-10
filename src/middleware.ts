import { defineMiddleware } from "astro:middleware";
import { getSession } from "./lib/auth";

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

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin")
  );
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 服务端权限检查
  // - 仅 SSR 模式生效（GitHub Pages 是纯静态，跳过）
  // - API 路径由各 handler 自己处理
  if (
    import.meta.env.GITHUB_PAGES !== "true" &&
    isProtectedPath(pathname) &&
    !isApiPath(pathname)
  ) {
    try {
      const session = await getSession(context.request);

      if (!session) {
        return context.redirect("/");
      }

      // 非 admin 访问 /admin/* 返回 404，不暴露后台存在
      if (pathname.startsWith("/admin") && session.role !== "admin") {
        return new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    } catch (error) {
      console.error("[middleware] auth check failed", error);
      return context.redirect("/");
    }
  }

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
