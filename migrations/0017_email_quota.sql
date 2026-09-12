-- 邮件 provider 每日配额记录
-- 用于多 provider 自动降级：某 provider 用满当日配额后自动切下一个
CREATE TABLE IF NOT EXISTS email_quota_daily (
  day TEXT NOT NULL,
  provider TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (day, provider)
);
CREATE INDEX IF NOT EXISTS idx_email_quota_day ON email_quota_daily(day);
