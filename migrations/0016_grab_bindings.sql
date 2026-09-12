CREATE TABLE IF NOT EXISTS grab_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_detected_at TEXT,
  last_online_status TEXT,
  last_account_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grab_bindings_user ON grab_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_grab_bindings_account ON grab_bindings(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grab_bindings_unique ON grab_bindings(user_id, account_id);
