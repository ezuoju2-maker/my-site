import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyOtpDigest, OTP_TTL_SECONDS } from "../../../../lib/otp";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const MAX_ATTEMPTS = 5;
const OTP_PURPOSE = "passkey-recovery";
const TICKET_TTL_SECONDS = 10 * 60; // ticket 10 分钟有效

function json(data: unknown, status = 200, headers: Record<string, string> = {}, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
      ...headers,
    },
  });
}

function normalizeEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
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

  let body: { email?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return json({ ok: false, error: "INVALID_REQUEST" }, 400, {}, origin);
  }

  const kv = env.SESSION;
  if (!kv) return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);

  const codeKey = `passkey-recovery-code:${email}`;
  const attemptsKey = `passkey-recovery-attempts:${email}`;

  try {
    const storedDigest = await kv.get(codeKey);
    if (!storedDigest) return json({ ok: false, error: "CODE_EXPIRED" }, 400, {}, origin);

    const attempts = Number.parseInt((await kv.get(attemptsKey)) ?? "0", 10) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);
      return json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, 429, { "Retry-After": String(OTP_TTL_SECONDS) }, origin);
    }

    const valid = await verifyOtpDigest(storedDigest, OTP_PURPOSE, email, code);
    if (!valid) {
      const next = attempts + 1;
      await kv.put(attemptsKey, String(next), { expirationTtl: OTP_TTL_SECONDS });
      if (next >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);
        return json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, 429, { "Retry-After": String(OTP_TTL_SECONDS) }, origin);
      }
      return json({ ok: false, error: "INVALID_CODE", attemptsRemaining: MAX_ATTEMPTS - next }, 400, {}, origin);
    }

    // 验证成功
    const user = await env.DB.prepare(
      "SELECT id, username FROM users WHERE lower(email) = ?1 LIMIT 1"
    ).bind(email).first<{ id: string; username: string }>();

    if (!user) return json({ ok: false, error: "USER_NOT_FOUND" }, 400, {}, origin);

    // 生成一次性 ticket
    const ticket = crypto.randomUUID();
    await kv.put(`passkey-recovery-ticket:${ticket}`, JSON.stringify({ userId: user.id, email }), {
      expirationTtl: TICKET_TTL_SECONDS,
    });

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);

    return json({
      ok: true,
      ticket,
      username: user.username,
      expiresIn: TICKET_TTL_SECONDS,
    }, 200, {}, origin);
  } catch (error) {
    console.error("Passkey recovery verify failed", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }
};
