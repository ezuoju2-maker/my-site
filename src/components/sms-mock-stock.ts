/**
 * Mock 库存数据生成器
 *
 * 用确定性 hash 生成稳定数据：
 *   - 同一 (服务, 国家) 每次刷新价格和库存一致
 *   - 不同服务/国家价格和库存各异
 *
 * 接入真实 API 后，把这个模块替换成 API 调用即可。
 */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function prand(seed: string): number {
  return hash(seed) / 0xffffffff;
}

export const POPULAR_SERVICES = new Set([
  "whatsapp", "telegram", "google", "facebook", "instagram", "tiktok",
  "youtube", "discord", "x", "snapchat", "reddit", "linkedin", "pinterest",
  "wechat", "qq", "steam", "amazon", "paypal", "netflix", "spotify",
  "gmail", "apple", "openai", "tinder", "uber", "airbnb",
]);

const HIGH_PRICE = new Set([
  "us", "gb", "ca", "au", "nz", "de", "fr", "it", "es", "nl", "be", "ch", "at",
  "se", "no", "dk", "fi", "ie", "jp", "kr", "sg", "hk", "tw",
  "ae", "qa", "kw", "sa", "il",
]);

export function priceFor(serviceSlug: string, countryCode: string): number {
  const base = POPULAR_SERVICES.has(serviceSlug) ? 0.15 : 0.05;
  const factor = HIGH_PRICE.has(countryCode) ? 2.5 : 1.0;
  const noise = prand(serviceSlug + ":" + countryCode + ":p");
  const price = base * factor * (0.8 + noise * 1.4);
  return Math.round(price * 100) / 100;
}

export function stockFor(serviceSlug: string, countryCode: string): number {
  const n = prand(serviceSlug + ":" + countryCode + ":s");
  if (POPULAR_SERVICES.has(serviceSlug)) {
    return Math.floor(n * 8000);
  }
  return Math.floor(n * 3000);
}

export function hasCoverage(serviceSlug: string, countryCode: string): boolean {
  const seed = prand(serviceSlug + ":coverage");
  const threshold = 0.4 + seed * 0.35;
  return prand(serviceSlug + ":cov:" + countryCode) < threshold;
}

export type MockStock = {
  countryCode: string;
  price: number;
  stock: number;
};

export function getStockForService(
  slug: string,
  allCountries: { code: string }[],
): MockStock[] {
  const out: MockStock[] = [];
  for (const c of allCountries) {
    if (hasCoverage(slug, c.code)) {
      out.push({
        countryCode: c.code,
        price: priceFor(slug, c.code),
        stock: stockFor(slug, c.code),
      });
    }
  }
  return out;
}

export function getStockForCountry(
  code: string,
  allServices: { slug: string }[],
): MockStock[] {
  const out: MockStock[] = [];
  for (const s of allServices) {
    if (hasCoverage(s.slug, code)) {
      out.push({
        countryCode: code,
        price: priceFor(s.slug, code),
        stock: stockFor(s.slug, code),
      });
    }
  }
  return out;
}
