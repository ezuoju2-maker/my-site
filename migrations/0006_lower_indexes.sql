-- 0006_lower_indexes.sql
--
-- 关键查询使用 lower(email) / lower(username) 做大小写无关匹配，
-- 但普通 UNIQUE 索引基于列原值，无法命中 lower() 表达式。
--
-- SQLite 自 3.9.0 起支持"表达式索引"：
--   CREATE INDEX ... ON table(lower(column))
-- 加索引后，WHERE lower(col) = ? 会自动走索引。
--
-- 影响范围（5 个查询）：
--   - login.ts            WHERE lower(username) = ? OR lower(email) = ?
--   - forgot-password.ts  WHERE lower(email) = ?
--   - reset-password.ts   WHERE lower(email) = ?
--   - email/change.ts     WHERE lower(email) = ? AND id != ?
--   - email/send-code.ts  WHERE lower(email) = ? AND id != ?
--
-- 预期效果：
--   - 登录等查询从全表扫描 → 索引查找
--   - D1 rows read 显著下降
--   - 用户规模增大后依然保持快速

CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON users(lower(email));

CREATE INDEX IF NOT EXISTS idx_users_username_lower
  ON users(lower(username));
