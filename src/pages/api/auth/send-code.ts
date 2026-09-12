import { recordUsage } from "../../../lib/usage-log";
import { checkBudget, recordEmailOp } from "../../../lib/budget";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  createOtpDigest,
  generateOtp,
  OTP_TTL_SECONDS,
} from "../../../lib/otp";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  extractCaptchaToken,
  verifyCaptcha,
} from "../../../lib/captcha";
import { sendEmail } from "../../../lib/email";

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_DAILY_LIMIT = 5;
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientKey(request: Request, email: string) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return `${ip}:${email}`;
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
  const budget = await checkBudget("send-code");
  if (!budget.ok) return budget.response;
  await recordUsage("send-code").catch(() => {});
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const captchaToken = extractCaptchaToken(body);
  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return json({ ok: false, error: "CAPTCHA_FAILED" }, 403, {}, origin);
  }

  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "INVALID_EMAIL" }, 400, {}, origin);
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

  const clientKey = getClientKey(request, email);
  const ipCooldownKey = `email-code-cooldown:${clientKey}`;
  const emailCooldownKey = `email-code-cooldown-email:${email}`;
  const dailyKey = `email-code-daily:${email}`;
  const codeKey = `email-code:${email}`;
  const attemptsKey = `email-code-attempts:${email}`;

  const [ipCooldown, emailCooldown] = await Promise.all([
    kv.get(ipCooldownKey),
    kv.get(emailCooldownKey),
  ]);

  if (ipCooldown || emailCooldown) {
    return json(
      {
        ok: false,
        error: "TOO_MANY_REQUESTS",
        retryAfter: RESEND_COOLDOWN_SECONDS,
      },
      429,
      { "Retry-After": String(RESEND_COOLDOWN_SECONDS) },
      origin,
    );
  }

  const dailyCount =
    Number.parseInt((await kv.get(dailyKey)) ?? "0", 10) || 0;

  if (dailyCount >= EMAIL_DAILY_LIMIT) {
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
    digest = await createOtpDigest(OTP_PURPOSE, email, code);
  } catch (error) {
    console.error("OTP digest creation failed", error);
    return json({ ok: false, error: "OTP_SERVICE_ERROR" }, 500, {}, origin);
  }

  const sendResult = await sendEmail({
    to: email,
    subject: "my-site 注册验证码",
    html: `<p>您的 my-site 注册验证码是：</p><p style="font-size:24px;font-weight:bold;">${code}</p><p>验证码 10 分钟内有效。</p>`,
    text: `您的 my-site 注册验证码是：${code}，10 分钟内有效。`,
  });

  if (!sendResult.ok) {
    if (sendResult.error === "ALL_EMAIL_PROVIDERS_EXHAUSTED") {
      return json(
        {
          ok: false,
          error: "EMAIL_QUOTA_EXHAUSTED",
          message: "今日注册邮箱配额已满，请明日再试",
        },
        503,
        { "Retry-After": "86400" },
        origin,
      );
    }
    return json(
      { ok: false, error: "EMAIL_PROVIDER_ERROR" },
      502,
      {},
      origin,
    );
  }

  try {
    await kv.put(codeKey, digest, { expirationTtl: OTP_TTL_SECONDS });
    await kv.delete(attemptsKey);
    await kv.put(ipCooldownKey, "1", {
      expirationTtl: RESEND_COOLDOWN_SECONDS,
    });
    await kv.put(emailCooldownKey, "1", {
      expirationTtl: RESEND_COOLDOWN_SECONDS,
    });
    await kv.put(dailyKey, String(dailyCount + 1), {
      expirationTtl: 86400,
    });
  } catch (error) {
    console.error("OTP KV storage error", error);
    return json({ ok: false, error: "OTP_SERVICE_ERROR" }, 500, {}, origin);
  }

  recordEmailOp().catch(() => {});

  return json(
    {
      ok: true,
      expiresIn: OTP_TTL_SECONDS,
      retryAfter: RESEND_COOLDOWN_SECONDS,
    },
    200,
    {},
    origin,
  );
};
