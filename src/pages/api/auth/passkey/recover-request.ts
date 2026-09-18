import { recordUsage } from "../../../../lib/usage-log";
import { checkBudget, recordEmailOp } from "../../../../lib/budget";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createOtpDigest, generateOtp, OTP_TTL_SECONDS } from "../../../../lib/otp";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";
import { getCooldownRemaining, setCooldown, getCount, bumpCounter } from "../../../../lib/rate-limit";
import { sendEmail } from "../../../../lib/email";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_DAILY_LIMIT = 5;
const OTP_PURPOSE = "passkey-recovery";

function json(data: unknown, status = 200, headers: Record<string, string> = {}, origin: string | null = null) {
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

function getClientKey(request: Request, email: string) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return `${ip}:${email}`;
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
  const budget = await checkBudget("send-code");
  if (!budget.ok) return budget.response;
  await recordUsage("send-code").catch(() => {});

  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return json({ ok: false, error: "INVALID_EMAIL" }, 400, {}, origin);

  const kv = env.SESSION;
  if (!kv) return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500, {}, origin);

  const clientKey = getClientKey(request, email);
  const ipCooldownKey = `passkey-recovery-cooldown:${clientKey}`;
  const emailCooldownKey = `passkey-recovery-cooldown-email:${email}`;
  const dailyKey = `passkey-recovery-daily:${email}`;
  const codeKey = `passkey-recovery-code:${email}`;
  const attemptsKey = `passkey-recovery-attempts:${email}`;

  const [ipCooldown, emailCooldown] = await Promise.all([
    getCooldownRemaining(ipCooldownKey),
    getCooldownRemaining(emailCooldownKey),
  ]);

  if (ipCooldown || emailCooldown) {
    return json({ ok: false, error: "TOO_MANY_REQUESTS", retryAfter: RESEND_COOLDOWN_SECONDS }, 429, { "Retry-After": String(RESEND_COOLDOWN_SECONDS) }, origin);
  }

  const dailyCount = await getCount(dailyKey);
  if (dailyCount >= EMAIL_DAILY_LIMIT) {
    return json({ ok: false, error: "TOO_MANY_REQUESTS", retryAfter: 86400 }, 429, { "Retry-After": "86400" }, origin);
  }

  try {
    // 检查邮箱对应的账号是否有 Passkey
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1"
    ).bind(email).first<{ id: string }>();

    let hasPasskey = false;
    if (user) {
      const pk = await env.DB.prepare("SELECT 1 FROM passkeys WHERE user_id = ?1 LIMIT 1").bind(user.id).first();
      hasPasskey = !!pk;
    }

    // 用户不存在 / 无 Passkey：返回相同结果 + 延迟，防止账号枚举
    if (!user || !hasPasskey) {
      await setCooldown(ipCooldownKey, RESEND_COOLDOWN_SECONDS);
      await setCooldown(emailCooldownKey, RESEND_COOLDOWN_SECONDS);
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return json({ ok: true, expiresIn: OTP_TTL_SECONDS, retryAfter: RESEND_COOLDOWN_SECONDS }, 200, {}, origin);
    }

    const code = generateOtp();
    const digest = await createOtpDigest(OTP_PURPOSE, email, code);

    const sendResult = await sendEmail({
      to: email,
      subject: "my-site Passkey 恢复验证码",
      html: `<p>你正在恢复 my-site 账号的 Passkey。</p><p style="font-size:24px;font-weight:bold;">${code}</p><p>验证码 10 分钟内有效。</p><p>如果这不是你本人的操作，请忽略此邮件。</p>`,
      text: `你的 my-site Passkey 恢复验证码是：${code}，10 分钟内有效。`,
    });

    if (!sendResult.ok) {
      if (sendResult.error === "ALL_EMAIL_PROVIDERS_EXHAUSTED") {
        return json({ ok: false, error: "EMAIL_QUOTA_EXHAUSTED" }, 503, { "Retry-After": "86400" }, origin);
      }
      return json({ ok: false, error: "EMAIL_PROVIDER_ERROR" }, 502, {}, origin);
    }

    await kv.put(codeKey, digest, { expirationTtl: OTP_TTL_SECONDS });
    await setCooldown(ipCooldownKey, RESEND_COOLDOWN_SECONDS);
    await setCooldown(emailCooldownKey, RESEND_COOLDOWN_SECONDS);
    await bumpCounter(dailyKey, 86400);

    recordEmailOp().catch(() => {});
    return json({ ok: true, expiresIn: OTP_TTL_SECONDS, retryAfter: RESEND_COOLDOWN_SECONDS }, 200, {}, origin);
  } catch (error) {
    console.error("Passkey recovery request failed", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }
};
