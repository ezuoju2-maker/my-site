-- 0005_usage_logs.sql
--
-- 用量记录表：按 (日期, 操作) 聚合计数。
-- 用于 admin 面板展示每个接口的今日次数。
--
-- 设计：
-- - PRIMARY KEY (day, op) 保证每 (日, 操作) 一行
-- - UPSERT 累加 count，无锁无并发问题
-- - day 用 UTC 日期字符串 YYYY-MM-DD
-- - 保留全部历史（约 6 行/天，一年不到 200KB）

CREATE TABLE IF NOT EXISTS usage_logs (
  day TEXT NOT NULL,
  op TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (day, op)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_day ON usage_logs(day);
