import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";

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
    const result = await env.DB.prepare(
      `SELECT q.id, q.platform_code, q.status, q.created_at, q.consumed_at,
              p.name AS platform_name, p.brand AS platform_brand, p.price AS platform_price,
              a.nickname AS account_nickname, a.external_id AS account_external_id,
              a.authorization_code AS account_auth_code, a.device_id AS account_device_id,
              a.expires_at AS account_expires_at
       FROM grab_qr_sessions q
       LEFT JOIN grab_platforms p ON p.code = q.platform_code
       LEFT JOIN grab_accounts a ON a.id = q.result_account_id
       WHERE q.created_by = ?1
       ORDER BY q.created_at DESC
       LIMIT 100`
    )
      .bind(auth.session.userId)
      .all<{
        id: string;
        platform_code: string;
        status: string;
        created_at: string;
        consumed_at: string | null;
        platform_name: string | null;
        platform_brand: string | null;
        platform_price: number | null;
        account_nickname: string | null;
        account_external_id: string | null;
        account_auth_code: string | null;
        account_device_id: string | null;
        account_expires_at: string | null;
      }>();

    const orders = (result.results ?? []).map((r) => {
      // 状态映射
      let statusLabel = "待扫码";
      let statusTone = "waiting";
      if (r.status === "consumed") {
        statusLabel = "已授权";
        statusTone = "success";
      } else if (r.status === "expired") {
        statusLabel = "已过期";
        statusTone = "expired";
      }

      return {
        id: r.id,
        platform: r.platform_code,
        platformName: r.platform_name || r.platform_code,
        platformBrand: r.platform_brand || "737373",
        price: r.platform_price ?? 0,
        status: r.status,
        statusLabel,
        statusTone,
        createdAt: r.created_at,
        consumedAt: r.consumed_at,
        account: r.account_external_id
          ? {
              nickname: r.account_nickname,
              externalId: r.account_external_id,
              authorizationCode: r.account_auth_code,
              deviceId: r.account_device_id,
              expiresAt: r.account_expires_at,
            }
          : null,
      };
    });

    return new Response(JSON.stringify({ ok: true, orders }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (e) {
    console.error("grab orders error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  }
};
