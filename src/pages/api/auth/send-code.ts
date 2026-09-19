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
import { getCooldownRemaining, setCooldown, getCount, bumpCounter } from "../../../lib/rate-limit";
import { sendEmail } from "../../../lib/email";

/**
 * 带指数退避和抖动的重试工具
 * 用于处理 D1 等外部服务可能出现的瞬时错误
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[retry] attempt ${attempt}/${maxAttempts} failed: ${msg}`);

      if (attempt < maxAttempts) {
        // 指数退避 + 抖动：200ms, 400ms, 800ms (± 50ms 抖动)
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

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
    getCooldownRemaining(ipCooldownKey),
    getCooldownRemaining(emailCooldownKey),
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

  const dailyCount = await getCount(dailyKey);

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
      // 邮件配额耗尽：写入排队表，配额恢复后自动发送
      try {
        await env.DB.prepare(
          "INSERT INTO registration_queue (id, email, ip_address) VALUES (?1, ?2, ?3)"
        ).bind(
          crypto.randomUUID(),
          email,
          request.headers.get("CF-Connecting-IP") || "unknown"
        ).run();
      } catch (e) {
        console.warn("[send-code] queue insert failed", e);
      }
      return json(
        {
          ok: false,
          error: "EMAIL_QUOTA_EXHAUSTED",
          message: "今日注册邮箱配额已满，已为你加入排队，配额恢复后将自动发送验证码",
          queued: true,
        },
        503,
        { "Retry-After": "3600" },
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
    // 不重置 attemptsKey：防止攻击者通过反复请求 OTP 循环猜测
    await setCooldown(ipCooldownKey, RESEND_COOLDOWN_SECONDS);
    await setCooldown(emailCooldownKey, RESEND_COOLDOWN_SECONDS);
    await retryWithBackoff(() => bumpCounter(dailyKey, 86400), 3);
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
