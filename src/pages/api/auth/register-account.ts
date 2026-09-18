import { checkBudget } from "../../../lib/budget";
import { recordUsage } from "../../../lib/usage-log";
import type { APIRoute } from "astro";
import { checkFormGuard } from "../../../lib/form-guard";
import { env } from "cloudflare:workers";
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../../lib/auth";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../lib/cors";
import { extractCaptchaToken, verifyCaptcha } from "../../../lib/captcha";
import { createSession, sessionCookie } from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200, headers: Record<string, string> = {}, origin?: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function normalizeUsername(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function isValidUsername(u: string) {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

function normalizeEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPassword(p: string) {
  return (
    p.length >= PASSWORD_MIN_LENGTH &&
    p.length <= PASSWORD_MAX_LENGTH &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  );
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
  const budget = await checkBudget("register");
  if (!budget.ok) return budget.response;
  await recordUsage("register").catch(() => {});

  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  let body: { username?: unknown; email?: unknown; password?: unknown; captchaToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const guard = checkFormGuard(body);
  if (!guard.ok) return json({ ok: false, error: guard.error }, 400, {}, origin);

  const captchaToken = extractCaptchaToken(body);
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) return json({ ok: false, error: "CAPTCHA_FAILED" }, 403, {}, origin);

  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!isValidUsername(username)) return json({ ok: false, error: "INVALID_USERNAME" }, 400, {}, origin);
  if (!isValidEmail(email)) return json({ ok: false, error: "INVALID_EMAIL" }, 400, {}, origin);
  if (!isValidPassword(password)) return json({ ok: false, error: "INVALID_PASSWORD" }, 400, {}, origin);

  const db = env.DB;
  if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, {}, origin);

  try {
    const existing = await db
      .prepare("SELECT id FROM users WHERE lower(username) = ?1 OR lower(email) = ?2 LIMIT 1")
      .bind(username, email)
      .first();
    if (existing) return json({ ok: false, error: "ACCOUNT_EXISTS" }, 409, {}, origin);

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await db
      .prepare(
        "INSERT INTO users (id, username, email, password_hash, session_version, role) VALUES (?1, ?2, ?3, ?4, 1, 'user')",
      )
      .bind(userId, username, email, passwordHash)
      .run();

    const session = await createSession(userId, username, false, 1);

    return new Response(
      JSON.stringify({ ok: true, user: { id: userId, username } }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
          "Set-Cookie": sessionCookie(session.token, session.maxAge),
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE constraint failed: users.username") || message.includes("UNIQUE constraint failed: users.email")) {
      return json({ ok: false, error: "ACCOUNT_EXISTS" }, 409, {}, origin);
    }
    console.error("Account registration failed", error);
    return json({ ok: false, error: "REGISTRATION_FAILED" }, 500, {}, origin);
  }
};
