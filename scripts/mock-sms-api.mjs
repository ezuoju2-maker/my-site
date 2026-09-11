/**
 * 模拟接码平台 API
 * 用于本地和 CI 空跑测试，不消耗真实额度。
 * 接入真实 API 后，此文件可以删除或保留作为本地开发用。
 */

const MOCK_SERVICES = [
  { slug: "disneyplus", name: "Disney+", brand: "113CCF" },
  { slug: "bestbuy", name: "Best Buy", brand: "0046BE" },
  { slug: "sephora", name: "Sephora", brand: "000000" },
  { slug: "priceline", name: "Priceline", brand: "000000" },
  { slug: "kohls", name: "Kohl's", brand: "000000" },
  { slug: "oldnavy", name: "Old Navy", brand: "000000" },
];

export async function fetchMockServices() {
  await new Promise((r) => setTimeout(r, 100));
  return MOCK_SERVICES;
}
