const PROD_ORIGINS = [
  "https://ezuoju2-maker.github.io",
  "https://my-site-n7j.pages.dev",
];

const DEV_ORIGINS = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

const ALLOWED_ORIGINS = new Set([
  ...PROD_ORIGINS,
  ...(import.meta.env.DEV ? DEV_ORIGINS : []),
]);

export function getAllowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return null;
  }

  return origin;
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export function rejectCrossSiteRequest(request: Request) {
  const method = request.method.toUpperCase();

  // 读操作不要求 Origin：
  // - 同源 GET/HEAD 浏览器通常不带 Origin（规范行为）
  // - OPTIONS 是 CORS 预检，由各 API 的 OPTIONS handler 单独处理
  // - CSRF 只对写操作有意义（POST/PUT/PATCH/DELETE）
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = getAllowedOrigin(request);

  if (!origin) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "FORBIDDEN_ORIGIN",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return null;
}
