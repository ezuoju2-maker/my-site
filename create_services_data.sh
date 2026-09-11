#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/my-site

FILE="src/components/sms-services-data.ts"
cp "$FILE" "${FILE}.bak.$(date +%s)" 2>/dev/null || true

echo "=================================================="
echo "【阶段 1】创建服务数据文件（约 340 种服务）"
echo "=================================================="

cat << 'TSX' > "$FILE"
export type ServiceCategory =
  | "social" | "china" | "japan_korea" | "sea" | "south_asia"
  | "tw_hk_mo" | "russia" | "europe" | "north_america" | "latam"
  | "mena_africa" | "oceania" | "ai" | "dev" | "ecommerce"
  | "entertainment" | "gaming" | "travel" | "fintech" | "productivity";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  social: "社交与通讯",
  china: "中国平台",
  japan_korea: "日本 · 韩国",
  sea: "东南亚",
  south_asia: "南亚",
  tw_hk_mo: "港澳台",
  russia: "俄罗斯 · 独联体",
  europe: "欧洲",
  north_america: "北美",
  latam: "拉美",
  mena_africa: "中东 · 非洲",
  oceania: "大洋洲",
  ai: "AI 工具",
  dev: "开发者服务",
  ecommerce: "电商购物",
  entertainment: "影音娱乐",
  gaming: "游戏",
  travel: "出行旅游",
  fintech: "金融科技",
  productivity: "效率工具",
};

export type SmsService = {
  slug: string;
  name: string;
  category: ServiceCategory;
  brand?: string;
};

const s = (
  slug: string,
  name: string,
  category: ServiceCategory,
  brand?: string,
): SmsService => ({ slug, name, category, brand });

export const ALL_SERVICES: SmsService[] = [
  // === 社交与通讯 ===
  s("whatsapp", "WhatsApp", "social", "25D366"),
  s("telegram", "Telegram", "social", "26A5E4"),
  s("facebook", "Facebook", "social", "1877F2"),
  s("instagram", "Instagram", "social", "E1306C"),
  s("x", "X / Twitter", "social", "000000"),
  s("snapchat", "Snapchat", "social", "FFFC00"),
  s("reddit", "Reddit", "social", "FF4500"),
  s("discord", "Discord", "social", "5865F2"),
  s("linkedin", "LinkedIn", "social", "0A66C2"),
  s("pinterest", "Pinterest", "social", "BD081C"),
  s("wechat", "微信", "social", "07C160"),
  s("line", "LINE", "social", "00B900"),
  s("kakaotalk", "KakaoTalk", "social", "FEE500"),
  s("viber", "Viber", "social", "7360F2"),
  s("signal", "Signal", "social", "3A76F0"),
  s("skype", "Skype", "social", "00AFF0"),
  s("zoom", "Zoom", "social", "2D8CFF"),
  s("slack", "Slack", "social", "4A154B"),
  s("messenger", "Messenger", "social", "00B2FF"),
  s("vk", "VK", "social", "0077FF"),

  // === 中国平台 ===
  s("qq", "QQ", "china", "EB192D"),
  s("sinaweibo", "微博", "china", "E6162D"),
  s("douyin", "抖音", "china", "000000"),
  s("xiaohongshu", "小红书", "china", "FF2442"),
  s("bilibili", "哔哩哔哩", "china", "00A1D6"),
  s("baidu", "百度", "china", "2932E1"),
  s("zhihu", "知乎", "china", "0084FF"),
  s("douban", "豆瓣", "china", "2E963D"),
  s("taobao", "淘宝", "china", "FF5000"),
  s("tmall", "天猫", "china", "FF0036"),
  s("jd", "京东", "china", "C81623"),
  s("pinduoduo", "拼多多", "china", "E02E24"),
  s("alipay", "支付宝", "china", "1677FF"),
  s("meituan", "美团", "china", "FFD100"),
  s("didi", "滴滴", "china", "FF7F41"),
  s("neteasecloudmusic", "网易云音乐", "china", "C20C0C"),
  s("iqiyi", "爱奇艺", "china", "00BE06"),
  s("dingtalk", "钉钉", "china", "0089FF"),
  s("alibabacloud", "阿里云", "china", "FF6A00"),
  s("tencentcloud", "腾讯云", "china", "006EFF"),

  // === 日本 · 韩国 ===
  s("rakuten", "乐天 Rakuten", "japan_korea", "BF0000"),
  s("mercari", "Mercari", "japan_korea", "FF0211"),
  s("paypay", "PayPay", "japan_korea", "FF0033"),
  s("yahoojapan", "Yahoo! JAPAN", "japan_korea", "FF0033"),
  s("naver", "Naver", "japan_korea", "03C75A"),
  s("coupang", "Coupang", "japan_korea", "AE0F13"),
  s("toss", "Toss", "japan_korea", "0064FF"),
  s("weverse", "Weverse", "japan_korea", "000000"),

  // === 东南亚 ===
  s("gojek", "Gojek", "sea", "00AA13"),
  s("tokopedia", "Tokopedia", "sea", "42B549"),
  s("shopee", "Shopee", "sea", "EE4D2D"),
  s("lazada", "Lazada", "sea", "0F136D"),
  s("grab", "Grab", "sea", "00B14F"),
  s("zalo", "Zalo", "sea", "0068FF"),
  s("gcash", "GCash", "sea", "0070BA"),
  s("truemoney", "TrueMoney", "sea", "F70000"),

  // === 南亚 ===
  s("phonepe", "PhonePe", "south_asia", "5F259F"),
  s("paytm", "Paytm", "south_asia", "00BAF2"),
  s("flipkart", "Flipkart", "south_asia", "F8E71C"),
  s("myntra", "Myntra", "south_asia", "FF3F6C"),
  s("swiggy", "Swiggy", "south_asia", "FC8019"),
  s("zomato", "Zomato", "south_asia", "E23744"),
  s("ola", "Ola", "south_asia", "1CA754"),
  s("makemytrip", "MakeMyTrip", "south_asia", "E8112D"),
  s("sharechat", "ShareChat", "south_asia", "ED2E67"),

  // === 港澳台 ===
  s("dcard", "Dcard", "tw_hk_mo", "006AA6"),
  s("alipayhk", "AlipayHK", "tw_hk_mo", "1677FF"),
  s("hktvmall", "HKTVmall", "tw_hk_mo", "E60012"),

  // === 俄罗斯 · 独联体 ===
  s("odnoklassniki", "Odnoklassniki", "russia", "EE8208"),
  s("yandex", "Yandex", "russia", "FC3F1D"),
  s("yandexmail", "Yandex Mail", "russia", "FC3F1D"),
  s("wildberries", "Wildberries", "russia", "CB11AB"),
  s("ozon", "Ozon", "russia", "005BFF"),
  s("avito", "Avito", "russia", "97CF26"),

  // === 欧洲 ===
  s("argos", "Argos", "europe", "DA291C"),
  s("tesco", "Tesco", "europe", "00539F"),
  s("asos", "ASOS", "europe", "000000"),
  s("vinted", "Vinted", "europe", "007782"),
  s("bolt", "Bolt", "europe", "34D186"),
  s("deliveroo", "Deliveroo", "europe", "00CCBC"),
  s("justeat", "Just Eat", "europe", "FF8000"),
  s("zalando", "Zalando", "europe", "FF6900"),
  s("n26", "N26", "europe", "48AC98"),
  s("klarna", "Klarna", "europe", "FFB3C7"),
  s("blablacar", "BlaBlaCar", "europe", "00AFF5"),
  s("glovo", "Glovo", "europe", "FFC244"),
  s("allegro", "Allegro", "europe", "FF5A00"),
  s("olx", "OLX", "europe", "002F34"),
  s("bol", "Bol.com", "europe", "0000A0"),
  s("ideal", "iDEAL", "europe", "CC0066"),
  s("marktplaats", "Marktplaats", "europe", "FF4444"),

  // === 北美 ===
  s("cashapp", "Cash App", "north_america", "00D632"),
  s("venmo", "Venmo", "north_america", "3D95CE"),
  s("zelle", "Zelle", "north_america", "6D1ED4"),
  s("walmart", "Walmart", "north_america", "0071CE"),
  s("target", "Target", "north_america", "CC0000"),
  s("costco", "Costco", "north_america", "E31837"),
  s("lyft", "Lyft", "north_america", "FF00BF"),
  s("doordash", "DoorDash", "north_america", "FF3008"),
  s("instacart", "Instacart", "north_america", "43B02A"),
  s("hulu", "Hulu", "north_america", "1CE783"),
  s("peacock", "Peacock", "north_america", "000000"),
  s("homedepot", "Home Depot", "north_america", "F96302"),
  s("lowes", "Lowe's", "north_america", "004990"),

  // === 拉美 ===
  s("mercadolibre", "Mercado Livre", "latam", "FFE600"),
  s("nubank", "Nubank", "latam", "820AD1"),
  s("picpay", "PicPay", "latam", "21C25E"),
  s("ifood", "iFood", "latam", "EA1D2C"),
  s("kwai", "Kwai", "latam", "FF7100"),
  s("mercadopago", "Mercado Pago", "latam", "00B1EA"),
  s("rappi", "Rappi", "latam", "FF441F"),
  s("pedidosya", "PedidosYa", "latam", "FA0050"),
  s("nequi", "Nequi", "latam", "200020"),

  // === 中东 · 非洲 ===
  s("careem", "Careem", "mena_africa", "59B83D"),
  s("noon", "Noon", "mena_africa", "FEEE00"),
  s("talabat", "Talabat", "mena_africa", "FF5A00"),
  s("hungerstation", "HungerStation", "mena_africa", "FF6B00"),
  s("stcpay", "STC Pay", "mena_africa", "4F008C"),
  s("wolt", "Wolt", "mena_africa", "00C2E8"),
  s("jumia", "Jumia", "mena_africa", "F68B1E"),
  s("takealot", "Takealot", "mena_africa", "0073D6"),
  s("opay", "OPay", "mena_africa", "1DCF64"),
  s("palmpay", "PalmPay", "mena_africa", "00C48C"),
  s("mpesa", "M-Pesa", "mena_africa", "4CAF50"),

  // === 大洋洲 ===
  s("kogan", "Kogan", "oceania", "FF6600"),
  s("woolworths", "Woolworths", "oceania", "178841"),
  s("coles", "Coles", "oceania", "E01A2B"),
  s("afterpay", "Afterpay", "oceania", "B2FCE4"),
  s("trademe", "Trade Me", "oceania", "F07A20"),

  // === AI 工具 ===
  s("openai", "ChatGPT / OpenAI", "ai", "412991"),
  s("googlegemini", "Gemini", "ai", "886FBF"),
  s("anthropic", "Claude / Anthropic", "ai", "D4A27F"),
  s("xai", "Grok", "ai", "000000"),
  s("deepseek", "DeepSeek", "ai", "4D6BFE"),
  s("perplexity", "Perplexity", "ai", "20808D"),
  s("poe", "Poe", "ai", "5D5CDE"),
  s("mistralai", "Mistral AI", "ai", "FA520F"),
  s("midjourney", "Midjourney", "ai", "000000"),
  s("leonardoai", "Leonardo AI", "ai", "6E54FF"),
  s("runway", "Runway", "ai", "000000"),
  s("elevenlabs", "ElevenLabs", "ai", "000000"),
  s("suno", "Suno", "ai", "000000"),
  s("characterai", "Character.AI", "ai", "C5A3FF"),
  s("replika", "Replika", "ai", "F5A5DC"),

  // === 开发者服务 ===
  s("github", "GitHub", "dev", "181717"),
  s("gitlab", "GitLab", "dev", "FC6D26"),
  s("bitbucket", "Bitbucket", "dev", "0052CC"),
  s("stackoverflow", "Stack Overflow", "dev", "F58025"),
  s("postman", "Postman", "dev", "FF6C37"),
  s("docker", "Docker", "dev", "2496ED"),
  s("cloudflare", "Cloudflare", "dev", "F38020"),
  s("vercel", "Vercel", "dev", "000000"),
  s("netlify", "Netlify", "dev", "00C7B7"),
  s("digitalocean", "DigitalOcean", "dev", "0080FF"),
  s("vultr", "Vultr", "dev", "007BFC"),
  s("hetzner", "Hetzner", "dev", "D50C2D"),
  s("railway", "Railway", "dev", "0B0D0E"),
  s("render", "Render", "dev", "46E3B7"),
  s("supabase", "Supabase", "dev", "3ECF8E"),
  s("firebase", "Firebase", "dev", "FFCA28"),
  s("mongodb", "MongoDB", "dev", "47A248"),
  s("neon", "Neon", "dev", "00E599"),
  s("zapier", "Zapier", "dev", "FF4A00"),
  s("make", "Make", "dev", "6D00CC"),
  s("n8n", "n8n", "dev", "EA4B71"),
  s("twilio", "Twilio", "dev", "F22F46"),
  s("sendgrid", "SendGrid", "dev", "1A82E2"),
  s("cursor", "Cursor", "dev", "000000"),
  s("replit", "Replit", "dev", "F26207"),
  s("npm", "npm", "dev", "CB3837"),

  // === 电商购物 ===
  s("amazon", "Amazon", "ecommerce", "FF9900"),
  s("ebay", "eBay", "ecommerce", "E53238"),
  s("etsy", "Etsy", "ecommerce", "F16521"),
  s("shopify", "Shopify", "ecommerce", "7AB55C"),
  s("paypal", "PayPal", "ecommerce", "003087"),
  s("stripe", "Stripe", "ecommerce", "008CDD"),
  s("payoneer", "Payoneer", "ecommerce", "FF4800"),
  s("skrill", "Skrill", "ecommerce", "8700A5"),
  s("square", "Square", "ecommerce", "000000"),
  s("temu", "Temu", "ecommerce", "FF6B00"),
  s("shein", "SHEIN", "ecommerce", "000000"),

  // === 影音娱乐 ===
  s("netflix", "Netflix", "entertainment", "E50914"),
  s("spotify", "Spotify", "entertainment", "1DB954"),
  s("youtube", "YouTube", "entertainment", "FF0000"),
  s("twitch", "Twitch", "entertainment", "9146FF"),
  s("soundcloud", "SoundCloud", "entertainment", "FF5500"),
  s("deezer", "Deezer", "entertainment", "FEAA2D"),
  s("tidal", "Tidal", "entertainment", "000000"),
  s("vimeo", "Vimeo", "entertainment", "1AB7EA"),
  s("dailymotion", "Dailymotion", "entertainment", "0066DC"),
  s("crunchyroll", "Crunchyroll", "entertainment", "F47521"),
  s("primevideo", "Prime Video", "entertainment", "1F2E3E"),
  s("appletv", "Apple TV+", "entertainment", "000000"),

  // === 游戏 ===
  s("steam", "Steam", "gaming", "171A21"),
  s("epicgames", "Epic Games", "gaming", "313131"),
  s("ea", "EA", "gaming", "000000"),
  s("ubisoft", "Ubisoft", "gaming", "000000"),
  s("battlenet", "Battle.net", "gaming", "148EFF"),
  s("nintendo", "Nintendo", "gaming", "E60012"),
  s("playstation", "PlayStation", "gaming", "003791"),
  s("roblox", "Roblox", "gaming", "000000"),
  s("minecraft", "Minecraft", "gaming", "62B47A"),
  s("valorant", "Valorant", "gaming", "FF4655"),
  s("freefire", "Free Fire", "gaming", "FF6600"),
  s("xbox", "Xbox", "gaming", "107C10"),

  // === 出行旅游 ===
  s("uber", "Uber", "travel", "000000"),
  s("airbnb", "Airbnb", "travel", "FF5A5F"),
  s("booking", "Booking.com", "travel", "003580"),
  s("agoda", "Agoda", "travel", "5C2D91"),
  s("expedia", "Expedia", "travel", "00355F"),
  s("trip", "Trip.com", "travel", "287DFA"),
  s("tripadvisor", "Tripadvisor", "travel", "00AF87"),
  s("vrbo", "Vrbo", "travel", "245ABC"),

  // === 金融科技 ===
  s("revolut", "Revolut", "fintech", "0075EB"),
  s("wise", "Wise", "fintech", "9FE870"),
  s("monzo", "Monzo", "fintech", "FF4D4D"),
  s("coinbase", "Coinbase", "fintech", "0052FF"),
  s("binance", "Binance", "fintech", "F0B90B"),
  s("kraken", "Kraken", "fintech", "5741D9"),
  s("okx", "OKX", "fintech", "000000"),
  s("bybit", "Bybit", "fintech", "F7A600"),
  s("kucoin", "KuCoin", "fintech", "24AE8F"),

  // === 效率工具 ===
  s("notion", "Notion", "productivity", "000000"),
  s("figma", "Figma", "productivity", "F24E1E"),
  s("canva", "Canva", "productivity", "00C4CC"),
  s("trello", "Trello", "productivity", "0052CC"),
  s("asana", "Asana", "productivity", "F06A6A"),
  s("adobe", "Adobe", "productivity", "FF0000"),
  s("indeed", "Indeed", "productivity", "003A9B"),
  s("glassdoor", "Glassdoor", "productivity", "0CAA41"),
  s("upwork", "Upwork", "productivity", "14A800"),
  s("fiverr", "Fiverr", "productivity", "1DBF73"),
  s("coursera", "Coursera", "productivity", "0056D2"),
  s("udemy", "Udemy", "productivity", "A435F0"),
  s("duolingo", "Duolingo", "productivity", "58CC02"),
  s("khanacademy", "Khan Academy", "productivity", "14BF96"),
  s("quizlet", "Quizlet", "productivity", "4255FF"),
];

export const POPULAR_SLUGS = [
  "whatsapp","telegram","google","facebook","instagram","tiktok",
  "youtube","discord","x","snapchat","reddit","linkedin","pinterest",
  "wechat","qq","steam","amazon","paypal","netflix","spotify",
];

export const POPULAR_SERVICES: SmsService[] = POPULAR_SLUGS
  .map((slug) => ALL_SERVICES.find((s) => s.slug === slug))
  .filter((x): x is SmsService => Boolean(x));

export function groupByCategory(): { category: ServiceCategory; label: string; items: SmsService[] }[] {
  const map = new Map<ServiceCategory, SmsService[]>();
  for (const svc of ALL_SERVICES) {
    if (!map.has(svc.category)) map.set(svc.category, []);
    map.get(svc.category)!.push(svc);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    label: CATEGORY_LABELS[category],
    items,
  }));
}
TSX

echo "OK: 数据文件已写入 $FILE"
echo "文件大小：$(wc -c < "$FILE") bytes"
echo "行数：$(wc -l < "$FILE")"
echo "服务总数：$(grep -c '  s(' "$FILE")"
echo ""
echo "下一步：执行第 2 阶段脚本，更新页面组件。"
