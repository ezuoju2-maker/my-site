import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyOtpDigest, OTP_TTL_SECONDS } from "../../../lib/otp";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const OTP_PURPOSE = "email-verification";
const MAX_ATTEMPTS = 5;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: unknown; code?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) return json({ ok: false, error: "INVALID_REQUEST" }, 400);

  const kv = env.SESSION;
  if (!kv) return json({ ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" }, 500);

  const codeKey = `email-code:${email}`;
  const attemptsKey = `email-code-attempts:${email}`;

  try {
    const stored = await kv.get(codeKey);
    if (!stored) return json({ ok: false, error: "EMAIL_CODE_EXPIRED" }, 400);

    const attempts = Number.parseInt((await kv.get(attemptsKey)) ?? "0", 10) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey);
      await kv.delete(attemptsKey);
      return json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, 429);
    }

    const valid = await verifyOtpDigest(stored, OTP_PURPOSE, email, code);
    if (!valid) {
      const next = attempts + 1;
      await kv.put(attemptsKey, String(next), { expirationTtl: OTP_TTL_SECONDS });
      if (next >= MAX_ATTEMPTS) {
        await kv.delete(codeKey);
        await kv.delete(attemptsKey);
        return json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, 429);
      }
      return json({ ok: false, error: "INVALID_CODE", attemptsRemaining: MAX_ATTEMPTS - next }, 400);
    }

    await kv.delete(codeKey);
    await kv.delete(attemptsKey);
    return json({ ok: true });
  } catch (e) {
    console.error("verify-email-code failed", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500);
  }
};
