import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RP_ID = "xx-drp.pages.dev";

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { email?: string };
  const email = (body.email || "").toLowerCase().trim();

  const db = env.DB;

  let allowCredentials: { id: string; type: "public-key"; transports?: string[] }[] = [];
  let userId: string | null = null;

  if (email) {
    const user = await db
      .prepare("SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1")
      .bind(email)
      .first<{ id: string }>();
    if (user) {
      userId = user.id;
      const creds = await db
        .prepare("SELECT credential_id, transports FROM passkeys WHERE user_id = ?1")
        .bind(user.id)
        .all<{ credential_id: string; transports: string | null }>();
      allowCredentials = (creds.results ?? []).map((c) => ({
        id: c.credential_id,
        type: "public-key" as const,
        transports: c.transports ? JSON.parse(c.transports) : undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: "required",
  });

  const challengeId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO passkey_challenges (id, user_id, email, challenge, type, expires_at) VALUES (?1, ?2, ?3, ?4, 'login', datetime('now', '+10 minutes'))")
    .bind(challengeId, userId, email || null, options.challenge)
    .run();

  return new Response(JSON.stringify({ challengeId, options }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
