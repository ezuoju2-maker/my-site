import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { createSession, sessionCookie } from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RP_ID = "xx-drp.pages.dev";
const ORIGIN = "https://xx-drp.pages.dev";

function b64ToBytes(input: string) {
  const bin = atob(input);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    challengeId?: string;
    credential?: unknown;
  };

  const db = env.DB;

  const row = await db
    .prepare("SELECT user_id, challenge, expires_at FROM passkey_challenges WHERE id = ?1 AND type = 'login'")
    .bind(body.challengeId)
    .first<{ user_id: string | null; challenge: string; expires_at: string }>();

  if (!row) {
    return new Response(JSON.stringify({ error: "CHALLENGE_NOT_FOUND" }), { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.prepare("DELETE FROM passkey_challenges WHERE id = ?1").bind(body.challengeId).run();
    return new Response(JSON.stringify({ error: "CHALLENGE_EXPIRED" }), { status: 400 });
  }

  const cred = body.credential as { id: string };
  const passkey = await db
    .prepare("SELECT user_id, public_key, counter, transports FROM passkeys WHERE credential_id = ?1")
    .bind(cred.id)
    .first<{ user_id: string; public_key: string; counter: number; transports: string | null }>();

  if (!passkey) {
    return new Response(JSON.stringify({ error: "PASSKEY_NOT_FOUND" }), { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.credential as never,
      expectedChallenge: row.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.id,
        publicKey: b64ToBytes(passkey.public_key),
        counter: passkey.counter,
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "VERIFICATION_FAILED" }), { status: 400 });
  }

  if (!verification.verified) {
    return new Response(JSON.stringify({ error: "NOT_VERIFIED" }), { status: 400 });
  }

  await db
    .prepare("UPDATE passkeys SET counter = ?1, updated_at = datetime('now') WHERE credential_id = ?2")
    .bind(verification.authenticationInfo.newCounter, cred.id)
    .run();

  await db.prepare("DELETE FROM passkey_challenges WHERE id = ?1").bind(body.challengeId).run();

  const user = await db
    .prepare("SELECT username, session_version FROM users WHERE id = ?1")
    .bind(passkey.user_id)
    .first<{ username: string; session_version: number }>();

  if (!user) {
    return new Response(JSON.stringify({ error: "USER_NOT_FOUND" }), { status: 400 });
  }

  const session = await createSession(passkey.user_id, user.username, false, user.session_version);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionCookie(session.token, session.maxAge),
    },
  });
};
