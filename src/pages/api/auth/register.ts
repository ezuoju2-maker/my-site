import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

const EMAIL_CODE_TTL_SECONDS = 10 * 60;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin?: string | null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,32}$/.test(username);
}

function isValidPassword(password: string) {
  return password.length >= 8 && password.length <= 128;
}

function constantTimeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < aBytes.length; i += 1) {
    difference |= aBytes[i] ^ bBytes[i];
  }

  return difference === 0;
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);

  if (!origin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);

  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  let body: {
    username?: unknown;
    email?: unknown;
    password?: unknown;
    emailCode?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      { ok: false, error: "INVALID_JSON" },
      400,
      {},
      origin,
    );
  }

  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password =
    typeof body.password === "string" ? body.password : "";
  const emailCode =
    typeof body.emailCode === "string"
      ? body.emailCode.trim()
      : "";

  if (!isValidUsername(username)) {
    return json(
      { ok: false, error: "INVALID_USERNAME" },
      400,
      {},
      origin,
    );
  }

  if (!isValidEmail(email)) {
    return json(
      { ok: false, error: "INVALID_EMAIL" },
      400,
      {},
      origin,
    );
  }

  if (!isValidPassword(password)) {
    return json(
      { ok: false, error: "INVALID_PASSWORD" },
      400,
      {},
      origin,
    );
  }

  if (!/^\d{6}$/.test(emailCode)) {
    return json(
      { ok: false, error: "INVALID_EMAIL_CODE" },
      400,
      {},
      origin,
    );
  }

  const kv = env.SESSION;

  if (!kv) {
    console.error("SESSION KV binding is not configured");

    return json(
      { ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" },
      500,
      {},
      origin,
    );
  }

  const codeKey = `email-code:${email}`;
  const attemptsKey = `email-code-attempts:${email}`;

  try {
    const storedCode = await kv.get(codeKey);

    if (!storedCode) {
      return json(
        { ok: false, error: "EMAIL_CODE_EXPIRED" },
        400,
        {},
        origin,
      );
    }

    const attemptsValue = await kv.get(attemptsKey);
    const attempts = Number.parseInt(attemptsValue ?? "0", 10) || 0;

    if (attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);

      return json(
        {
          ok: false,
          error: "EMAIL_CODE_TOO_MANY_ATTEMPTS",
        },
        429,
        {
          "Retry-After": String(EMAIL_CODE_TTL_SECONDS),
        },
        origin,
      );
    }

    if (!constantTimeEqual(storedCode, emailCode)) {
      const nextAttempts = attempts + 1;

      await kv.put(attemptsKey, String(nextAttempts), {
        expirationTtl: EMAIL_CODE_TTL_SECONDS,
      });

      if (nextAttempts >= EMAIL_CODE_MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);

        return json(
          {
            ok: false,
            error: "EMAIL_CODE_TOO_MANY_ATTEMPTS",
          },
          429,
          {
            "Retry-After": String(EMAIL_CODE_TTL_SECONDS),
          },
          origin,
        );
      }

      return json(
        {
          ok: false,
          error: "INVALID_EMAIL_CODE",
          attemptsRemaining: EMAIL_CODE_MAX_ATTEMPTS - nextAttempts,
        },
        400,
        {},
        origin,
      );
    }

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);
  } catch (error) {
    console.error("Email verification KV error", error);

    return json(
      { ok: false, error: "EMAIL_VERIFICATION_SERVICE_ERROR" },
      500,
      {},
      origin,
    );
  }

  try {
    const existingUser = await env.DB.prepare(
      "SELECT id, username, email FROM users WHERE username = ?1 OR email = ?2 LIMIT 1",
    )
      .bind(username, email)
      .first<{
        id: string;
        username: string;
        email: string;
      }>();

    if (existingUser) {
      if (existingUser.username === username) {
        return json(
          { ok: false, error: "USERNAME_EXISTS" },
          409,
          {},
          origin,
        );
      }

      return json(
        { ok: false, error: "EMAIL_EXISTS" },
        409,
        {},
        origin,
      );
    }

    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100_000,
        hash: "SHA-256",
      },
      passwordKey,
      256,
    );

    const toBase64Url = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    const passwordHash =
      `pbkdf2-sha256$100000$${toBase64Url(salt)}$${toBase64Url(
        new Uint8Array(derivedBits),
      )}`;

    const userId = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO users (
        id,
        username,
        email,
        password_hash
      ) VALUES (?1, ?2, ?3, ?4)`,
    )
      .bind(userId, username, email, passwordHash)
      .run();

    return json(
      {
        ok: true,
        user: {
          id: userId,
          username,
          email,
        },
      },
      201,
      {},
      origin,
    );
  } catch (error) {
    console.error("Registration database error", error);

    return json(
      { ok: false, error: "REGISTRATION_FAILED" },
      500,
      {},
      origin,
    );
  }
};
