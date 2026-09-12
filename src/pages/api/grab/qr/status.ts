import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";
import { hashToken } from "../../../../lib/grab/crypto";

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

  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token || token.length < 20) {
    return json({ ok: false, error: "INVALID_TOKEN" }, 400, origin);
  }

  try {
    const tokenHash = await hashToken(token);
    const qr = await env.DB.prepare(
      "SELECT id, platform_code, status, created_by, result_account_id, created_at, expires_at, consumed_at FROM grab_qr_sessions WHERE token_hash = ?1 LIMIT 1"
    ).bind(tokenHash).first<{
      id: string;
      platform_code: string;
      status: string;
      created_by: string | null;
      result_account_id: string | null;
      created_at: string;
      expires_at: string;
      consumed_at: string | null;
    }>();

    if (!qr) {
      return json({ ok: false, error: "QR_NOT_FOUND" }, 404, origin);
    }

    // 只有创建者本人或 admin 能查看
    if (qr.created_by !== auth.session.userId && auth.session.role !== "admin") {
      return json({ ok: false, error: "FORBIDDEN" }, 403, origin);
    }

    let account: { id: string; nickname: string | null; external_id: string; avatar: string | null; authorization_code: string; expires_at: string } | null = null;
    if (qr.result_account_id) {
      account = await env.DB.prepare(
        "SELECT id, nickname, external_id, avatar, authorization_code, expires_at FROM grab_accounts WHERE id = ?1 LIMIT 1"
      ).bind(qr.result_account_id).first();
    }

    return json({
      ok: true,
      qr: {
        id: qr.id,
        platform: qr.platform_code,
        status: qr.status,
        createdAt: qr.created_at,
        expiresAt: qr.expires_at,
        consumedAt: qr.consumed_at,
      },
      account: account
        ? {
            id: account.id,
            nickname: account.nickname,
            externalId: account.external_id,
            avatar: account.avatar,
            authorizationCode: account.authorization_code,
            expiresAt: account.expires_at,
          }
        : null,
    }, 200, origin);
  } catch (e) {
    console.error("grab qr status error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
