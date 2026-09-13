import { env } from "cloudflare:workers";

/**
 * 限流/冷却统一存储（D1）。
 *
 * 替代原先散落各处的 KV 限流逻辑，避免 KV 1000 写/天 撞顶。
 *
 * 语义：
 *   - incrementLimit: 计数型，到 max 返回 limited
 *   - setCooldown:    冷却型，设一个 1 的计数，存在即冷却中
 *   - getRemaining:   返回剩余秒数
 *
 * 原子性：用 SQLite UPSERT + CASE 表达式，在单条 SQL 内完成
 *        "检查是否过期 + 计数/重置"，无竞态。
 */

export type LimitResult = {
  limited: boolean;
  current: number;
};

function db() {
  const d = env.DB;
  if (!d) throw new Error("D1 binding (DB) is not configured");
  return d;
}

function isoIn(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * 计数型限流。
 * - 若当前 key 不存在或已过期 → count=1
 * - 否则 count+1
 * - 返回 { limited: count > max, current: count }
 *   （count > max 表示本次已超限；=max 是"刚好用完最后一次"）
 */
export async function incrementLimit(
  key: string,
  windowSeconds: number,
  max: number,
): Promise<LimitResult> {
  const row = await db()
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at)
       VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime('now') THEN 1
           ELSE rate_limits.count + 1
         END,
         expires_at = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime('now')
             THEN excluded.expires_at
           ELSE rate_limits.expires_at
         END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING count`,
    )
    .bind(key, isoIn(windowSeconds))
    .first<{ count: number }>();

  const current = row?.count ?? 1;
  return { limited: current > max, current };
}

/**
 * 冷却型：把 key 标记为"冷却中"，seconds 秒后自动失效。
 * 已存在时不重置（重复调用不会延长冷却）。
 */
export async function setCooldown(
  key: string,
  seconds: number,
): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at)
       VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime('now') THEN 1
           ELSE rate_limits.count
         END,
         expires_at = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime('now')
             THEN excluded.expires_at
           ELSE rate_limits.expires_at
         END,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(key, isoIn(seconds))
    .run();
}

/**
 * 冷却是否生效。返回剩余秒数（0 表示无冷却）。
 */
/**
 * 纯递增计数（无上限判断），用于每日配额这类需要"记录次数"的场景。
 * 与 incrementLimit 的区别：不判断是否超限，只递增。
 */
export async function bumpCounter(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const row = await db()
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at)
       VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime(now) THEN 1
           ELSE rate_limits.count + 1
         END,
         expires_at = CASE
           WHEN datetime(rate_limits.expires_at) <= datetime(now)
             THEN excluded.expires_at
           ELSE rate_limits.expires_at
         END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING count`,
    )
    .bind(key, isoIn(windowSeconds))
    .first<{ count: number }>();
  return row?.count ?? 1;
}

export async function getCooldownRemaining(key: string): Promise<number> {
  const row = await db()
    .prepare(
      `SELECT datetime(expires_at) AS exp
       FROM rate_limits
       WHERE key = ?1 AND datetime(expires_at) > datetime('now')
       LIMIT 1`,
    )
    .bind(key)
    .first<{ exp: string }>();

  if (!row?.exp) return 0;
  const expMs = new Date(row.exp + "Z").getTime();
  return Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
}

/**
 * 读当前计数（不过期返回，过期返回 0）。用于每日上限这类判断。
 */
export async function getCount(key: string): Promise<number> {
  const row = await db()
    .prepare(
      `SELECT count FROM rate_limits
       WHERE key = ?1 AND datetime(expires_at) > datetime('now')
       LIMIT 1`,
    )
    .bind(key)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/**
 * 删除某个 key（例如登录成功后清零尝试计数）。
 */
export async function resetLimit(key: string): Promise<void> {
  await db().prepare("DELETE FROM rate_limits WHERE key = ?1").bind(key).run();
}

/**
 * 清理已过期的限流行。daily cron 调用。
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const r = await db()
      .prepare("DELETE FROM rate_limits WHERE datetime(expires_at) <= datetime('now')")
      .run();
    return r.meta?.changes ?? 0;
  } catch (err) {
    console.error("[rate-limit] cleanup failed", err);
    return 0;
  }
}
