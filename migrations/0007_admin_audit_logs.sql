-- 0007_admin_audit_logs.sql
--
-- Admin 操作审计日志。
-- 记录所有 admin 敏感写操作，用于事后追溯。
--
-- 设计：
-- - 只增不改不删（应用层无删除接口）
-- - actor 冗余存 username（避免 JOIN）
-- - target 冗余存 username（被删除的用户仍可读）
-- - details 存 JSON（灵活扩展）
-- - 索引：按时间倒序查 + 按 actor 查

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_username TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_username TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
  ON admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
  ON admin_audit_logs(actor_id, created_at DESC);
