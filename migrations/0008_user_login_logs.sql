-- 0008_user_login_logs.sql
--
-- 用户登录历史。
-- 让用户能查看自己的账号最近从哪些设备/IP 登录。
--
-- 隐私设计：
-- - 只存 IP 和 UA 的哈希（HMAC-SHA256，用 OTP_SECRET 做密钥）
-- - 不存原始 IP/UA（避免泄露）
-- - 只保留最近 100 条（应用层清理，暂不实现定时任务）

CREATE TABLE IF NOT EXISTS user_login_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  ua_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_login_logs_user
  ON user_login_logs(user_id, created_at DESC);
