import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../lib/permissions";
import { corsHeaders, getAllowedOrigin } from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await env.DB.prepare(
      "SELECT code, name FROM grab_platforms WHERE enabled = 1 ORDER BY created_at ASC"
    ).all<{ code: string; name: string }>();

    return new Response(JSON.stringify({
      ok: true,
      platforms: (result.results ?? []).map((r) => ({ code: r.code, name: r.name })),
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (e) {
    console.error("grab platforms error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }
};
