-- 0004_add_user_profile.sql
--
-- 为 users 表添加个人资料字段：
-- - display_name: 显示昵称（默认等于 username，用户可改）
-- - avatar_url: 头像 URL（可选）
-- - bio: 个人简介（可选）

ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
