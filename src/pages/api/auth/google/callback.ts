import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createSession, sessionCookie } from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const FRONTEND_ORIGIN = "https://xx-drp.pages.dev";
const REDIRECT_URI = `${FRONTEND_ORIGIN}/api/auth/google/callback`;

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("invalid jwt");
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_denied`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_missing`, 302);
  }

  // 校验 state
  const kv = env.SESSION;
  if (!kv) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=kv_missing`, 302);
  }
  const saved = await kv.get(`google_oauth_state:${state}`);
  if (!saved) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_state`, 302);
  }
  await kv.delete(`google_oauth_state:${state}`);

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_not_configured`, 302);
  }

  // 换 token
  let tokens: { id_token?: string } = {};
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokenRes.ok || !tokens.id_token) {
      return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_token`, 302);
    }
  } catch {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_token_error`, 302);
  }

  // 解析 id_token
  let payload: {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  } = {};
  try {
    payload = decodeJwtPayload(tokens.id_token) as typeof payload;
  } catch {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_invalid_jwt`, 302);
  }

  const email = (payload.email || "").toLowerCase().trim();
  if (!email || !payload.email_verified) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=google_email`, 302);
  }

  // 找或创建用户
  const db = env.DB;
  let user = await db
    .prepare(
      "SELECT id, username, session_version FROM users WHERE lower(email) = ?1 LIMIT 1",
    )
    .bind(email)
    .first<{ id: string; username: string; session_version: number }>();

  if (!user) {
    const base = (email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 18) || "user";
    let username = base.length >= 3 ? base : base.padEnd(3, "_");

    for (let i = 0; i < 10; i += 1) {
      const exists = await db
        .prepare("SELECT id FROM users WHERE lower(username) = ?1 LIMIT 1")
        .bind(username)
        .first();
      if (!exists) break;
      username = (base + Math.floor(Math.random() * 10000)).slice(0, 20);
    }

    const userId = crypto.randomUUID();
    const displayName = (payload.name || base).slice(0, 30);

    await db
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, session_version, role)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 'user')`,
      )
      .bind(userId, username, email, "", displayName, payload.picture || null)
      .run();

    user = { id: userId, username, session_version: 1 };
  }

  // 签 session
  const session = await createSession(user.id, user.username, false, user.session_version);

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${FRONTEND_ORIGIN}/welcome/`,
      "Set-Cookie": sessionCookie(session.token, session.maxAge),
    },
  });
};
