-- 0019_rate_limits.sql
--
-- 把限流计数从 KV 迁到 D1。
--
-- 背景：KV 免费额度 1000 写/天，限流每次请求都写 KV。
--       D1 免费额度 10 万写/天，容量足够。
--
-- 用法：每条限流规则 = 一行 (key, count, expires_at)
--   key:   "login-attempts:1.2.3.4:alice" 之类
--   count: 当前计数
--   expires_at: 窗口过期时间（ISO 8601 UTC）
--
-- 关键设计：
--   - key 做主键，UPSERT 原子累加
--   - 到达 expires_at 后，UPSERT 会重置 count=1（滑动窗口）
--   - daily cron 清理过期行

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires
  ON rate_limits(expires_at);
