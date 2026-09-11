-- D1 数据保留策略
-- 由 .github/workflows/d1-cleanup.yml 每日 UTC 4 点执行
-- 删除超过保留期的日志，防止 D1 存储无限增长

-- 1. user_login_logs: 保留最近 30 天
DELETE FROM user_login_logs
WHERE created_at < datetime('now', '-30 days');

-- 2. admin_audit_logs: 保留最近 180 天
DELETE FROM admin_audit_logs
WHERE created_at < datetime('now', '-180 days');

-- 3. usage_logs: 保留最近 90 天
DELETE FROM usage_logs
WHERE day < date('now', '-90 days');
