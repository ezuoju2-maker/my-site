import { env } from "cloudflare:workers";

const POW_PREFIX = "pow";
const CHALLENGE_TTL = 10 * 60;
const TOKEN_TTL = 5 * 60;
const DEFAULT_DIFFICULTY = 3;

const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getSecret(): string {
  const s = (env as any).OTP_SECRET as string | undefined;
  if (!s || !/^[0-9a-fA-F]{64}$/.test(s)) {
    throw new Error("POW secret unavailable");
  }
  return s;
}

async function hmac(message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return new Uint8Array(sig);
}

export type Challenge = {
  challenge_id: string;
  salt: string;
  difficulty: number;
  expires_at: number;
  signature: string;
};

export async function createChallenge(): Promise<Challenge> {
  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const challenge_id = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const difficulty = DEFAULT_DIFFICULTY;
  const expires_at = Date.now() + CHALLENGE_TTL * 1000;

  const message = `${POW_PREFIX}:challenge:${challenge_id}:${salt}:${difficulty}:${expires_at}`;
  const signature = bytesToBase64Url(await hmac(message));

  await kv.put(
    `${POW_PREFIX}:challenge:${challenge_id}`,
    JSON.stringify({ salt, difficulty, expires_at }),
    { expirationTtl: CHALLENGE_TTL },
  );

  return { challenge_id, salt, difficulty, expires_at, signature };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", textEncoder.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function redeemChallenge(
  challenge_id: unknown,
  nonce: unknown,
  signature: unknown,
): Promise<string | null> {
  if (
    typeof challenge_id !== "string" || !challenge_id || challenge_id.length > 64 ||
    typeof nonce !== "number" || !Number.isInteger(nonce) || nonce < 0 || nonce > 1e12 ||
    typeof signature !== "string" || !signature || signature.length > 128
  ) {
    return null;
  }

  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const key = `${POW_PREFIX}:challenge:${challenge_id}`;
  const raw = await kv.get(key);
  if (!raw) return null;

  await kv.delete(key);

  let stored: { salt: string; difficulty: number; expires_at: number };
  try {
    stored = JSON.parse(raw);
  } catch {
    return null;
  }

  if (Date.now() > stored.expires_at) return null;

  const message = `${POW_PREFIX}:challenge:${challenge_id}:${stored.salt}:${stored.difficulty}:${stored.expires_at}`;
  const expectedSig = await hmac(message);

  let providedSig: Uint8Array;
  try {
    const normalized = signature.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    providedSig = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }

  if (!constantTimeEqual(providedSig, expectedSig)) return null;

  const hex = await sha256Hex(`${stored.salt}:${nonce}`);
  const target = "0".repeat(stored.difficulty);
  if (!hex.startsWith(target)) return null;

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64Url(tokenBytes);

  await kv.put(`${POW_PREFIX}:token:${token}`, "1", {
    expirationTtl: TOKEN_TTL,
  });

  return token;
}

export async function verifyPowToken(token: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) {
    return false;
  }
  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const key = `${POW_PREFIX}:token:${token}`;
  const exists = await kv.get(key);
  if (!exists) return false;

  await kv.delete(key);
  return true;
}
