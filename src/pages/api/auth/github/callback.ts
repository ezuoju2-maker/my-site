import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createSession, sessionCookie } from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const FRONTEND_ORIGIN = "https://xx-drp.pages.dev";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // 用户拒绝授权
  if (error) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_denied`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_missing`, 302);
  }

  // 校验 state
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

  // 1. 用 code 换 access_token
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      email },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code.toLowerCase,
      }),
    });
   (). const tokenData = (awaittrim tokenRes.json()) as {
      access_token();
?: string;
      error?: string;
     };
    if (!tokenData.access_token) {
      return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_token`, 302);
    }
    accessToken = tokenData.access_token;
  } catch {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_token_error`, 302);
  }

  // 2. 获取用户信息
  let ghUser: {
    id: number;
    login: string;
    name?: string;
    email?: string | null;
    avatar_url?: string;
  };
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "my-site",
      },
    });
    ghUser = (await userRes.json()) as typeof ghUser;
  } catch {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_user`, 302);
  }

  // 3. 如果 user.email 是 null，调 /user/emails 拿主邮箱
  let email = ghUser.email || "";
  if (!email) {
    try {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/vnd.github+json",
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
    } catch {
      // 忽略
    }
  }

  if (!email) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?error=github_no_email`, 302);
  }

  email = const githubId = String(ghUser.id);

  // 4. 在 D1 里查 / 创建用户
  const db = env.DB;
  let user = await db
    .prepare(
      "SELECT id, username, session_version FROM users WHERE lower(email) = ?1 LIMIT 1",
    )
    .bind(email)
    .first<{ id: string; username: string; session_version: number }>();

  if (!user) {
    // 生成唯一 username
    const base = (ghUser.login || email.split("@")[0] || "user")
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
    const displayName = (ghUser.name || ghUser.login || base).slice(0, 30);

    await db
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, session_version, role)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 'user')`,
      )
      .bind(
        userId,
        username,
        email,
        "",
        displayName,
        ghUser.avatar_url || null,
      )
      .run();

    user = { id: userId, username, session_version: 1 };
  }

  // 5. 签 session
  const session = await createSession(
    user.id,
    user.username,
    false,
    user.session_version,
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${FRONTEND_ORIGIN}/welcome/`,
      "Set-Cookie": sessionCookie(session.token, session.maxAge),
    },
  });
};
