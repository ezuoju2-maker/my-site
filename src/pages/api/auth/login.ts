import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  createSession,
  sessionCookie,
  verifyPassword,
} from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

type LoginBody = {
  identifier?: unknown;
  password?: unknown;
  remember?: unknown;
};

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS_PER_IDENTIFIER = 10;
const LOGIN_MAX_ATTEMPTS_PER_IP = 30;

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin: string | null = null,
) {
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

function getClientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function normalizeIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function incrementLimit(kv: KVNamespace, key: string, max: number) {
  const current = Number.parseInt((await kv.get(key)) ?? "0", 10) || 0;
  if (current >= max) return true;

  await kv.put(key, String(current + 1), {
    expirationTtl: LOGIN_WINDOW_SECONDS,
  });
  return false;
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

  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const identifier = normalizeIdentifier(body.identifier);
  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember === true;

  if (!identifier || !password) {
    return json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      401,
      {},
      origin,
    );
  }

  const kv = env.SESSION;
  if (!kv) {
    console.error("SESSION KV binding is not configured");
    return json(
      { ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" },
      500,
      {},
      origin,
    );
  }

  const clientIp = getClientIp(request);
  const identifierKey = `login-attempts:${clientIp}:${identifier}`;
  const ipKey = `login-ip-attempts:${clientIp}`;

  try {
    const identifierLimited = await incrementLimit(
      kv,
      identifierKey,
      LOGIN_MAX_ATTEMPTS_PER_IDENTIFIER,
    );
    const ipLimited = await incrementLimit(
      kv,
      ipKey,
      LOGIN_MAX_ATTEMPTS_PER_IP,
    );

    if (identifierLimited || ipLimited) {
      return json(
        {
          ok: false,
          error: "TOO_MANY_REQUESTS",
          retryAfter: LOGIN_WINDOW_SECONDS,
        },
        429,
        { "Retry-After": String(LOGIN_WINDOW_SECONDS) },
        origin,
      );
    }

    const user = await env.DB.prepare(
      `SELECT id, username, email, password_hash, session_version
       FROM users
       WHERE lower(username) = ?1 OR lower(email) = ?1
       LIMIT 1`,
    )
      .bind(identifier)
      .first<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        session_version: number;
      }>();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return json(
        { ok: false, error: "INVALID_CREDENTIALS" },
        401,
        {},
        origin,
      );
    }

    await kv.delete(identifierKey);
    await kv.delete(ipKey);

    const session = await createSession(
      user.id,
      user.username,
      remember,
      Number.isInteger(user.session_version) ? user.session_version : 1,
    );

    return json(
      {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      200,
      {
        "Set-Cookie": sessionCookie(session.token, session.maxAge),
      },
      origin,
    );
  } catch (error) {
    console.error("Login error", error);
    return json(
      { ok: false, error: "INTERNAL_ERROR" },
      500,
      {},
      origin,
    );
  }
};
