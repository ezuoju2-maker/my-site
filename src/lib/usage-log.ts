import { env } from "cloudflare:workers";

export type UsageOp =
  | "login"
  | "register"
  | "send-code"
  | "forgot-password"
  | "reset-password"
  | "email-send-code";

export const USAGE_OPS: UsageOp[] = [
  "login",
  "register",
  "send-code",
  "forgot-password",
  "reset-password",
  "email-send-code",
];

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 记录一次操作。D1 幂等 UPSERT，失败静默不影响业务。
 *
 * 用法：await recordUsage("login");
 * 内部已 try/catch，不会抛异常。
 */
export async function recordUsage(op: UsageOp): Promise<void> {
  const db = env.DB;
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO usage_logs (day, op, count)
         VALUES (?1, ?2, 1)
         ON CONFLICT(day, op)
         DO UPDATE SET count = count + 1,
                       updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(todayUtc(), op)
      .run();
  } catch (error) {
    console.warn("[usage-log] record failed", error);
  }
}

/**
 * 读取某天所有操作的计数。默认今天（UTC）。
 */
export async function getUsageForDay(
  day?: string,
): Promise<Record<string, number>> {
  const db = env.DB;
  if (!db) return {};
  const d = day || todayUtc();
  try {
    const result = await db
      .prepare(`SELECT op, count FROM usage_logs WHERE day = ?1`)
      .bind(d)
      .all<{ op: string; count: number }>();
    const out: Record<string, number> = {};
    for (const row of result.results ?? []) {
      out[row.op] = row.count;
    }
    return out;
  } catch (error) {
    console.warn("[usage-log] query failed", error);
    return {};
  }
}
