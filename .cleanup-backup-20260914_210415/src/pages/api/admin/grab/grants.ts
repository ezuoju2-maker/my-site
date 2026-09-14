import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireRole } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireRole(request, "admin");
  if (!auth.ok) return auth.response;

  let body: { userId?: unknown; accountId?: unknown; days?: unknown };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const accountId = typeof body.accountId === "string" ? body.accountId : "";
  const days = typeof body.days === "number" && body.days > 0 && body.days <= 30 ? Math.floor(body.days) : 30;

  if (!userId || !accountId) return json({ ok: false, error: "MISSING_FIELDS" }, 400, origin);

  try {
    const account = await env.DB.prepare(
      "SELECT id, expires_at, status FROM grab_accounts WHERE id = ?1 LIMIT 1"
    ).bind(accountId).first<{ id: string; expires_at: string; status: string }>();
    if (!account) return json({ ok: false, error: "ACCOUNT_NOT_FOUND" }, 404, origin);
    if (account.status !== "active") return json({ ok: false, error: "ACCOUNT_NOT_ACTIVE" }, 403, origin);

    const grantExpires = Math.min(
      Date.now() + days * 86400000,
      new Date(account.expires_at).getTime()
    );

    const existing = await env.DB.prepare(
      "SELECT id FROM grab_grants WHERE user_id = ?1 AND account_id = ?2 LIMIT 1"
    ).bind(userId, accountId).first<{ id: string }>();

    if (existing) {
      await env.DB.prepare(
        "UPDATE grab_grants SET status='active', expires_at=?1 WHERE id=?2"
      ).bind(new Date(grantExpires).toISOString(), existing.id).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO grab_grants (id, user_id, account_id, status, expires_at) VALUES (?1, ?2, ?3, 'active', ?4)"
      ).bind(crypto.randomUUID(), userId, accountId, new Date(grantExpires).toISOString()).run();
    }

    await env.DB.prepare(
      "INSERT INTO grab_audit_logs (id, actor_id, action, target_id, details) VALUES (?1, ?2, 'ADMIN_GRANT', ?3, ?4)"
    ).bind(crypto.randomUUID(), auth.session.userId, accountId, JSON.stringify({ userId, days })).run();

    return json({ ok: true, expiresAt: new Date(grantExpires).toISOString() }, 200, origin);
  } catch (e) {
    console.error("admin grant error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
