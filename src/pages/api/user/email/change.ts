import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../../lib/cors";
import { verifyOtpDigest, OTP_TTL_SECONDS } from "../../../../lib/otp";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const MAX_ATTEMPTS = 5;
const OTP_PURPOSE = "email-change";

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

function normalizeEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });

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
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { newEmail?: unknown; emailCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const newEmail = normalizeEmail(body.newEmail);
  const emailCode =
    typeof body.emailCode === "string" ? body.emailCode.trim() : "";

  if (!isValidEmail(newEmail)) {
    return json({ ok: false, error: "INVALID_EMAIL" }, 400, {}, origin);
  }

  if (!/^\d{6}$/.test(emailCode)) {
    return json({ ok: false, error: "INVALID_EMAIL_CODE" }, 400, {}, origin);
  }

  const kv = env.SESSION;
  if (!kv) {
    return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);
  }

  const codeKey = `email-change-code:${newEmail}`;
  const attemptsKey = `email-change-attempts:${newEmail}`;

  // 验证码校验
  try {
    const storedDigest = await kv.get(codeKey);
    if (!storedDigest) {
      return json({ ok: false, error: "EMAIL_CODE_EXPIRED" }, 400, {}, origin);
    }

    const attempts =
      Number.parseInt((await kv.get(attemptsKey)) ?? "0", 10) || 0;

    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);
      return json(
        { ok: false, error: "EMAIL_CODE_TOO_MANY_ATTEMPTS" },
        429,
        { "Retry-After": String(OTP_TTL_SECONDS) },
        origin,
      );
    }

    const valid = await verifyOtpDigest(
      storedDigest,
      OTP_PURPOSE,
      newEmail,
      emailCode,
    );

    if (!valid) {
      const next = attempts + 1;
      await kv.put(attemptsKey, String(next), {
        expirationTtl: OTP_TTL_SECONDS,
      });

      if (next >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);
        return json(
          { ok: false, error: "EMAIL_CODE_TOO_MANY_ATTEMPTS" },
          429,
          { "Retry-After": String(OTP_TTL_SECONDS) },
          origin,
        );
      }

      return json(
        {
          ok: false,
          error: "INVALID_EMAIL_CODE",
          attemptsRemaining: MAX_ATTEMPTS - next,
        },
        400,
        {},
        origin,
      );
    }

    // 验证通过，立即消费验证码
    await kv.delete(codeKey);
    await kv.delete(attemptsKey);
  } catch (error) {
    console.error("OTP verify error", error);
    return json(
      { ok: false, error: "EMAIL_VERIFICATION_SERVICE_ERROR" },
      500,
      {},
      origin,
    );
  }

  // 更新数据库
  try {
    // 再次检查新邮箱唯一性（防止并发）
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE lower(email) = ?1 AND id != ?2 LIMIT 1",
    )
      .bind(newEmail, auth.session.userId)
      .first<{ id: string }>();

    if (existing) {
      return json({ ok: false, error: "EMAIL_ALREADY_USED" }, 409, {}, origin);
    }

    const result = await env.DB.prepare(
      `UPDATE users
       SET email = ?1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
      .bind(newEmail, auth.session.userId)
      .run();

    if (!result.success) {
      throw new Error("Email update failed");
    }

    return json({ ok: true, email: newEmail }, 200, {}, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("UNIQUE constraint failed: users.email")) {
      return json({ ok: false, error: "EMAIL_ALREADY_USED" }, 409, {}, origin);
    }

    console.error("Email change DB error", error);
    return json({ ok: false, error: "EMAIL_CHANGE_FAILED" }, 500, {}, origin);
  }
};
