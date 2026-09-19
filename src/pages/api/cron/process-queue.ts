import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createOtpDigest, generateOtp, OTP_TTL_SECONDS } from "../../../lib/otp";
import { sendEmail } from "../../../lib/email";
import { setCooldown } from "../../../lib/rate-limit";

const OTP_PURPOSE = "email-verification";

export const GET: APIRoute = async ({ request }) => {
  // 验证 CRON_SECRET，防止被滥用
  const expected = (env as any).CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = env.DB;
  const kv = env.SESSION;
  if (!db || !kv) {
    return new Response(JSON.stringify({ ok: false, error: "NOT_CONFIGURED" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = await db
    .prepare(
      "SELECT id, email FROM registration_queue WHERE status = 'pending' AND created_at > datetime('now', '-24 hours') ORDER BY created_at ASC LIMIT 10"
    )
    .all<{ id: string; email: string }>();

  let sent = 0;
  for (const row of rows.results ?? []) {
    try {
      const code = generateOtp();
      const digest = await createOtpDigest(OTP_PURPOSE, row.email, code);
      const result = await sendEmail({
        to: row.email,
        subject: "my-site 注册验证码（排队补发）",
        html: `<p>你的 my-site 注册验证码是：</p><p style="font-size:24px;font-weight:bold;">${code}</p><p>10 分钟内有效。</p>`,
        text: `验证码：${code}`,
      });
      if (result.ok) {
        await kv.put(`email-code:${row.email}`, digest, { expirationTtl: OTP_TTL_SECONDS });
        await setCooldown(`email-code-cooldown-email:${row.email}`, 60);
        await db
          .prepare("UPDATE registration_queue SET status = 'sent', processed_at = CURRENT_TIMESTAMP WHERE id = ?1")
          .bind(row.id)
          .run();
        sent++;
      }
    } catch (e) {
      console.warn("[process-queue] failed for", row.email, e);
    }
  }

  // 超过 24 小时未处理的标记为过期
  await db
    .prepare(
      "UPDATE registration_queue SET status = 'expired' WHERE status = 'pending' AND created_at < datetime('now', '-24 hours')"
    )
    .run();

  return new Response(
    JSON.stringify({ ok: true, sent, total: rows.results?.length ?? 0 }),
    { headers: { "Content-Type": "application/json" } }
  );
};
