/**
 * 模拟接码平台的国家列表 API
 * 用于本地和 CI 空跑测试。
 */

const MOCK_COUNTRIES = [
  { id: 999, name: "United States", dial: "+1" },
  { id: 998, name: "United Kingdom", dial: "+44" },
  { id: 997, name: "Kosovo", dial: "+383" },
  { id: 996, name: "Western Sahara", dial: "+212" },
  { id: 995, name: "Northern Cyprus", dial: "+90" },
  { id: 994, name: "Antarctica", dial: "+672" },
  { id: 993, name: "Bouvet Island", dial: "+47" },
];

export async function fetchMockCountries() {
  await new Promise((r) => setTimeout(r, 80));
  return MOCK_COUNTRIES;
}
