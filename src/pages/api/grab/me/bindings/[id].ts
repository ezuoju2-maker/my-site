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
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

export const GET: APIRoute = async ({ request, params }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return json({ ok: false, error: "INVALID_ID" }, 400, origin);

  try {
    const row = await env.DB.prepare(
      `SELECT b.id, b.account_id, b.display_name, b.note, b.status,
              b.last_detected_at, b.last_online_status, b.last_account_status,
              b.created_at, b.updated_at,
              a.platform_code, a.nickname, a.external_id, a.authorization_code,
              a.expires_at AS account_expires_at,
              p.name AS platform_name, p.brand AS platform_brand
       FROM grab_bindings b
       LEFT JOIN grab_accounts a ON a.id = b.account_id
       LEFT JOIN grab_platforms p ON p.code = a.platform_code
       WHERE b.id = ?1 AND b.user_id = ?2 AND b.status = 'active'
       LIMIT 1`
    ).bind(id, auth.session.userId).first<any>();

    if (!row) return json({ ok: false, error: "NOT_FOUND" }, 404, origin);

    return json({
      ok: true,
      binding: {
        id: row.id,
        accountId: row.account_id,
        displayName: row.display_name || row.nickname || row.external_id,
        note: row.note || "",
        status: row.status,
        lastDetectedAt: row.last_detected_at,
        lastOnlineStatus: row.last_online_status || "unknown",
        lastAccountStatus: row.last_account_status || "unknown",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        platform: row.platform_code,
        platformName: row.platform_name || row.platform_code,
        platformBrand: row.platform_brand || "737373",
        nickname: row.nickname,
        externalId: row.external_id,
        authorizationCode: row.authorization_code,
        accountExpiresAt: row.account_expires_at,
      },
    }, 200, origin);
  } catch (e) {
    console.error("binding get error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return json({ ok: false, error: "INVALID_ID" }, 400, origin);

  let body: { displayName?: unknown; note?: unknown };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 60) || null : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) || null : null;

  try {
    const exists = await env.DB.prepare(
      "SELECT id FROM grab_bindings WHERE id = ?1 AND user_id = ?2 AND status = 'active' LIMIT 1"
    ).bind(id, auth.session.userId).first<{ id: string }>();

    if (!exists) return json({ ok: false, error: "NOT_FOUND" }, 404, origin);

    await env.DB.prepare(
      "UPDATE grab_bindings SET display_name = ?1, note = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3"
    ).bind(displayName, note, id).run();

    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error("binding patch error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return json({ ok: false, error: "INVALID_ID" }, 400, origin);

  try {
    const result = await env.DB.prepare(
      "UPDATE grab_bindings SET status = 'removed', updated_at = CURRENT_TIMESTAMP WHERE id = ?1 AND user_id = ?2"
    ).bind(id, auth.session.userId).run();

    if (!result.success) throw new Error("delete failed");

    return json({ ok: true }, 200, origin);
  } catch (e) {
    console.error("binding delete error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
