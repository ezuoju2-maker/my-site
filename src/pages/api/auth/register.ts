import { recordUsage } from "../../../lib/budget";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  hashPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../../../lib/auth";
import {
  OTP_TTL_SECONDS,
  verifyOtpDigest,
} from "../../../lib/otp";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

const EMAIL_CODE_MAX_ATTEMPTS = 5;
const OTP_PURPOSE = "email-verification";

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
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
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
  recordUsage("register").catch(() => {});
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
    const storedDigest = await kv.get(codeKey);

    if (!storedDigest) {
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
          "Retry-After": String(OTP_TTL_SECONDS),
        },
        origin,
      );
    }

    const valid = await verifyOtpDigest(
      storedDigest,
      OTP_PURPOSE,
      email,
      emailCode,
    );

    if (!valid) {
      const nextAttempts = attempts + 1;

      await kv.put(
        attemptsKey,
        String(nextAttempts),
        {
          expirationTtl: OTP_TTL_SECONDS,
        },
      );

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
            "Retry-After": String(OTP_TTL_SECONDS),
          },
          origin,
        );
      }

      return json(
        {
          ok: false,
          error: "INVALID_EMAIL_CODE",
          attemptsRemaining:
            EMAIL_CODE_MAX_ATTEMPTS - nextAttempts,
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

    const passwordHash = await hashPassword(password);
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

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);

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
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("UNIQUE constraint failed: users.username")) {
      return json(
        { ok: false, error: "USERNAME_EXISTS" },
        409,
        {},
        origin,
      );
    }

    if (message.includes("UNIQUE constraint failed: users.email")) {
      return json(
        { ok: false, error: "EMAIL_EXISTS" },
        409,
        {},
        origin,
      );
    }

    console.error("Registration database error", error);

    return json(
      { ok: false, error: "REGISTRATION_FAILED" },
      500,
      {},
      origin,
    );
  }
};
