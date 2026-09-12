import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";
import { decryptCredential } from "../../../../lib/grab/crypto";

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

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!id || id.length < 8) {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }

  try {
    const row = await env.DB.prepare(
      `SELECT q.id, q.status, q.token_encrypted, q.expires_at,
              p.code AS platform_code, p.name AS platform_name, p.brand AS platform_brand
       FROM grab_qr_sessions q
       LEFT JOIN grab_platforms p ON p.code = q.platform_code
       WHERE q.id = ?1 AND q.created_by = ?2
       LIMIT 1`
    )
      .bind(id, auth.session.userId)
      .first<{
        id: string;
        status: string;
        token_encrypted: string | null;
        expires_at: string;
        platform_code: string | null;
        platform_name: string | null;
        platform_brand: string | null;
      }>();

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
      });
    }

    if (row.status !== "waiting") {
      return new Response(JSON.stringify({ ok: false, error: "NOT_WAITING", status: row.status }), {
        status: 410,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
      });
    }

    if (!row.token_encrypted) {
      return new Response(JSON.stringify({ ok: false, error: "TOKEN_MISSING" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
      });
    }

    const otpSecret = (env as any).OTP_SECRET as string | undefined;
    if (!otpSecret || !/^[0-9a-fA-F]{64}$/.test(otpSecret)) {
      return new Response(JSON.stringify({ ok: false, error: "SECRET_NOT_CONFIGURED" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
      });
    }

    let token = "";
    try {
      token = await decryptCredential(row.token_encrypted, otpSecret);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "DECRYPT_FAILED" }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        token,
        expiresAt: row.expires_at,
        platform: {
          code: row.platform_code || "",
          name: row.platform_name || row.platform_code || "",
          brand: row.platform_brand || "737373",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      }
    );
  } catch (e) {
    console.error("order token error", e);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) },
    });
  }
};
