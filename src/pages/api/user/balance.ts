import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const user = await env.DB.prepare(
      "SELECT balance FROM users WHERE id = ?1 LIMIT 1"
    )
      .bind(auth.session.userId)
      .first<{ balance: number | null }>();

    const balance = typeof user?.balance === "number" ? user.balance : 0;

    return new Response(
      JSON.stringify({
        ok: true,
        balance: Math.round(balance * 1000) / 1000,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      },
    );
  } catch (e) {
    console.error("balance query error", e);
    return new Response(
      JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...(origin ? corsHeaders(origin) : {}),
        },
      },
    );
  }
};
