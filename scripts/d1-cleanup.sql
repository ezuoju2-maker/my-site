-- D1 数据保留策略
-- 由 .github/workflows/d1-cleanup.yml 每日 UTC 4 点执行
-- 删除超过保留期的数据，防止 D1 存储无限增长

-- 1. user_login_logs: 保留最近 30 天
DELETE FROM user_login_logs
WHERE created_at < datetime('now', '-30 days');

-- 2. admin_audit_logs: 保留最近 180 天
DELETE FROM admin_audit_logs
WHERE created_at < datetime('now', '-180 days');

-- 3. usage_logs: 保留最近 90 天
DELETE FROM usage_logs
WHERE day < date('now', '-90 days');

-- 4. sessions: 删除已过期的 session
-- 注意：expires_at 存的是 ISO 8601 字符串（例 2026-09-12T15:30:00.000Z）
-- 必须用 datetime() 包裹才能正确比较，直接字符串比较会因 'T' vs ' ' 而出错
DELETE FROM sessions
WHERE datetime(expires_at) <= datetime('now');
