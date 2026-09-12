import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";
import { generateToken, hashToken, encryptCredential } from "../../../../lib/grab/crypto";

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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { platform?: unknown; ttlDays?: unknown };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  if (!/^[a-z0-9_]{2,32}$/.test(platform)) {
    return json({ ok: false, error: "INVALID_PLATFORM" }, 400, origin);
  }

  const ttlDays = typeof body.ttlDays === "number" && body.ttlDays > 0 && body.ttlDays <= 30
    ? Math.floor(body.ttlDays) : 1;

  try {
    const platformRow = await env.DB.prepare(
      "SELECT code FROM grab_platforms WHERE code = ?1 AND enabled = 1 LIMIT 1"
    ).bind(platform).first<{ code: string }>();
    if (!platformRow) {
      return json({ ok: false, error: "PLATFORM_NOT_SUPPORTED" }, 400, origin);
    }

    const token = generateToken();
    const tokenHash = await hashToken(token);
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();

    const otpSecret = (env as any).OTP_SECRET as string | undefined;
    if (!otpSecret || !/^[0-9a-fA-F]{64}$/.test(otpSecret)) {
      return json({ ok: false, error: "SECRET_NOT_CONFIGURED" }, 500, origin);
    }
    const tokenEnc = await encryptCredential(token, otpSecret);

    await env.DB.prepare(
      "INSERT INTO grab_qr_sessions (id, token_hash, platform_code, created_by, expires_at, token_encrypted) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).bind(id, tokenHash, platform, auth.session.userId, expiresAt, tokenEnc).run();

    return json({ ok: true, id, token, scanUrl: "/scan/" + token, expiresAt }, 200, origin);
  } catch (e) {
    console.error("grab qr create error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
