ALTER TABLE users
ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_session_version
  ON users(id, session_version);
