-- 0018_sessions.sql
--
-- 把登录会话从 KV 迁到 D1。
--
-- 原因：
--   KV 免费额度仅 1000 写/天，登录/登出/验证都写 KV，
--   撞满后 KV 静默失败 → 用户被强制登出 + 限流失效（安全隐患）。
--   D1 免费额度 10 万写/天，容量足够。
--
-- 设计：
--   - token 直接做主键（token 本身已随机不可猜，无需再哈希）
--   - 存 session_version 快照，与 users.session_version 对照
--   - expires_at 用于过期清理（daily cron 删除）
--   - 读时懒迁移：旧 KV session 读到就写进 D1，无需强制全员重登

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  session_version INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON sessions(expires_at);
