import { env } from "cloudflare:workers";

export type AuditAction =
  | "role.change"
  | "user.delete"
  | "user.reset_password"
  | "session.revoke"
  | "config.update";

export type AuditEntry = {
  id: string;
  actorId: string;
  actorUsername: string;
  action: AuditAction;
  targetId: string | null;
  targetUsername: string | null;
  details: string | null;
  createdAt: string;
};

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * 记录一次 admin 敏感操作。
 *
 * - 失败静默（不影响主操作）
 * - 调用方应当 fire-and-forget：recordAdminAction(...).catch(() => {})
 * - 或 await（如果需要阻塞直到写入完成）
 */
export async function recordAdminAction(input: {
  actorId: string;
  actorUsername: string;
  action: AuditAction;
  targetId?: string | null;
  targetUsername?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  const db = env.DB;
  if (!db) return;

  const detailsJson = input.details ? JSON.stringify(input.details) : null;

  try {
    await db
      .prepare(
        `INSERT INTO admin_audit_logs
         (id, actor_id, actor_username, action, target_id, target_username, details)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(
        uuid(),
        input.actorId,
        input.actorUsername,
        input.action,
        input.targetId ?? null,
        input.targetUsername ?? null,
        detailsJson,
      )
      .run();
  } catch (error) {
    console.warn("[admin-audit] failed to record", error);
  }
}

/**
 * 查询最近 N 条审计记录（默认 20）。
 */
export async function listAuditLogs(limit = 20): Promise<AuditEntry[]> {
  const db = env.DB;
  if (!db) return [];

  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

  try {
    const result = await db
      .prepare(
        `SELECT id, actor_id, actor_username, action,
                target_id, target_username, details, created_at
         FROM admin_audit_logs
         ORDER BY created_at DESC
         LIMIT ?1`,
      )
      .bind(safeLimit)
      .all<{
        id: string;
        actor_id: string;
        actor_username: string;
        action: string;
        target_id: string | null;
        target_username: string | null;
        details: string | null;
        created_at: string;
      }>();

    return (result.results ?? []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorUsername: r.actor_username,
      action: r.action as AuditAction,
      targetId: r.target_id,
      targetUsername: r.target_username,
      details: r.details,
      createdAt: r.created_at,
    }));
  } catch (error) {
    console.warn("[admin-audit] list failed", error);
    return [];
  }
}
