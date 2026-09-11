/**
 * 补充此前遗漏的主流服务。
 * 独立于 sms-services-data.ts，用于快速补充，不动主数据文件。
 */
import type { SmsService } from "./sms-services-data";

const s = (
  slug: string,
  name: string,
  category: SmsService["category"],
  brand: string,
): SmsService => ({ slug, name, category, brand });

export const EXTRA_SERVICES: SmsService[] = [
  // 欧美大厂 & 邮箱
  s("google", "Google", "social", "4285F4"),
  s("gmail", "Gmail", "social", "EA4335"),
  s("apple", "Apple", "social", "000000"),
  s("icloud", "iCloud", "social", "3693F3"),
  s("yahoo", "Yahoo", "social", "6001D2"),
  s("outlook", "Outlook", "social", "0078D4"),
  s("microsoft", "Microsoft", "social", "5E5E5E"),
  s("bing", "Bing", "social", "258FFA"),
  s("protonmail", "Proton Mail", "social", "6D4AFF"),

  // 社交扩展
  s("threads", "Threads", "social", "000000"),
  s("mastodon", "Mastodon", "social", "6364FF"),
  s("bluesky", "Bluesky", "social", "0285FF"),
  s("clubhouse", "Clubhouse", "social", "F0E68C"),
  s("kik", "Kik", "social", "82BC23"),
  s("textnow", "TextNow", "social", "FF6600"),

  // 约会
  s("tinder", "Tinder", "social", "FE3C72"),
  s("bumble", "Bumble", "social", "FFC629"),
  s("badoo", "Badoo", "social", "783BF9"),
  s("okcupid", "OkCupid", "social", "050348"),
  s("grindr", "Grindr", "social", "FDB913"),

  // 内容平台
  s("patreon", "Patreon", "social", "FF424D"),
  s("onlyfans", "OnlyFans", "social", "00AFF0"),
  s("substack", "Substack", "social", "FF6719"),

  // 中国扩展
  s("kuaishou", "快手", "china", "FF6E00"),
  s("tencentvideo", "腾讯视频", "china", "0052D9"),
  s("youku", "优酷", "china", "1F8EFF"),
  s("mangotv", "芒果TV", "china", "FF6A00"),
  s("ximalaya", "喜马拉雅", "china", "FF6A00"),
  s("huya", "虎牙", "china", "FF8903"),
  s("douyu", "斗鱼", "china", "FF5D23"),
  s("sohu", "搜狐", "china", "E60012"),
  s("netease163", "网易", "china", "DD001B"),
  s("pptv", "PPTV", "china", "E60012"),

  // 流媒体扩展
  s("disneyplus", "Disney+", "entertainment", "113CCF"),
  s("hbomax", "HBO Max", "entertainment", "5A2BFF"),
  s("paramountplus", "Paramount+", "entertainment", "0064FF"),
  s("showtime", "Showtime", "entertainment", "FF0000"),

  // 支付扩展
  s("applepay", "Apple Pay", "fintech", "000000"),
  s("googlepay", "Google Pay", "fintech", "4285F4"),
  s("samsungpay", "Samsung Pay", "fintech", "1428A0"),

  // 零售 & 餐饮
  s("starbucks", "Starbucks", "ecommerce", "00704A"),
  s("mcdonalds", "McDonald's", "ecommerce", "FFC72C"),
  s("kfc", "KFC", "ecommerce", "E4002B"),
  s("nike", "Nike", "ecommerce", "111111"),
  s("adidas", "Adidas", "ecommerce", "000000"),

  // 游戏扩展
  s("garena", "Garena", "gaming", "EE4D2D"),
  s("g2a", "G2A", "gaming", "F60A0F"),
];
