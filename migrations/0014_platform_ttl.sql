ALTER TABLE grab_platforms ADD COLUMN ttl_min_seconds INTEGER;
ALTER TABLE grab_platforms ADD COLUMN ttl_max_seconds INTEGER;
ALTER TABLE grab_platforms ADD COLUMN ttl_note TEXT;

-- 抖音：access_token 15天，refresh_token 30天
UPDATE grab_platforms SET ttl_min_seconds = 1296000, ttl_max_seconds = 2592000, ttl_note = 'access_token 15天，refresh_token 30天' WHERE code = 'douyin';

-- 小红书：Cookie 2小时~数天
UPDATE grab_platforms SET ttl_min_seconds = 7200, ttl_max_seconds = 259200, ttl_note = 'Cookie 约2小时至数天' WHERE code = 'xiaohongshu';

-- B站：网页登录 30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '网页登录30天免密' WHERE code = 'bilibili';

-- 微博：7~30天
UPDATE grab_platforms SET ttl_min_seconds = 604800, ttl_max_seconds = 2592000, ttl_note = 'OAuth2.0 约7至30天' WHERE code = 'weibo';

-- 微信：会话密钥 约15天
UPDATE grab_platforms SET ttl_min_seconds = 1296000, ttl_max_seconds = 1296000, ttl_note = '会话密钥约15天' WHERE code = 'wechat';

-- QQ：3个月
UPDATE grab_platforms SET ttl_min_seconds = 7776000, ttl_max_seconds = 7776000, ttl_note = '默认3个月' WHERE code = 'qq';

-- Discord：永久（除非主动撤销）
UPDATE grab_platforms SET ttl_min_seconds = 0, ttl_max_seconds = 0, ttl_note = '永久有效（主动撤销除外）' WHERE code = 'discord';

-- Google：access_token 1小时，refresh_token 永久/7天
UPDATE grab_platforms SET ttl_min_seconds = 3600, ttl_max_seconds = 0, ttl_note = 'access_token 1小时，refresh_token 永久' WHERE code = 'google';

-- Telegram：Cookie 几乎永久
UPDATE grab_platforms SET ttl_min_seconds = 0, ttl_max_seconds = 0, ttl_note = 'Cookie 几乎永久有效' WHERE code = 'telegram';

-- WhatsApp：同 Telegram
UPDATE grab_platforms SET ttl_min_seconds = 0, ttl_max_seconds = 0, ttl_note = 'Cookie 几乎永久有效' WHERE code = 'whatsapp';

-- Twitch：OAuth token 60天
UPDATE grab_platforms SET ttl_min_seconds = 5184000, ttl_max_seconds = 5184000, ttl_note = 'OAuth token 60天' WHERE code = 'twitch';

-- Facebook：短效2小时，长效60天
UPDATE grab_platforms SET ttl_min_seconds = 7200, ttl_max_seconds = 5184000, ttl_note = '短效2小时，长效60天' WHERE code = 'facebook';

-- Instagram：60天
UPDATE grab_platforms SET ttl_min_seconds = 5184000, ttl_max_seconds = 5184000, ttl_note = '长效 token 60天' WHERE code = 'instagram';

-- YouTube：同 Google
UPDATE grab_platforms SET ttl_min_seconds = 3600, ttl_max_seconds = 0, ttl_note = 'access_token 1小时，refresh_token 永久' WHERE code = 'youtube';

-- X (Twitter)：OAuth2 2小时，OAuth1 永久
UPDATE grab_platforms SET ttl_min_seconds = 7200, ttl_max_seconds = 0, ttl_note = 'OAuth2 每2小时过期，OAuth1 永久' WHERE code = 'twitter';

-- Threads：短效1小时，长效60天
UPDATE grab_platforms SET ttl_min_seconds = 3600, ttl_max_seconds = 5184000, ttl_note = '短效1小时，长效60天' WHERE code = 'threads';

-- LinkedIn：access 60天，refresh 365天
UPDATE grab_platforms SET ttl_min_seconds = 5184000, ttl_max_seconds = 31536000, ttl_note = 'access 60天，refresh 365天' WHERE code = 'linkedin';

-- 知乎：约1个月
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = 'Cookie 约1个月' WHERE code = 'zhihu';

-- 快手：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '授权30天' WHERE code = 'kuaishou';

-- 淘宝：7天
UPDATE grab_platforms SET ttl_min_seconds = 604800, ttl_max_seconds = 604800, ttl_note = '网页版7天免登录' WHERE code = 'taobao';

-- 京东：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'jd';

-- 拼多多：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'pinduoduo';

-- 百度：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'baidu';

-- 得物：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'dewu';

-- 小宇宙：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'xiaoyuzhou';

-- 知识星球：30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE code = 'zsxq';

-- 其他平台默认 30天
UPDATE grab_platforms SET ttl_min_seconds = 2592000, ttl_max_seconds = 2592000, ttl_note = '约30天' WHERE ttl_min_seconds IS NULL;
