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
      `SELECT g.id AS grant_id, g.status AS grant_status, g.expires_at AS grant_expires,
              a.id AS account_id, a.platform_code, a.nickname, a.external_id, a.status AS account_status, a.expires_at AS account_expires
       FROM grab_grants g
       JOIN grab_accounts a ON a.id = g.account_id
       WHERE g.user_id = ?1
       ORDER BY g.created_at DESC
       LIMIT 100`
    ).bind(auth.session.userId).all<{
      grant_id: string;
      grant_status: string;
      grant_expires: string;
      account_id: string;
      platform_code: string;
      nickname: string | null;
      external_id: string;
      account_status: string;
      account_expires: string;
    }>();

    const rows = (result.results ?? []).map((r) => ({
      grantId: r.grant_id,
      grantStatus: r.grant_status,
      grantExpiresAt: r.grant_expires,
      accountId: r.account_id,
      platform: r.platform_code,
      nickname: r.nickname,
      externalId: r.external_id,
      accountStatus: r.account_status,
      accountExpiresAt: r.account_expires,
    }));

    return new Response(JSON.stringify({ ok: true, accounts: rows }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (e) {
    console.error("grab me accounts error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }
};
