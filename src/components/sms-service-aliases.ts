/**
 * 服务搜索别名数据
 *
 * 只给主流服务补充中文名 / 拼音 / 别名，其余服务用 slug + 英文名搜索。
 * 新增字段说明：
 *   zh     中文名
 *   py     拼音全拼（小写、无空格，用于支持全拼搜索）
 *   pyi    拼音首字母缩写（用于支持首字母搜索）
 *   aliases 其他常见写法 / 缩写
 */

export type ServiceAlias = {
  zh?: string;
  py?: string;
  pyi?: string;
  aliases?: string[];
};

export const SERVICE_ALIASES: Record<string, ServiceAlias> = {
  // ===== 中国平台 =====
  qq: { zh: "QQ", py: "qq", pyi: "qq" },
  sinaweibo: { zh: "微博", py: "weibo", pyi: "wb" },
  douyin: { zh: "抖音", py: "douyin", pyi: "dy", aliases: ["douyin", "tiktokcn"] },
  xiaohongshu: { zh: "小红书", py: "xiaohongshu", pyi: "xhs", aliases: ["rednote", "xhs"] },
  bilibili: { zh: "哔哩哔哩", py: "bilibili", pyi: "bili", aliases: ["b站", "bzhan", "bilibili"] },
  baidu: { zh: "百度", py: "baidu", pyi: "bd" },
  zhihu: { zh: "知乎", py: "zhihu", pyi: "zh" },
  douban: { zh: "豆瓣", py: "douban", pyi: "db" },
  taobao: { zh: "淘宝", py: "taobao", pyi: "tb" },
  tmall: { zh: "天猫", py: "tianmao", pyi: "tm" },
  jd: { zh: "京东", py: "jingdong", pyi: "jd" },
  pinduoduo: { zh: "拼多多", py: "pinduoduo", pyi: "pdd" },
  alipay: { zh: "支付宝", py: "zhifubao", pyi: "zfb" },
  meituan: { zh: "美团", py: "meituan", pyi: "mt" },
  didi: { zh: "滴滴", py: "didi", pyi: "dd" },
  neteasecloudmusic: { zh: "网易云音乐", py: "wangyiyunyinyue", pyi: "wyyyy", aliases: ["wy"] },
  iqiyi: { zh: "爱奇艺", py: "aiqiyi", pyi: "aqy" },
  dingtalk: { zh: "钉钉", py: "dingding", pyi: "dd" },
  alibabacloud: { zh: "阿里云", py: "aliyun", pyi: "aly" },
  tencentcloud: { zh: "腾讯云", py: "tengxunyun", pyi: "txy" },

  // ===== 国际社交 =====
  whatsapp: { zh: "瓦次艾普", py: "whatsapp", pyi: "wa", aliases: ["wa"] },
  telegram: { zh: "电报", py: "dianbao", pyi: "tg", aliases: ["tg"] },
  wechat: { zh: "微信", py: "weixin", pyi: "wx", aliases: ["wx", "weixin"] },
  facebook: { zh: "脸书", py: "lianshu", pyi: "fb", aliases: ["fb", "meta"] },
  instagram: { zh: "Instagram", py: "instagram", pyi: "ig", aliases: ["ig", "ins"] },
  x: { zh: "推特", py: "tuite", pyi: "tw", aliases: ["twitter", "twitterx"] },
  youtube: { zh: "油管", py: "youtube", pyi: "yt", aliases: ["yt"] },
  snapchat: { zh: "阅后即焚", py: "yuehoujifen", pyi: "snap", aliases: ["snap"] },
  reddit: { zh: "红迪", py: "hongdi", pyi: "rd" },
  linkedin: { zh: "领英", py: "lingying", pyi: "in", aliases: ["li"] },
  pinterest: { zh: "拼趣", py: "pinqu", pyi: "pin", aliases: ["pin"] },
  discord: { zh: "Discord", py: "discord", pyi: "dc", aliases: ["dc"] },
  line: { zh: "莱恩", py: "line", pyi: "line" },
  viber: { zh: "Viber", py: "viber", pyi: "viber" },
  signal: { zh: "Signal", py: "signal", pyi: "sig" },
  skype: { zh: "Skype", py: "skype", pyi: "skp" },
  zoom: { zh: "Zoom", py: "zoom", pyi: "zm" },
  slack: { zh: "Slack", py: "slack", pyi: "slk" },
  messenger: { zh: "Messenger", py: "messenger", pyi: "msg", aliases: ["fbmsg"] },

  // ===== 国际大厂 =====
  google: { zh: "谷歌", py: "guge", pyi: "gg" },
  openai: { zh: "ChatGPT", py: "chatgpt", pyi: "gpt", aliases: ["chatgpt", "gpt", "openai"] },
  anthropic: { zh: "Claude", py: "claude", pyi: "claude", aliases: ["claude"] },
  googlegemini: { zh: "Gemini", py: "gemini", pyi: "gemini", aliases: ["gemini"] },
  xai: { zh: "Grok", py: "grok", pyi: "grok", aliases: ["grok"] },
  deepseek: { zh: "深度求索", py: "shendusousuo", pyi: "ds", aliases: ["ds"] },
  github: { zh: "GitHub", py: "github", pyi: "gh", aliases: ["gh"] },
  gitlab: { zh: "GitLab", py: "gitlab", pyi: "gl" },
  steam: { zh: "蒸汽", py: "zhengqi", pyi: "steam" },
  twitch: { zh: "老鼠台", py: "laoshutai", pyi: "tw", aliases: ["tu"] },
  amazon: { zh: "亚马逊", py: "yamaxun", pyi: "amz", aliases: ["amz"] },
  ebay: { zh: "易趣", py: "yiqu", pyi: "ebay" },
  paypal: { zh: "贝宝", py: "beibao", pyi: "pp" },
  netflix: { zh: "网飞", py: "wangfei", pyi: "nf", aliases: ["nf"] },
  spotify: { zh: "声田", py: "shengtian", pyi: "sp" },
  tiktok: { zh: "抖音国际版", py: "douyinguojiban", pyi: "tt", aliases: ["tt"] },
  uber: { zh: "优步", py: "youbu", pyi: "uber" },
  airbnb: { zh: "爱彼迎", py: "aibiying", pyi: "airbnb" },

  // ===== 加密货币 / 金融 =====
  binance: { zh: "币安", py: "bian", pyi: "bn", aliases: ["bn"] },
  okx: { zh: "欧易", py: "ouyi", pyi: "okx", aliases: ["欧易"] },
  coinbase: { zh: "Coinbase", py: "coinbase", pyi: "cb", aliases: ["cb"] },
  wise: { zh: "Wise", py: "wise", pyi: "wise" },
  revolut: { zh: "Revolut", py: "revolut", pyi: "rv" },

  // ===== 日韩 =====
  rakuten: { zh: "乐天", py: "letian", pyi: "lt" },
  mercari: { zh: "煤炉", py: "meilu", pyi: "mrc" },
  paypay: { zh: "PayPay", py: "paypay", pyi: "pp" },
  yahoojapan: { zh: "雅虎日本", py: "yahuriben", pyi: "yahoo" },
  naver: { zh: "Naver", py: "naver", pyi: "nv" },
  coupang: { zh: "Coupang", py: "coupang", pyi: "cp" },
  toss: { zh: "Toss", py: "toss", pyi: "toss" },
  weverse: { zh: "Weverse", py: "weverse", pyi: "wv" },

  // ===== 东南亚 =====
  shopee: { zh: "虾皮", py: "xiapi", pyi: "sp", aliases: ["sp"] },
  lazada: { zh: "来赞达", py: "laizanda", pyi: "lzd" },
  grab: { zh: "Grab", py: "grab", pyi: "grab", aliases: ["grab打车"] },
  gojek: { zh: "Gojek", py: "gojek", pyi: "gj" },
  tokopedia: { zh: "Tokopedia", py: "tokopedia", pyi: "tkp" },
  zalo: { zh: "Zalo", py: "zalo", pyi: "zalo" },
  gcash: { zh: "GCash", py: "gcash", pyi: "gc" },

  // ===== 其他 =====
  booking: { zh: "Booking", py: "booking", pyi: "bk", aliases: ["booking.com", "缤客"] },
  agoda: { zh: "安可达", py: "ankeda", pyi: "agoda" },
  trip: { zh: "携程国际", py: "xiechengguoji", pyi: "trip" },
  expedia: { zh: "Expedia", py: "expedia", pyi: "exp" },
  cursor: { zh: "Cursor", py: "cursor", pyi: "csr" },
  replit: { zh: "Replit", py: "replit", pyi: "rpl" },
  notion: { zh: "Notion", py: "notion", pyi: "nt" },
  figma: { zh: "Figma", py: "figma", pyi: "fg" },
  canva: { zh: "Canva", py: "canva", pyi: "cv" },
  trello: { zh: "Trello", py: "trello", pyi: "tr" },
  udemy: { zh: "Udemy", py: "udemy", pyi: "ud" },
  duolingo: { zh: "多邻国", py: "duolingguo", pyi: "dlg" },
};

/**
 * 判断一个服务是否匹配查询词。
 *
 * 匹配字段（全部小写、包含匹配）：
 *   slug / name / zh / py / pyi / aliases
 *
 * 例：
 *   "t"        → 所有含 t 的服务（含 name、slug）
 *   "微信"      → wechat（通过 zh）
 *   "weixin"   → wechat（通过 py）
 *   "wx"       → wechat（通过 pyi）
 *   "tg"       → telegram（通过 pyi）
 */
// ============================================================
// 自动搜索键系统（带权重）
// ============================================================

type KeyEntry = { key: string; weight: number };

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s\-_.&+@/()]+/)
    .filter((t) => t.length >= 2);
}

/**
 * 为一个服务生成带权重的搜索键。
 *
 * 权重设计：
 *   slug 完全匹配 → 1000（最高，最精准）
 *   name 完全匹配 → 900
 *   中文名完全匹配 → 850
 *   别名完全匹配   → 800
 *   name 连写     → 700
 *   分词          → 600
 *
 * 前缀匹配减 100，子串匹配减 400。
 */
export function buildSearchKeys(
  slug: string,
  name: string,
  manual?: ServiceAlias,
): KeyEntry[] {
  const entries: KeyEntry[] = [];
  const seen = new Set<string>();

  const add = (key: string, weight: number) => {
    const k = key.toLowerCase().trim();
    if (!k || seen.has(k)) return;
    seen.add(k);
    entries.push({ key: k, weight });
  };

  add(slug, 1000);
  add(name, 900);

  const nameCompact = normalizeText(name);
  if (nameCompact && nameCompact !== name.toLowerCase()) {
    add(nameCompact, 700);
  }

  for (const t of tokenize(name)) add(t, 600);

  if (manual) {
    if (manual.zh) add(manual.zh, 850);
    if (manual.py) add(manual.py, 800);
    if (manual.pyi) add(manual.pyi, 750);
    for (const a of manual.aliases ?? []) add(a, 800);
  }

  return entries;
}

const keyCache = new Map<string, KeyEntry[]>();

function getSearchKeys(slug: string, name: string): KeyEntry[] {
  let keys = keyCache.get(slug);
  if (keys) return keys;
  keys = buildSearchKeys(slug, name, SERVICE_ALIASES[slug]);
  keyCache.set(slug, keys);
  return keys;
}

const POPULAR_HINT = new Set([
  "whatsapp", "telegram", "google", "facebook", "instagram", "tiktok",
  "youtube", "discord", "x", "snapchat", "reddit", "linkedin", "pinterest",
  "wechat", "qq", "steam", "amazon", "paypal", "netflix", "spotify",
  "gmail", "apple", "openai",
]);

/**
 * 打分：返回 0 表示不匹配；否则返回分数，分越高越相关。
 */
export function scoreService(
  slug: string,
  name: string,
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let best = 0;
  for (const { key, weight } of getSearchKeys(slug, name)) {
    if (key === q) {
      best = Math.max(best, weight);
    } else if (key.startsWith(q)) {
      best = Math.max(best, weight - 100);
    } else if (key.includes(q)) {
      best = Math.max(best, weight - 400);
    }
  }

  if (best > 0 && POPULAR_HINT.has(slug)) best += 30;
  return best;
}

/**
 * 兼容旧接口。内部用 scoreService。
 */
export function matchService(
  slug: string,
  name: string,
  query: string,
): boolean {
  return scoreService(slug, name, query) > 0;
}
