CREATE TABLE IF NOT EXISTS grab_platforms (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO grab_platforms (code, name) VALUES
  ('xiaohongshu', '小红书'),
  ('douyin', '抖音'),
  ('bilibili', 'B站'),
  ('weibo', '微博');

CREATE TABLE IF NOT EXISTS grab_accounts (
  id TEXT PRIMARY KEY,
  platform_code TEXT NOT NULL,
  nickname TEXT,
  external_id TEXT NOT NULL,
  avatar TEXT,
  credential TEXT NOT NULL,
  authorization_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_grab_accounts_platform ON grab_accounts(platform_code);
CREATE INDEX IF NOT EXISTS idx_grab_accounts_status ON grab_accounts(status);
CREATE INDEX IF NOT EXISTS idx_grab_accounts_expires ON grab_accounts(expires_at);

CREATE TABLE IF NOT EXISTS grab_qr_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  platform_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_by TEXT,
  consumed_by TEXT,
  result_account_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_grab_qr_token ON grab_qr_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_grab_qr_status ON grab_qr_sessions(status);

CREATE TABLE IF NOT EXISTS grab_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  UNIQUE(user_id, account_id)
);
CREATE INDEX IF NOT EXISTS idx_grab_grants_user ON grab_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_grab_grants_account ON grab_grants(account_id);
CREATE INDEX IF NOT EXISTS idx_grab_grants_expires ON grab_grants(expires_at);

CREATE TABLE IF NOT EXISTS grab_audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  platform_code TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grab_audit_created ON grab_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grab_audit_actor ON grab_audit_logs(actor_id);
