import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { createSession, sessionCookie } from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RP_ID = "xx-drp.pages.dev";
const ORIGIN = "https://xx-drp.pages.dev";

function b64urlToBytes(input: string): Uint8Array {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    challengeId?: string;
    credential?: unknown;
  };

  const db = env.DB;

  const row = await db
    .prepare("SELECT user_id, email, challenge, expires_at FROM passkey_challenges WHERE id = ?1 AND type = 'register'")
    .bind(body.challengeId)
    .first<{ user_id: string; email: string; challenge: string; expires_at: string }>();

  if (!row) {
    return new Response(JSON.stringify({ error: "CHALLENGE_NOT_FOUND" }), { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.prepare("DELETE FROM passkey_challenges WHERE id = ?1").bind(body.challengeId).run();
    return new Response(JSON.stringify({ error: "CHALLENGE_EXPIRED" }), { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.credential as never,
      expectedChallenge: row.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch {
    return new Response(JSON.stringify({ error: "VERIFICATION_FAILED" }), { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return new Response(JSON.stringify({ error: "NOT_VERIFIED" }), { status: 400 });
  }

  const info = verification.registrationInfo;
  const credIdB64 = info.credential.id;
  const pubKeyB64 = bytesToB64(info.credential.publicKey);

  await db
    .prepare("INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_type, backed_up, transports) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
    .bind(
      crypto.randomUUID(),
      row.user_id,
      credIdB64,
      pubKeyB64,
      info.credential.counter,
      info.credentialDeviceType,
      info.credentialBackedUp ? 1 : 0,
      JSON.stringify(info.credential.transports || []),
    )
    .run();

  await db.prepare("DELETE FROM passkey_challenges WHERE id = ?1").bind(body.challengeId).run();

  const user = await db
    .prepare("SELECT username, session_version FROM users WHERE id = ?1")
    .bind(row.user_id)
    .first<{ username: string; session_version: number }>();

  if (!user) {
    return new Response(JSON.stringify({ error: "USER_NOT_FOUND" }), { status: 400 });
  }

  const session = await createSession(row.user_id, user.username, false, user.session_version);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionCookie(session.token, session.maxAge),
    },
  });
};
