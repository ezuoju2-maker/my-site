import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RP_ID = "xx-drp.pages.dev";
const RP_NAME = "my-site";

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { email?: string };
  const email = (body.email || "").toLowerCase().trim();

  if (!email) {
    return new Response(JSON.stringify({ error: "EMAIL_REQUIRED" }), { status: 400 });
  }

  const db = env.DB;

  let user = await db
    .prepare("SELECT id, username FROM users WHERE lower(email) = ?1 LIMIT 1")
    .bind(email)
    .first<{ id: string; username: string }>();

  if (!user) {
    const base = email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 18) || "user";
    let username = base.length >= 3 ? base : base.padEnd(3, "_");
    for (let i = 0; i < 10; i += 1) {
      const dup = await db.prepare("SELECT id FROM users WHERE lower(username) = ?1 LIMIT 1").bind(username).first();
      if (!dup) break;
      username = (base + Math.floor(Math.random() * 10000)).slice(0, 20);
    }
    const userId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO users (id, username, email, password_hash, session_version, role) VALUES (?1, ?2, ?3, ?4, 1, 'user')")
      .bind(userId, username, email, "")
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
    userName: email,
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
    .bind(challengeId, user.id, email, options.challenge)
    .run();

  return new Response(JSON.stringify({ challengeId, options }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
