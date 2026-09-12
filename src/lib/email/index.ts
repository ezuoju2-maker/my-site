import { env } from "cloudflare:workers";
import { PROVIDERS } from "./providers";
import { getTodayCount, incrementTodayCount } from "./quota";
import type { SendEmailArgs, SendResult, QuotaExhaustedResult } from "./types";

export type { SendEmailArgs, SendResult, QuotaExhaustedResult };
export { getTodayAllCounts } from "./quota";

/**
 * 发一封邮件。按优先级依次尝试每个 provider：
 *   1. 跳过没配置 API key 的
 *   2. 跳过今日配额已满的
 *   3. 尝试发送，成功 → 记账 + 返回
 *   4. 失败 → 换下一个 provider
 *
 * 全部失败/满额 → 返回 ALL_EMAIL_PROVIDERS_EXHAUSTED。
 */
export async function sendEmail(
  args: SendEmailArgs,
): Promise<SendResult | QuotaExhaustedResult> {
  const envAny = env as unknown as Record<string, string | undefined>;
  const attempts: string[] = [];

  for (const provider of PROVIDERS) {
    const apiKey = envAny[provider.envKey];
    if (!apiKey) {
      attempts.push(`${provider.id}:no-key`);
      continue;
    }

    if (provider.dailyLimit > 0) {
      const used = await getTodayCount(provider.id);
      if (used >= provider.dailyLimit) {
        attempts.push(`${provider.id}:quota-full(${used}/${provider.dailyLimit})`);
        continue;
      }
    }

    try {
      await provider.send(args, apiKey);
      await incrementTodayCount(provider.id);
      console.log(`[email] sent via ${provider.id}`);
      return { ok: true, providerId: provider.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[email] ${provider.id} failed: ${msg}`);
      attempts.push(`${provider.id}:error(${msg.slice(0, 80)})`);
      // 继续尝试下一个 provider
    }
  }

  console.warn(`[email] all providers exhausted: ${attempts.join(" | ")}`);
  return { ok: false, error: "ALL_EMAIL_PROVIDERS_EXHAUSTED" };
}

/**
 * 兼容旧接口：仅返回 boolean。
 * 旧代码调用 notifyEmailChanged / notifyPasswordChanged 走这个。
 */
export async function sendEmailSimple(args: SendEmailArgs): Promise<boolean> {
  const r = await sendEmail(args);
  return r.ok === true;
}
