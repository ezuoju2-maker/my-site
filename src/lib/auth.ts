import { env } from "cloudflare:workers";
import {
  createSessionRecord,
  deleteSessionRecord,
  getSessionRecord,
  isValidSessionToken,
} from "./session-store";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;

const SESSION_TTL = 60 * 60 * 24 * 7;
const REMEMBER_SESSION_TTL = 60 * 60 * 24 * 30;

export type SessionData = {
  userId: string;
  username: string;
  sessionVersion: number;
};

export type ActiveSession = {
  token: string;
  userId: string;
  username: string;
  sessionVersion: number;
  role: string;
};

type StoredPassword = {
  iterations: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

function bytesToBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding === 0
    ? normalized
    : normalized + "=".repeat(4 - padding);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function parsePasswordHash(value: string): StoredPassword | null {
  const parts = value.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return null;

  const iterations = Number(parts[1]);
  if (
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 10_000_000
  ) {
    return null;
  }

  try {
    const salt = base64UrlToBytes(parts[2]);
    const hash = base64UrlToBytes(parts[3]);
    if (
      salt.length < PASSWORD_SALT_BYTES ||
      hash.length !== PASSWORD_HASH_BYTES
    ) {
      return null;
    }
    return { iterations, salt, hash };
  } catch {
    return null;
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i];
  }
  return difference === 0;
}

export async function hashPassword(password: string) {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new Error("INVALID_PASSWORD_LENGTH");
  }

  const salt = new Uint8Array(PASSWORD_SALT_BYTES);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    PASSWORD_HASH_BYTES * 8,
  );

  return [
    "pbkdf2-sha256",
    PASSWORD_ITERATIONS,
    bytesToBase64Url(salt),
    bytesToBase64Url(new Uint8Array(bits)),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
) {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return false;
  }

  const parsed = parsePasswordHash(storedHash);
  if (!parsed) return false;

  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: parsed.salt as BufferSource,
        iterations: parsed.iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      parsed.hash.length * 8,
    );

    return constantTimeEqual(new Uint8Array(bits), parsed.hash);
  } catch {
    return false;
  }
}

export async function createSession(
  userId: string,
  username: string,
  remember = false,
  sessionVersion = 1,
) {
  const ttl = remember ? REMEMBER_SESSION_TTL : SESSION_TTL;
  const token = await createSessionRecord(userId, username, sessionVersion, ttl);

  return {
    token,
    maxAge: remember ? REMEMBER_SESSION_TTL : null,
  };
}

function extractToken(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  if (!isValidSessionToken(token)) return null;
  return token;
}

export async function getSession(request: Request): Promise<ActiveSession | null> {
  const token = extractToken(request);
  if (!token) return null;

  const stored = await getSessionRecord(token);
  if (!stored) return null;

  try {
    const user = await env.DB.prepare(
      "SELECT session_version, role FROM users WHERE id = ?1 LIMIT 1",
    )
      .bind(stored.userId)
      .first<{ session_version: number; role: string }>();

    if (!user || user.session_version !== stored.sessionVersion) {
      await deleteSessionRecord(token);
      return null;
    }

    return {
      token,
      userId: stored.userId,
      username: stored.username,
      sessionVersion: stored.sessionVersion,
      role: user.role || "user",
    };
  } catch {
    return null;
  }
}

export async function deleteSession(request: Request): Promise<void> {
  const token = extractToken(request);
  if (!token) return;
  await deleteSessionRecord(token);
}

export function sessionCookie(
  token: string,
  maxAge: number | null,
) {
  const parts = [
    `session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
  ];

  if (maxAge !== null) {
    parts.push(`Max-Age=${maxAge}`);
  }

  return parts.join("; ");
}

export function clearSessionCookie() {
  return [
    "session=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Max-Age=0",
  ].join("; ");
}
