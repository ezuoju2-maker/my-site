import { env } from "cloudflare:workers";

/**
 * Session 存储：D1 为主，兼容 KV（懒迁移）。
 *
 * 背景：KV 免费额度 1000 写/天，容易撞满。
 *       D1 免费额度 10 万写/天，把 session 迁到 D1 一劳永逸。
 *
 * 兼容策略：
 *   - 写：只写 D1（不再写 KV）
 *   - 读：先 D1，找不到再 KV；KV 有就懒迁移到 D1 并删 KV
 *   - 删：D1 + KV 都删（清理旧数据）
 *
 * 现有在线用户不会被踢：他们的 session 还在 KV，首次访问自动迁到 D1。
 */

export type StoredSession = {
  userId: string;
  username: string;
  sessionVersion: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

export function isValidSessionToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

/**
 * 创建新 session（只写 D1）。
 * ttlSeconds：剩余秒数。0 或负值视为不过期（不建议）。
 */
export async function createSessionRecord(
  userId: string,
  username: string,
  sessionVersion: number,
  ttlSeconds: number,
): Promise<string> {
  const db = env.DB;
  if (!db) throw new Error("D1 binding (DB) is not configured");

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO sessions (token, user_id, username, session_version, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(token, userId, username, sessionVersion, expiresAt)
    .run();

  return token;
}

/**
 * 读 session（D1 优先，KV 兜底 + 懒迁移）。
 * 返回 null 表示无有效 session。
 */
export async function getSessionRecord(
  token: string,
): Promise<StoredSession | null> {
  const db = env.DB;
  if (!db) throw new Error("D1 binding (DB) is not configured");

  // 1) D1
  try {
    const row = await db
      .prepare(
        `SELECT user_id, username, session_version, expires_at
         FROM sessions WHERE token = ?1 LIMIT 1`,
      )
      .bind(token)
      .first<{
        user_id: string;
        username: string;
        session_version: number;
        expires_at: string;
      }>();

    if (row) {
      if (new Date(row.expires_at).getTime() <= Date.now()) {
        // 过期：删掉
        await db
          .prepare("DELETE FROM sessions WHERE token = ?1")
          .bind(token)
          .run();
        return null;
      }
      return {
        userId: row.user_id,
        username: row.username,
        sessionVersion: row.session_version,
      };
    }
  } catch (err) {
    console.error("[session-store] D1 read failed", err);
    // 继续尝试 KV（防止 D1 抖动导致全员掉线）
  }

  // 2) KV 兜底 + 懒迁移
  const kv = env.SESSION;
  if (!kv) return null;

  try {
    const value = await kv.get(`session:${token}`);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<StoredSession>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.sessionVersion !== "number" ||
      !Number.isInteger(parsed.sessionVersion) ||
      parsed.sessionVersion < 1
    ) {
      await kv.delete(`session:${token}`);
      return null;
    }

    // 懒迁移到 D1（默认延长 7 天；如果 KV 快到期也足够）
    try {
      const ttl = 7 * 24 * 60 * 60;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
      await db
        .prepare(
          `INSERT OR IGNORE INTO sessions
           (token, user_id, username, session_version, expires_at)
           VALUES (?1, ?2, ?3, ?4, ?5)`,
        )
        .bind(
          token,
          parsed.userId,
          parsed.username,
          parsed.sessionVersion,
          expiresAt,
        )
        .run();
      await kv.delete(`session:${token}`);
      console.log("[session-store] migrated session from KV to D1");
    } catch (migErr) {
      console.warn("[session-store] lazy migration failed", migErr);
    }

    return {
      userId: parsed.userId,
      username: parsed.username,
      sessionVersion: parsed.sessionVersion,
    };
  } catch (err) {
    console.error("[session-store] KV read failed", err);
    return null;
  }
}

/**
 * 删除 session（D1 + KV 都删）。
 */
export async function deleteSessionRecord(token: string): Promise<void> {
  const db = env.DB;
  const kv = env.SESSION;

  const tasks: Promise<unknown>[] = [];
  if (db) {
    tasks.push(
      db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run(),
    );
  }
  if (kv) {
    tasks.push(kv.delete(`session:${token}`));
  }

  await Promise.allSettled(tasks);
}

/**
 * 清理过期 session。用于 daily cron。
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = env.DB;
  if (!db) return 0;
  try {
    const result = await db
      .prepare("DELETE FROM sessions WHERE expires_at <= ?1")
      .bind(new Date().toISOString())
      .run();
    return result.meta?.changes ?? 0;
  } catch (err) {
    console.error("[session-store] cleanup failed", err);
    return 0;
  }
}
