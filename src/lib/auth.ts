import { env } from "cloudflare:workers";

const SESSION_TTL = 60 * 60 * 24 * 7;

type SessionData = {
  userId: string;
  username: string;
};

type StoredPassword = {
  iterations: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function parsePasswordHash(value: string): StoredPassword | null {
  const parts = value.split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") {
    return null;
  }

  const iterations = Number(parts[1]);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return null;
  }

  try {
    return {
      iterations,
      salt: base64ToBytes(parts[2]),
      hash: base64ToBytes(parts[3]),
    };
  } catch {
    return null;
  }
}

export async function verifyPassword(
  password: string,
  storedHash: string,
) {
  const parsed = parsePasswordHash(storedHash);

  if (!parsed) {
    return false;
  }

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
      salt: parsed.salt,
      iterations: parsed.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    parsed.hash.length * 8,
  );

  const actual = new Uint8Array(bits);

  if (actual.length !== parsed.hash.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < actual.length; i++) {
    difference |= actual[i] ^ parsed.hash[i];
  }

  return difference === 0;
}

export async function createSession(
  userId: string,
  username: string,
) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...tokenBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const session: SessionData = {
    userId,
    username,
  };

  await env.SESSION.put(
    `session:${token}`,
    JSON.stringify(session),
    {
      expirationTtl: SESSION_TTL,
    },
  );

  return {
    token,
    maxAge: SESSION_TTL,
  };
}

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie") ?? "";

  const match = cookie.match(
    /(?:^|;\s*)session=([^;]+)/,
  );

  if (!match) {
    return null;
  }

  const token = match[1];

  if (!token || token.length > 128) {
    return null;
  }

  const value = await env.SESSION.get(`session:${token}`);

  if (!value) {
    return null;
  }

  try {
    const session = JSON.parse(value) as SessionData;

    if (
      typeof session.userId !== "string" ||
      typeof session.username !== "string"
    ) {
      return null;
    }

    return {
      token,
      ...session,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return;
  }

  await env.SESSION.delete(`session:${session.token}`);
}

export function sessionCookie(token: string, maxAge: number) {
  return [
    `session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    `Max-Age=${maxAge}`,
  ].join("; ");
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
