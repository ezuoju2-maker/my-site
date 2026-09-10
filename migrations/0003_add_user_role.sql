-- 0003_add_user_role.sql
--
-- 为 users 表添加 role 字段，用于区分普通用户和管理员。
-- 默认 'user'，管理员通过 SQL 手动提升。
--
-- 未来扩展：可以新增 'agent'（代理商）、'moderator'（客服）等值，
-- 应用层通过 src/lib/roles.ts 校验合法性。

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
