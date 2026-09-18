import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createSession, sessionCookie } from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const FRONTEND_ORIGIN = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_denied`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_missing`, 302);
  }

  const kv = env.SESSION;
  if (!kv) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=kv_missing`, 302);
  }
  const saved = await kv.get(`github_oauth_state:${state}`);
  if (!saved) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_state`, 302);
  }
  await kv.delete(`github_oauth_state:${state}`);

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_not_configured`, 302);
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_token`, 302);
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "my-site",
    },
  });
  const ghUser = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string | null;
    avatar_url?: string;
  };

  let email = ghUser.email || "";
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "my-site",
      },
    });
    const emails = (await emailsRes.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified);
    if (primary) email = primary.email;
  }
  if (!email) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_no_email`, 302);
  }
  email = email.toLowerCase().trim();

  const db = env.DB;
  const existing = await db
    .prepare("SELECT id, username, session_version FROM users WHERE lower(email) = ?1 LIMIT 1")
    .bind(email)
    .first<{ id: string; username: string; session_version: number }>();

  let userId: string;
  let username: string;
  let sessionVersion: number;

  if (existing) {
    userId = existing.id;
    username = existing.username;
    sessionVersion = existing.session_version;
  } else {
    const base = (ghUser.login || "user").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "user";
    username = base.length >= 3 ? base : base.padEnd(3, "_");
    for (let i = 0; i < 10; i += 1) {
      const dup = await db.prepare("SELECT id FROM users WHERE lower(username) = ?1 LIMIT 1").bind(username).first();
      if (!dup) break;
      username = (base + Math.floor(Math.random() * 10000)).slice(0, 20);
    }
    userId = crypto.randomUUID();
    sessionVersion = 1;
    const displayName = (ghUser.name || ghUser.login || base).slice(0, 30);
    await db
      .prepare("INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, session_version, role) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 'user')")
      .bind(userId, username, email, "", displayName, ghUser.avatar_url || null)
      .run();
  }

  const session = await createSession(userId, username, false, sessionVersion);

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${FRONTEND_ORIGIN}/welcome/`,
      "Set-Cookie": sessionCookie(session.token, session.maxAge),
    },
  });
};
