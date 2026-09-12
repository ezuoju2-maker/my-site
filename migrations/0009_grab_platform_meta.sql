-- 为 grab_platforms 加品牌色和图标字段
ALTER TABLE grab_platforms ADD COLUMN brand TEXT DEFAULT '737373';
ALTER TABLE grab_platforms ADD COLUMN icon_slug TEXT;

-- 为 grab_accounts 加设备编号字段（上号系统需要）
ALTER TABLE grab_accounts ADD COLUMN device_id TEXT;

-- 更新现有 4 个平台的品牌色和图标
UPDATE grab_platforms SET brand = 'FF2442', icon_slug = 'xiaohongshu' WHERE code = 'xiaohongshu';
UPDATE grab_platforms SET brand = '000000', icon_slug = 'douyin'      WHERE code = 'douyin';
UPDATE grab_platforms SET brand = '00A1D6', icon_slug = 'bilibili'    WHERE code = 'bilibili';
UPDATE grab_platforms SET brand = 'E6162D', icon_slug = 'sinaweibo'   WHERE code = 'weibo';

-- 补充更多平台（默认 disabled，管理员可按需开启）
INSERT OR IGNORE INTO grab_platforms (code, name, brand, icon_slug, enabled) VALUES
  ('wechat', '微信', '07C160', 'wechat', 0),
  ('qq', 'QQ', 'EB192D', 'qq', 0),
  ('discord', 'Discord', '5865F2', 'discord', 0),
  ('google', 'Google', '4285F4', 'google', 0);
