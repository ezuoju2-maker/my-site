-- 注册排队表：邮件额度耗尽时，用户留邮箱排队
CREATE TABLE IF NOT EXISTS registration_queue (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_reg_queue_status
  ON registration_queue(status, created_at);
