import type { APIRoute } from "astro";

export const prerender = import.meta.env.GITHUB_PAGES === "true";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

const MAX_ATTEMPTS = 5;

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin: string | null = null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
      ...headers,
    },
  });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function toBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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
    email?: unknown;
    emailCode?: unknown;
    newPassword?: unknown;
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

  const email = normalizeEmail(body.email);
  const emailCode =
    typeof body.emailCode === "string"
      ? body.emailCode.trim()
      : "";
  const newPassword =
    typeof body.newPassword === "string"
      ? body.newPassword
      : "";

  if (!isValidEmail(email)) {
    return json(
      { ok: false, error: "INVALID_EMAIL" },
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

  if (!isValidPassword(newPassword)) {
    return json(
      { ok: false, error: "INVALID_PASSWORD" },
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

  const codeKey = `password-reset-code:${email}`;
  const attemptsKey = `password-reset-attempts:${email}`;

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
    const attempts =
      Number.parseInt(attemptsValue ?? "0", 10) || 0;

    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);

      return json(
        {
          ok: false,
          error: "EMAIL_CODE_TOO_MANY_ATTEMPTS",
        },
        429,
        {
          "Retry-After": "600",
        },
        origin,
      );
    }

    if (!constantTimeEqual(storedCode, emailCode)) {
      const nextAttempts = attempts + 1;

      await kv.put(attemptsKey, String(nextAttempts), {
        expirationTtl: 10 * 60,
      });

      if (nextAttempts >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);

        return json(
          {
            ok: false,
            error: "EMAIL_CODE_TOO_MANY_ATTEMPTS",
          },
          429,
          {
            "Retry-After": "600",
          },
          origin,
        );
      }

      return json(
        {
          ok: false,
          error: "INVALID_EMAIL_CODE",
          attemptsRemaining: MAX_ATTEMPTS - nextAttempts,
        },
        400,
        {},
        origin,
      );
    }

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);
  } catch (error) {
    console.error("Password reset verification KV error", error);

    return json(
      {
        ok: false,
        error: "EMAIL_VERIFICATION_SERVICE_ERROR",
      },
      500,
      {},
      origin,
    );
  }

  try {
    const user = await env.DB.prepare(
      "SELECT id, email FROM users WHERE lower(email) = ?1 LIMIT 1",
    )
      .bind(email)
      .first<{
        id: string;
        email: string;
      }>();

    /*
     * The send-code endpoint deliberately hides whether an account
     * exists. If the account disappeared between code delivery and
     * reset, return a generic failure.
     */
    if (!user) {
      return json(
        { ok: false, error: "PASSWORD_RESET_FAILED" },
        400,
        {},
        origin,
      );
    }

    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(newPassword),
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

    const passwordHash =
      `pbkdf2-sha256$100000$${toBase64Url(salt)}$${toBase64Url(
        new Uint8Array(derivedBits),
      )}`;

    await env.DB.prepare(
      `UPDATE users
       SET password_hash = ?1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
      .bind(passwordHash, user.id)
      .run();

    /*
     * Invalidate every existing session for this user.
     * Existing sessions are stored under session:<token>, so list
     * the user's session records and remove the matching ones.
     */
    let cursor: string | undefined;

    do {
      const sessionList = await kv.list({
        prefix: "session:",
        ...(cursor ? { cursor } : {}),
      });

      for (const key of sessionList.keys) {
        const value = await kv.get(key.name);

        if (!value) {
          continue;
        }

        try {
          const session = JSON.parse(value) as {
            userId?: unknown;
          };

          if (session.userId === user.id) {
            await kv.delete(key.name);
          }
        } catch {
          // Ignore malformed unrelated session records.
        }
      }

      cursor = sessionList.list_complete
        ? undefined
        : sessionList.cursor;
    } while (cursor);

    return json(
      {
        ok: true,
      },
      200,
      {},
      origin,
    );
  } catch (error) {
    console.error("Password reset database error", error);

    return json(
      {
        ok: false,
        error: "PASSWORD_RESET_FAILED",
      },
      500,
      {},
      origin,
    );
  }
};
