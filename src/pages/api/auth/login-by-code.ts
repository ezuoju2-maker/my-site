import { recordUsage } from "../../../lib/usage-log";
import { checkBudget } from "../../../lib/budget";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { OTP_TTL_SECONDS, verifyOtpDigest } from "../../../lib/otp";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../lib/cors";
import { createSession, sessionCookie } from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const MAX_ATTEMPTS = 5;
const OTP_PURPOSE = "login-with-code";

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
  const budget = await checkBudget("login");
  if (!budget.ok) return budget.response;
  await recordUsage("login").catch(() => {});

  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  let body: { email?: unknown; emailCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const email = normalizeEmail(body.email);
  const emailCode = typeof body.emailCode === "string" ? body.emailCode.trim() : "";

  if (!email || !/^\d{6}$/.test(emailCode)) {
    return json({ ok: false, error: "INVALID_REQUEST" }, 400, {}, origin);
  }

  const kv = env.SESSION;
  if (!kv) return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);

  const codeKey = `login-code:${email}`;
  const attemptsKey = `login-code-attempts:${email}`;

  try {
    const storedDigest = await kv.get(codeKey);
    if (!storedDigest) return json({ ok: false, error: "EMAIL_CODE_EXPIRED" }, 400, {}, origin);

    const attempts = Number.parseInt((await kv.get(attemptsKey)) ?? "0", 10) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);
      return json({ ok: false, error: "EMAIL_CODE_TOO_MANY_ATTEMPTS" }, 429, { "Retry-After": String(OTP_TTL_SECONDS) }, origin);
    }

    const valid = await verifyOtpDigest(storedDigest, OTP_PURPOSE, email, emailCode);
    if (!valid) {
      const next = attempts + 1;
      await kv.put(attemptsKey, String(next), { expirationTtl: OTP_TTL_SECONDS });
      if (next >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);
        return json({ ok: false, error: "EMAIL_CODE_TOO_MANY_ATTEMPTS" }, 429, { "Retry-After": String(OTP_TTL_SECONDS) }, origin);
      }
      return json({ ok: false, error: "INVALID_EMAIL_CODE", attemptsRemaining: MAX_ATTEMPTS - next }, 400, {}, origin);
    }

    // 验证通过：查用户
    const user = await env.DB.prepare(
      "SELECT id, username, session_version, role FROM users WHERE lower(email) = ?1 LIMIT 1"
    ).bind(email).first<{ id: string; username: string; session_version: number; role: string }>();

    if (!user) return json({ ok: false, error: "USER_NOT_FOUND" }, 400, {}, origin);

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);

    const session = await createSession(
      user.id,
      user.username,
      false,
      Number.isInteger(user.session_version) ? user.session_version : 1,
    );

    return new Response(
      JSON.stringify({ ok: true, user: { id: user.id, username: user.username, role: user.role || "user" } }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
          "Set-Cookie": sessionCookie(session.token, session.maxAge),
        },
      },
    );
  } catch (error) {
    console.error("Login by code failed", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }
};
