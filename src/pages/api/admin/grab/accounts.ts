import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireRole } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const result = await env.DB.prepare(
      `SELECT id, platform_code, nickname, external_id, authorization_code, status, max_users, created_at, expires_at
       FROM grab_accounts
       ORDER BY created_at DESC
       LIMIT 200`
    ).all<{
      id: string;
      platform_code: string;
      nickname: string | null;
      external_id: string;
      authorization_code: string;
      status: string;
      max_users: number;
      created_at: string;
      expires_at: string;
    }>();

    const accounts = (result.results ?? []).map((r) => ({
      id: r.id,
      platform: r.platform_code,
      nickname: r.nickname,
      externalId: r.external_id,
      authorizationCode: r.authorization_code,
      status: r.status,
      maxUsers: r.max_users,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    }));

    return new Response(JSON.stringify({ ok: true, accounts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (e) {
    console.error("admin grab accounts error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }
};
