import { recordUsage } from "../../../../lib/usage-log";
import { checkBudget, recordEmailOp } from "../../../../lib/budget";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../../lib/cors";
import {
  createOtpDigest,
  generateOtp,
  OTP_TTL_SECONDS,
} from "../../../../lib/otp";
import { extractCaptchaToken, verifyCaptcha } from "../../../../lib/captcha";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RESEND_COOLDOWN_SECONDS = 60;
const DAILY_LIMIT = 5;
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
  const budget = await checkBudget("email-send-code");
  if (!budget.ok) return budget.response;
  await recordUsage("email-send-code").catch(() => {});
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { newEmail?: unknown; captchaToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const newEmail = normalizeEmail(body.newEmail);

  if (!isValidEmail(newEmail)) {
    return json({ ok: false, error: "INVALID_EMAIL" }, 400, {}, origin);
  }

  const captchaToken = extractCaptchaToken(body);
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return json({ ok: false, error: "CAPTCHA_FAILED" }, 403, {}, origin);
  }

  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured");
    return json({ ok: false, error: "EMAIL_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);
  }

  const kv = env.SESSION;
  if (!kv) {
    return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);
  }

  // 检查新邮箱是否已被使用
  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE lower(email) = ?1 AND id != ?2 LIMIT 1",
    )
      .bind(newEmail, auth.session.userId)
      .first<{ id: string }>();

    if (existing) {
      return json({ ok: false, error: "EMAIL_ALREADY_USED" }, 409, {}, origin);
    }
  } catch (error) {
    console.error("Email uniqueness check failed", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }

  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipCooldownKey = `email-change-cooldown:${clientIp}:${newEmail}`;
  const emailCooldownKey = `email-change-cooldown-email:${newEmail}`;
  const dailyKey = `email-change-daily:${newEmail}`;
  const codeKey = `email-change-code:${newEmail}`;
  const attemptsKey = `email-change-attempts:${newEmail}`;

  // 冷却检查
  const [ipCooldown, emailCooldown] = await Promise.all([
    kv.get(ipCooldownKey),
    kv.get(emailCooldownKey),
  ]);

  if (ipCooldown || emailCooldown) {
    return json(
      { ok: false, error: "TOO_MANY_REQUESTS", retryAfter: RESEND_COOLDOWN_SECONDS },
      429,
      { "Retry-After": String(RESEND_COOLDOWN_SECONDS) },
      origin,
    );
  }

  // 每日上限
  const dailyCount = Number.parseInt((await kv.get(dailyKey)) ?? "0", 10) || 0;
  if (dailyCount >= DAILY_LIMIT) {
    return json(
      { ok: false, error: "TOO_MANY_REQUESTS", retryAfter: 86400 },
      429,
      { "Retry-After": "86400" },
      origin,
    );
  }

  const code = generateOtp();

  let digest: string;
  try {
    digest = await createOtpDigest(OTP_PURPOSE, newEmail, code);
  } catch (error) {
    console.error("OTP digest creation failed", error);
    return json({ ok: false, error: "OTP_SERVICE_ERROR" }, 500, {}, origin);
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "my-site <noreply@ezuoju.dynv6.net>",
        to: [newEmail],
        subject: "my-site 邮箱修改验证码",
        html: `<p>您的 my-site 邮箱修改验证码是：</p><p style="font-size:24px;font-weight:bold;">${code}</p><p>验证码 10 分钟内有效。</p>`,
        text: `您的 my-site 邮箱修改验证码是：${code}，10 分钟内有效。`,
      }),
    });
  } catch (error) {
    console.error("Resend fetch failed", error);
    return json({ ok: false, error: "EMAIL_PROVIDER_UNREACHABLE" }, 502, {}, origin);
  }

  if (!response.ok) {
    console.error("Resend error", response.status);
    return json({ ok: false, error: "EMAIL_PROVIDER_ERROR" }, 502, {}, origin);
  }

  try {
    await kv.put(codeKey, digest, { expirationTtl: OTP_TTL_SECONDS });
    await kv.delete(attemptsKey);
    await kv.put(ipCooldownKey, "1", { expirationTtl: RESEND_COOLDOWN_SECONDS });
    await kv.put(emailCooldownKey, "1", { expirationTtl: RESEND_COOLDOWN_SECONDS });
    await kv.put(dailyKey, String(dailyCount + 1), { expirationTtl: 86400 });
  } catch (error) {
    console.error("KV write failed", error);
    return json({ ok: false, error: "OTP_SERVICE_ERROR" }, 500, {}, origin);
  }
  recordEmailOp().catch(() => {});

  return json(
    { ok: true, expiresIn: OTP_TTL_SECONDS, retryAfter: RESEND_COOLDOWN_SECONDS },
    200,
    {},
    origin,
  );
};
