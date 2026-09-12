import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
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
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await env.DB.prepare(
      `SELECT g.id AS grant_id, g.status AS grant_status, g.expires_at AS grant_expires_at,
              a.id AS account_id, a.platform_code, a.nickname, a.external_id,
              a.authorization_code, a.status AS account_status, a.expires_at AS account_expires_at,
              p.name AS platform_name, p.brand AS platform_brand
       FROM grab_grants g
       JOIN grab_accounts a ON a.id = g.account_id
       LEFT JOIN grab_platforms p ON p.code = a.platform_code
       WHERE g.user_id = ?1 AND g.status = 'active' AND a.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM grab_bindings b
           WHERE b.user_id = g.user_id AND b.account_id = g.account_id AND b.status = 'active'
         )
       ORDER BY g.created_at DESC
       LIMIT 100`
    ).bind(auth.session.userId).all<any>();

    const items = (result.results ?? []).map((r) => ({
      accountId: r.account_id,
      platform: r.platform_code,
      platformName: r.platform_name || r.platform_code,
      platformBrand: r.platform_brand || "737373",
      nickname: r.nickname,
      externalId: r.external_id,
      authorizationCode: r.authorization_code,
      accountStatus: r.account_status,
      accountExpiresAt: r.account_expires_at,
      grantExpiresAt: r.grant_expires_at,
    }));

    return new Response(JSON.stringify({ ok: true, accounts: items }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (e) {
    console.error("grab available error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }
};
