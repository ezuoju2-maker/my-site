const ALLOWED_ORIGINS = new Set([
  "https://ezuoju2-maker.github.io",
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
