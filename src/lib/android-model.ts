// Android / HarmonyOS 设备识别
// 与 iOS 不同：Android UA 里通常直接包含型号代号，可精确映射

export const ANDROID_DETECTOR_VERSION = "1.0.0";

// ========== 品牌前缀表 ==========
type BrandRule = { re: RegExp; brand: string; country?: string };

const BRAND_RULES: BrandRule[] = [
  { re: /^SM-|^GT-|^SGH-|^SCH-|^SHV-|^SPH-/, brand: "三星" },
  { re: /^Pixel|^sdk_gphone/, brand: "Google" },
  { re: /^Redmi|^22\d{11,}|^23\d{11,}.*U$/, brand: "Redmi" },
  { re: /^POCO/, brand: "POCO" },
  { re: /^M2\d{3}|^2\d{11,}[A-Z]{0,3}$/, brand: "小米" }, // 兜底数字编号
  { re: /^ALN-|^ELE-|^VOG-|^LYA-|^NOH-|^JAD-|^ANA-|^TAS-|^ANG-|^HUAWEI|^BAL-|^CET-|^FRL-|^MAR-|^MAG-|^LIO-|^NOP-|^ADY-|^GOT-/, brand: "华为" },
  { re: /^ANY-|^FNE-|^REA-|^RKY-|^BVL-|^ELI-|^FCP-|^MAG-|^VER-|^HONOR|^CRT-/, brand: "荣耀" },
  { re: /^V\d{4}|^PD\d|^vivo/, brand: "vivo" },
  { re: /^CPH|^PDR|^PGT|^PFJ|^PFM|^PGU|^PCL|^PCH|^PHQ|^PHW|^PBEM|^PBDM|^PGW|^PGX|^OPPO/, brand: "OPPO" },
  { re: /^RMX|^realme/, brand: "realme" },
  { re: /^NE\d|^IN\d|^LE\d|^KB\d|^ONEPLUS/, brand: "一加" },
  { re: /^XT\d|^motorola|^Moto/, brand: "摩托罗拉" },
  { re: /^TA-|^Nokia/, brand: "诺基亚" },
  { re: /^XQ-|^Sony|^H81/, brand: "索尼" },
  { re: /^A06[0-9]/, brand: "Nothing" },
  { re: /^Lenovo|^TB-|^YT/, brand: "联想" },
  { re: /^ASUS|^ZS\d|^ZD\d/, brand: "华硕" },
  { re: /^Nova|^Nova-/, brand: "华为 nova" },
  { re: /^LGE|^LG-/, brand: "LG" },
  { re: /^HTC/, brand: "HTC" },
  { re: /^ZTE|^ZTE-/, brand: "中兴" },
  { re: /^M6|^M7|^M8|^M9|^m\d/, brand: "魅族" },
  { re: /^TECNO|^Infinix|^itel/, brand: "传音系" },
];

// ========== 型号 → 商业名（精选旗舰 + 热门机型）==========
const COMMERCIAL_NAME: Record<string, string> = {
  // ===== 三星 Galaxy S =====
  "SM-S928B": "Galaxy S24 Ultra", "SM-S9280": "Galaxy S24 Ultra", "SM-S928U": "Galaxy S24 Ultra", "SM-S928N": "Galaxy S24 Ultra",
  "SM-S921B": "Galaxy S24", "SM-S9210": "Galaxy S24", "SM-S921U": "Galaxy S24",
  "SM-S926B": "Galaxy S24+", "SM-S9260": "Galaxy S24+",
  "SM-S918B": "Galaxy S23 Ultra", "SM-S9180": "Galaxy S23 Ultra", "SM-S918U": "Galaxy S23 Ultra",
  "SM-S911B": "Galaxy S23", "SM-S9110": "Galaxy S23",
  "SM-S916B": "Galaxy S23+",
  "SM-S908B": "Galaxy S22 Ultra", "SM-S9080": "Galaxy S22 Ultra",
  "SM-S901B": "Galaxy S22", "SM-S9010": "Galaxy S22",
  "SM-G998B": "Galaxy S21 Ultra", "SM-G9980": "Galaxy S21 Ultra",
  "SM-G991B": "Galaxy S21", "SM-G9910": "Galaxy S21",
  "SM-G996B": "Galaxy S21+",
  // ===== 三星 Galaxy Z =====
  "SM-F956B": "Galaxy Z Fold6", "SM-F9560": "Galaxy Z Fold6", "SM-F956U": "Galaxy Z Fold6",
  "SM-F946B": "Galaxy Z Fold5", "SM-F9460": "Galaxy Z Fold5",
  "SM-F936B": "Galaxy Z Fold4",
  "SM-F926B": "Galaxy Z Fold3",
  "SM-F741B": "Galaxy Z Flip6", "SM-F7410": "Galaxy Z Flip6",
  "SM-F731B": "Galaxy Z Flip5", "SM-F7310": "Galaxy Z Flip5",
  "SM-F721B": "Galaxy Z Flip4",
  "SM-F711B": "Galaxy Z Flip3",
  // ===== 三星 Galaxy Note =====
  "SM-N986B": "Galaxy Note20 Ultra", "SM-N9860": "Galaxy Note20 Ultra",
  "SM-N981B": "Galaxy Note20",
  "SM-N975F": "Galaxy Note10+",
  "SM-N970F": "Galaxy Note10",
  // ===== 三星 Galaxy A =====
  "SM-A556B": "Galaxy A55", "SM-A5560": "Galaxy A55",
  "SM-A546B": "Galaxy A54", "SM-A5460": "Galaxy A54", "SM-A546E": "Galaxy A54",
  "SM-A536B": "Galaxy A53", "SM-A5360": "Galaxy A53",
  "SM-A526B": "Galaxy A52 5G",
  "SM-A356B": "Galaxy A35", "SM-A356E": "Galaxy A35",
  "SM-A346B": "Galaxy A34",
  "SM-A256B": "Galaxy A25",
  "SM-A155F": "Galaxy A15",
  // ===== 三星平板 =====
  "SM-X910": "Galaxy Tab S9 Ultra", "SM-X916B": "Galaxy Tab S9 Ultra",
  "SM-X710": "Galaxy Tab S9", "SM-X716B": "Galaxy Tab S9",
  "SM-X810": "Galaxy Tab S9+", "SM-X816B": "Galaxy Tab S9+",
  "SM-T870": "Galaxy Tab S7", "SM-T875": "Galaxy Tab S7",
  "SM-T970": "Galaxy Tab S7+", "SM-T976B": "Galaxy Tab S7+",
  // ===== 华为 Mate =====
  "ALN-AL00": "Mate 60 Pro", "ALN-AL80": "Mate 60 Pro", "ALN-LX9": "Mate 60 Pro",
  "ALN-AL10": "Mate 60", "ALN-LX1": "Mate 60",
  "MAG-AL00": "Mate 70", "MAG-LX9": "Mate 70",
  "NOH-NX9": "Mate 40 Pro", "NOH-AL00": "Mate 40 Pro",
  "NOP-AN00": "Mate 40 Pro+",
  "LIO-AL00": "Mate 30 Pro", "LIO-L29": "Mate 30 Pro",
  "JAD-AL50": "P50 Pro", "JAD-LX9": "P50 Pro",
  "ANA-AN00": "P40", "ANA-NX9": "P40",
  // ===== 华为 P / Pura =====
  "HBP-AL00": "Pura 70", "HBP-LX9": "Pura 70",
  "ELE-L29": "P30", "ELE-L09": "P30",
  "VOG-L29": "P30 Pro", "VOG-L09": "P30 Pro",
  "MAR-LX1A": "P20 Pro",
  "ADY-LX9": "P50 Pocket",
  "BAL-AL00": "P50 Pocket",
  // ===== 华为 折叠 =====
  "TET-AN00": "Mate X2", "TET-LX9": "Mate X2",
  "PAL-AL00": "Mate X3", "PAL-LX9": "Mate X3",
  "GOT-AL00": "Mate X5",
  // ===== 华为平板 =====
  "AGS3K-W09": "MatePad 10.4", "AGS3K-L09": "MatePad 10.4",
  "MRX-W09": "MatePad 11",
  // ===== 荣耀 =====
  "ANY-AN00": "Magic 6 Pro", "ANY-LX1": "Magic 6 Pro",
  "BVL-AN00": "Magic 5 Pro",
  "FCP-AN00": "Magic 6",
  "REA-AN00": "Magic 5",
  // ===== 小米 =====
  "23127PN0CC": "小米 14", "23127PN0CG": "小米 14",
  "23116PN5BC": "小米 14 Ultra",
  "2211133C": "小米 13", "2211133G": "小米 13",
  "2203129G": "小米 13 Pro",
  "2201123C": "小米 12", "2201123G": "小米 12",
  "2201122G": "小米 12 Pro",
  "2107119DC": "小米 11", "2107119C": "小米 11",
  "M2102K1AC": "小米 11 Ultra",
  "24018RPACC": "小米 15 Pro",
  "24129PN74C": "小米 15",
  "24117RK2CC": "小米 15 Ultra",
  "22127RK46C": "小米 13 Ultra",
  // ===== Redmi =====
  "2312DRA50C": "Redmi K70", "2312DRA50G": "Redmi K70",
  "23013RK75C": "Redmi K60",
  "22081212C": "Redmi K50 Ultra",
  "21121210C": "Redmi K50",
  "21061110AG": "Redmi Note 10 Pro",
  "2201117TY": "Redmi Note 11",
  "22101316UCP": "Redmi Note 12 Turbo",
  "23090RA98C": "Redmi Note 13 Pro",
  "2312DRAABC": "Redmi Turbo 3",
  // ===== POCO =====
  "2311DRK48G": "POCO F6",
  "23049PCD8G": "POCO F5",
  "22021211RG": "POCO F4",
  // ===== OPPO =====
  "CPH2581": "Find X7 Ultra", "CPH2585": "Find X7 Ultra",
  "CPH2565": "Find X7",
  "CPH2521": "Find X6 Pro", "CPH2551": "Find X6",
  "CPH2487": "Find X6",
  "CPH2447": "Find X5 Pro",
  "CPH2305": "Find X5",
  "CPH2173": "Find X3 Pro", "CPH2174": "Find X3 Pro",
  "CPH2451": "Reno 10 Pro", "CPH2525": "Reno 11",
  "CPH2371": "Reno 8 Pro",
  "CPH2185": "Reno 5",
  // ===== vivo =====
  "V2314A": "X100 Pro", "V2309A": "X100",
  "V2227A": "X90 Pro+", "V2219A": "X90 Pro", "V2218A": "X90",
  "V2130A": "X70 Pro+", "V2104": "X70 Pro",
  "V2046A": "X60 Pro+", "V2045A": "X60 Pro", "V2047A": "X60",
  "V2334A": "iQOO 12", "V2307A": "iQOO 11", "V2218A ": "iQOO 11",
  "V2055A": "iQOO 7",
  "V2157A": "S15 Pro", "V2244A": "S16 Pro",
  // ===== 一加 =====
  "NE2210": "OnePlus 10 Pro", "NE2211": "OnePlus 10 Pro",
  "NE2213": "OnePlus 10T",
  "NE2215": "OnePlus 10T",
  "CPH2447 ": "OnePlus 11", "PHB110": "OnePlus 11",
  "CPH2581 ": "OnePlus 12", "PJD110": "OnePlus 12",
  "CPH2573": "OnePlus 12R",
  "NE2210 ": "OnePlus 10 Pro",
  "IN2020": "OnePlus 8 Pro",
  "IN2013": "OnePlus 8",
  "LE2101": "OnePlus 9R",
  "LE2110": "OnePlus 9",
  "LE2120": "OnePlus 9 Pro",
  // ===== 真我 realme =====
  "RMX3823": "realme GT5 Pro",
  "RMX3851": "realme GT5",
  "RMX3560": "realme GT2 Pro",
  "RMX3301": "realme GT2",
  "RMX3031": "realme GT Neo 3",
  "RMX3708": "realme GT Neo 5",
  // ===== Google Pixel =====
  "Pixel 8 Pro": "Pixel 8 Pro",
  "Pixel 8": "Pixel 8",
  "Pixel 7 Pro": "Pixel 7 Pro",
  "Pixel 7": "Pixel 7",
  "Pixel 6 Pro": "Pixel 6 Pro",
  "Pixel 6": "Pixel 6",
  // ===== 摩托罗拉 =====
  "XT2343-1": "Motorola Edge 50",
  "XT2307-2": "Motorola Razr 40 Ultra",
  "XT2245-1": "Motorola Moto G 5G",
};

// ========== 系列识别 ==========
function detectSeries(model: string, brand: string | null): string | null {
  if (!brand) return null;
  if (brand === "三星") {
    if (/^SM-S/.test(model)) return "Galaxy S";
    if (/^SM-N/.test(model)) return "Galaxy Note";
    if (/^SM-F/.test(model)) return "Galaxy Z";
    if (/^SM-A/.test(model)) return "Galaxy A";
    if (/^SM-X|^SM-T/.test(model)) return "Galaxy Tab";
  }
  if (brand === "华为" || brand === "华为 nova") {
    if (/^ALN|^MAG|^NOH|^NOP|^LIO|^TET|^PAL|^GOT/.test(model)) return "Mate";
    if (/^ELE|^VOG|^MAR|^ANA|^JAD|^HBP|^BAL|^ADY/.test(model)) return "P/Pura";
  }
  if (brand === "小米") {
    if (/^M2|^2107|^2201|^2211|^2312|^2401|^2412|^M2007|^M2101|^M2102/.test(model)) return "小米数字";
  }
  if (brand === "Redmi") {
    if (/K\d{2}|K\d{2}/.test(model)) return "Redmi K";
    if (/Note/.test(model)) return "Redmi Note";
  }
  if (brand === "OPPO") {
    if (/^CPH2[0-5]/.test(model)) return "Find/Reno";
  }
  if (brand === "vivo") {
    if (/^V2\d{3}/.test(model)) return "X / iQOO";
  }
  return null;
}

// ========== 形态判定 ==========
function detectFormFactor(ua: string, model: string, brand: string | null): string {
  // 折叠屏
  if (brand === "三星" && /^SM-F/.test(model)) return "折叠屏";
  if (brand === "华为" && /^TET|^PAL|^GOT|^BAL|^ADY/.test(model)) return "折叠屏";
  if (brand === "小米" && /MIX\s*Fold/.test(model)) return "折叠屏";

  // 平板
  if (/iPad/i.test(ua)) return "平板";
  if (brand === "三星" && /^SM-X|^SM-T/.test(model)) return "平板";
  if (brand === "联想" && /^TB-/.test(model)) return "平板";
  if (/Android(?!.*Mobile)/i.test(ua)) return "平板";
  if (/Tablet/i.test(ua)) return "平板";

  if (/Mobile|iPhone|Android/i.test(ua)) return "手机";
  return "未知";
}

// ========== 鸿蒙检测 ==========
function detectHarmony(ua: string): { isHarmony: boolean; isNative: boolean } {
  const isHarmony = /HarmonyOS|HMSCore|OpenHarmony|ArkWeb/i.test(ua);
  const isNative = /OpenHarmony/i.test(ua) && !/Android/i.test(ua);
  return { isHarmony, isNative };
}

// ========== 主入口 ==========
export type AndroidDetection = {
  brand: string | null;
  modelRaw: string | null;
  commercialName: string | null;
  series: string | null;
  formFactor: string;
  osName: string;
  osVersion: string;
  isHarmony: boolean;
  isNativeHarmony: boolean;
  confidence: "高" | "中" | "低";
  displayName: string;
};


// 从浏览器名反推品牌（厂商专属浏览器）
function inferBrandFromBrowser(ua: string): string | null {
  if (/HeyTapBrowser|OppoBrowser|OppoBrowserLite/i.test(ua)) return "OPPO";
  if (/MiuiBrowser|XiaoMi/i.test(ua)) return "小米";
  if (/HuaweiBrowser/i.test(ua)) return "华为";
  if (/VivoBrowser/i.test(ua)) return "vivo";
  if (/HonorBrowser/i.test(ua)) return "荣耀";
  if (/SamsungBrowser/i.test(ua)) return "三星";
  return null;
}

// 物理信号兜底：判定是否移动设备
function isMobileBySignals(screenWidth: number, maxTouchPoints: number): boolean {
  return screenWidth > 0 && screenWidth <= 500 && maxTouchPoints > 0;
}

export function detectAndroidDevice(ua: string, fingerprint?: { screenWidth?: number; maxTouchPoints?: number }): AndroidDetection {
  const { isHarmony, isNative } = detectHarmony(ua);

  // 提取型号（Build/ 之前的 token）
  const modelMatch = ua.match(/Android[^;]*;\s*([^;()]+?)(?:\s+Build|\))/i)
    || ua.match(/;\s*([A-Z0-9][A-Za-z0-9\-_ ]+?)\s+Build/i);
  let modelRaw = modelMatch ? modelMatch[1].trim() : null;

  // 过滤无意义 token
  if (modelRaw && /^(wv|Mobile|HarmonyOS|K)$/i.test(modelRaw)) modelRaw = null;

  // 品牌
  let brand: string | null = null;
  if (modelRaw) {
    for (const r of BRAND_RULES) {
      if (r.re.test(modelRaw)) { brand = r.brand; break; }
    }
  }
  // 鸿蒙兜底
  if (!brand && isHarmony) brand = "华为";
  // 浏览器反推兜底
  if (!brand) brand = inferBrandFromBrowser(ua);

  // 商业名
  const commercialName = modelRaw ? (COMMERCIAL_NAME[modelRaw] ?? null) : null;

  // 系列
  const series = modelRaw ? detectSeries(modelRaw, brand) : null;

  // 形态
  const formFactor = modelRaw ? detectFormFactor(ua, modelRaw, brand) : "手机";

  // 系统
  const androidVer = (ua.match(/Android (\d+(?:\.\d+)?)/) || [])[1] || "";
  const harmonyVer = (ua.match(/HarmonyOS[ /]?(\d+(?:\.\d+)?)/i) || [])[1] || "";
  const openHarmonyVer = (ua.match(/OpenHarmony[ /]?(\d+(?:\.\d+)?)/i) || [])[1] || "";

  let osName = "Android";
  let osVersion = androidVer;
  if (isHarmony && !isNative) {
    osName = "HarmonyOS";
    osVersion = harmonyVer || androidVer;
  }
  if (isNative) {
    osName = "OpenHarmony";
    osVersion = openHarmonyVer;
  }

  // 显示名
  let displayName: string;
  if (commercialName && brand) displayName = `${brand} ${commercialName}`;
  else if (commercialName) displayName = commercialName;
  else if (modelRaw && brand) displayName = `${brand} ${modelRaw}`;
  else if (modelRaw) displayName = modelRaw;
  else if (brand) displayName = brand;
  else if (isNative) displayName = "鸿蒙";
  else displayName = "Android";

  // 置信度
  let confidence: "高" | "中" | "低" = "低";
  if (commercialName) confidence = "高";
  else if (brand && modelRaw) confidence = "中";
  else if (brand) confidence = "低";

  return {
    brand, modelRaw, commercialName, series, formFactor,
    osName, osVersion, isHarmony, isNativeHarmony: isNative,
    confidence, displayName,
  };
}
