import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../../lib/cors";

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
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await env.DB.prepare(
      `SELECT b.id, b.account_id, b.display_name, b.note, b.status,
              b.last_detected_at, b.last_online_status, b.last_account_status,
              b.created_at, b.updated_at,
              a.platform_code, a.nickname, a.external_id, a.authorization_code, a.expires_at AS account_expires_at,
              p.name AS platform_name, p.brand AS platform_brand
       FROM grab_bindings b
       LEFT JOIN grab_accounts a ON a.id = b.account_id
       LEFT JOIN grab_platforms p ON p.code = a.platform_code
       WHERE b.user_id = ?1 AND b.status = 'active'
       ORDER BY b.created_at DESC
       LIMIT 100`
    ).bind(auth.session.userId).all<any>();

    const items = (result.results ?? []).map((r) => ({
      id: r.id,
      accountId: r.account_id,
      displayName: r.display_name || r.nickname || r.external_id,
      note: r.note || "",
      status: r.status,
      lastDetectedAt: r.last_detected_at,
      lastOnlineStatus: r.last_online_status || "unknown",
      lastAccountStatus: r.last_account_status || "unknown",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      platform: r.platform_code,
      platformName: r.platform_name || r.platform_code,
      platformBrand: r.platform_brand || "737373",
      nickname: r.nickname,
      externalId: r.external_id,
      authorizationCode: r.authorization_code,
      accountExpiresAt: r.account_expires_at,
    }));

    return json({ ok: true, bindings: items }, 200, origin);
  } catch (e) {
    console.error("grab bindings list error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { accountId?: unknown; displayName?: unknown; note?: unknown };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const accountId = typeof body.accountId === "string" ? body.accountId : "";
  if (!accountId) return json({ ok: false, error: "MISSING_ACCOUNT" }, 400, origin);

  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 60) : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : null;

  try {
    // 账号必须属于当前用户（通过 grab_grants 或 grab_accounts 的授权人）
    const account = await env.DB.prepare(
      `SELECT a.id FROM grab_accounts a
       WHERE a.id = ?1 AND a.status = 'active' LIMIT 1`
    ).bind(accountId).first<{ id: string }>();

    if (!account) return json({ ok: false, error: "ACCOUNT_NOT_FOUND" }, 404, origin);

    const grant = await env.DB.prepare(
      `SELECT id FROM grab_grants WHERE user_id = ?1 AND account_id = ?2 AND status = 'active' LIMIT 1`
    ).bind(auth.session.userId, accountId).first<{ id: string }>();

    if (!grant) return json({ ok: false, error: "NO_PERMISSION" }, 403, origin);

    const existing = await env.DB.prepare(
      `SELECT id FROM grab_bindings WHERE user_id = ?1 AND account_id = ?2 LIMIT 1`
    ).bind(auth.session.userId, accountId).first<{ id: string }>();

    const id = existing?.id || crypto.randomUUID();

    if (existing) {
      await env.DB.prepare(
        `UPDATE grab_bindings SET status='active', display_name=?1, note=?2, updated_at=CURRENT_TIMESTAMP WHERE id=?3`
      ).bind(displayName, note, id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO grab_bindings (id, user_id, account_id, display_name, note, status) VALUES (?1, ?2, ?3, ?4, ?5, 'active')`
      ).bind(id, auth.session.userId, accountId, displayName, note).run();
    }

    return json({ ok: true, id }, 200, origin);
  } catch (e) {
    console.error("grab bindings create error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
