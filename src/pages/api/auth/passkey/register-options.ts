import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RP_ID = "xx-drp.pages.dev";
const RP_NAME = "my-site";

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").toLowerCase().trim();
  // email 可选：不传则创建匿名 Passkey 账号

  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "DB_NOT_CONFIGURED" }), { status: 500 });
  }

  // 若传了 email 且该邮箱已注册，复用该账号
  let user: { id: string; username: string } | null = null;
  if (email) {
    user = await db
      .prepare("SELECT id, username FROM users WHERE lower(email) = ?1 LIMIT 1")
      .bind(email)
      .first<{ id: string; username: string }>();
  }

  // 未找到 → 创建新账号（无密码，无邮箱或占位邮箱）
  if (!user) {
    const userId = crypto.randomUUID();
    const base = email
      ? email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 18) || "user"
      : "user";
    let username = base.length >= 3 ? base : base.padEnd(3, "_");
    for (let i = 0; i < 10; i += 1) {
      const dup = await db
        .prepare("SELECT id FROM users WHERE lower(username) = ?1 LIMIT 1")
        .bind(username)
        .first();
      if (!dup) break;
      username = (base + Math.floor(Math.random() * 10000)).slice(0, 20);
    }
    const placeholderEmail = email || `passkey-${userId}@local.invalid`;
    await db
      .prepare("INSERT INTO users (id, username, email, password_hash, session_version, role) VALUES (?1, ?2, ?3, ?4, 1, 'user')")
      .bind(userId, username, placeholderEmail, "")
      .run();
    user = { id: userId, username };
  }

  const existing = await db
    .prepare("SELECT credential_id, transports FROM passkeys WHERE user_id = ?1")
    .bind(user.id)
    .all<{ credential_id: string; transports: string | null }>();

  const options = await generateRegistrationOptions({
    rpID: RP_ID,
    rpName: RP_NAME,
    userID: new TextEncoder().encode(user.id),
    userName: email || user.username,
    userDisplayName: user.username,
    attestationType: "none",
    excludeCredentials: (existing.results ?? []).map((p) => ({
      id: p.credential_id,
      type: "public-key" as const,
      transports: p.transports ? JSON.parse(p.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });

  const challengeId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO passkey_challenges (id, user_id, email, challenge, type, expires_at) VALUES (?1, ?2, ?3, ?4, 'register', datetime('now', '+10 minutes'))")
    .bind(challengeId, user.id, email || null, options.challenge)
    .run();

  return new Response(JSON.stringify({ challengeId, options }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
