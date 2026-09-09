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

const MAX_ATTEMPTS = 5;
const OTP_PURPOSE = "password-reset";

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
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
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
    return json(
      {
        ok: false,
        error: "SESSION_SERVICE_NOT_CONFIGURED",
      },
      500,
      {},
      origin,
    );
  }

  const codeKey =
    `password-reset-code:${email}`;
  const attemptsKey =
    `password-reset-attempts:${email}`;

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

    const attempts =
      Number.parseInt(
        (await kv.get(attemptsKey)) ?? "0",
        10,
      ) || 0;

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
          "Retry-After":
            String(OTP_TTL_SECONDS),
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
      const next = attempts + 1;

      await kv.put(
        attemptsKey,
        String(next),
        {
          expirationTtl: OTP_TTL_SECONDS,
        },
      );

      if (next >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);

        return json(
          {
            ok: false,
            error: "EMAIL_CODE_TOO_MANY_ATTEMPTS",
          },
          429,
          {
            "Retry-After":
              String(OTP_TTL_SECONDS),
          },
          origin,
        );
      }

      return json(
        {
          ok: false,
          error: "INVALID_EMAIL_CODE",
          attemptsRemaining:
            MAX_ATTEMPTS - next,
        },
        400,
        {},
        origin,
      );
    }
  } catch (error) {
    console.error(
      "Password reset verification error",
      error,
    );

    return json(
      {
        ok: false,
        error:
          "EMAIL_VERIFICATION_SERVICE_ERROR",
      },
      500,
      {},
      origin,
    );
  }

  try {
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1",
    )
      .bind(email)
      .first<{ id: string }>();

    if (!user) {
      return json(
        {
          ok: false,
          error: "PASSWORD_RESET_FAILED",
        },
        400,
        {},
        origin,
      );
    }

    const passwordHash =
      await hashPassword(newPassword);

    const result = await env.DB.prepare(
      `UPDATE users
       SET password_hash = ?1,
           session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
      .bind(passwordHash, user.id)
      .run();

    if (!result.success) {
      throw new Error(
        "Password reset update failed",
      );
    }

    /*
     * Consume the OTP only after the password and
     * session-version update succeeds.
     */
    await kv.delete(codeKey);
    await kv.delete(attemptsKey);

    return json(
      { ok: true },
      200,
      {},
      origin,
    );
  } catch (error) {
    console.error(
      "Password reset database error",
      error,
    );

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
