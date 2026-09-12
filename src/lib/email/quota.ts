import { env } from "cloudflare:workers";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 读某 provider 今日已发送数量。
 */
export async function getTodayCount(providerId: string): Promise<number> {
  const db = env.DB;
  if (!db) return 0;
  try {
    const row = await db
      .prepare("SELECT count FROM email_quota_daily WHERE day = ?1 AND provider = ?2")
      .bind(todayUtc(), providerId)
      .first<{ count: number }>();
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 发送成功后 +1。
 */
export async function incrementTodayCount(providerId: string): Promise<void> {
  const db = env.DB;
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO email_quota_daily (day, provider, count)
         VALUES (?1, ?2, 1)
         ON CONFLICT(day, provider)
         DO UPDATE SET count = count + 1,
                       updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(todayUtc(), providerId)
      .run();
  } catch (e) {
    console.warn("[email-quota] increment failed", e);
  }
}

/**
 * 读所有 provider 今日用量，用于 admin 面板显示。
 */
export async function getTodayAllCounts(): Promise<Record<string, number>> {
  const db = env.DB;
  if (!db) return {};
  try {
    const result = await db
      .prepare("SELECT provider, count FROM email_quota_daily WHERE day = ?1")
      .bind(todayUtc())
      .all<{ provider: string; count: number }>();
    const out: Record<string, number> = {};
    for (const r of result.results ?? []) out[r.provider] = r.count;
    return out;
  } catch {
    return {};
  }
}
