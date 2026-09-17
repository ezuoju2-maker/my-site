import { UAParser } from "ua-parser-js";
import { randomUUID } from "crypto";

export const DETECTOR_VERSION = "1.3.0";

type Signals = {
  ua?: string; screen?: string; screenWidth?: number; screenHeight?: number;
  viewport?: string; viewportWidth?: number; viewportHeight?: number;
  dpr?: number; orientation?: string | null; maxTouchPoints?: number;
  colorDepth?: number; language?: string; timezone?: string;
  gpu?: string | null;
  safeArea?: { top: number; bottom: number; left: number; right: number };
  device_id?: string;
};

// ============== 浏览器识别（自写，覆盖微信/QQ/快手等）==============
function detectBrowserName(ua: string): string {
  if (/MicroMessenger/i.test(ua)) return "微信";
  if (/QQBrowser/i.test(ua)) return "QQ 浏览器";
  if (/\bMQQBrowser\b/i.test(ua)) return "QQ 浏览器";
  if (/\bKwai\b|Kuaishou/i.test(ua)) return "快手";
  if (/DingTalk/i.test(ua)) return "钉钉";
  if (/Weibo/i.test(ua)) return "微博";
  if (/Aweme|Douyin|ByteLocale/i.test(ua)) return "抖音";
  if (/XHS|xiaohongshu/i.test(ua)) return "小红书";
  if (/Alipay/i.test(ua)) return "支付宝";
  if (/Taobao/i.test(ua)) return "淘宝";
  if (/BiliApp|bili/i.test(ua)) return "哔哩哔哩";
  if (/CriOS\//i.test(ua)) return "Chrome";
  if (/EdgiOS\//i.test(ua)) return "Edge";
  if (/FxiOS\//i.test(ua)) return "Firefox";
  if (/OPiOS\//i.test(ua)) return "Opera";
  if (/\bEdgA?\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/UCBrowser/i.test(ua)) return "UC 浏览器";
  if (/Quark/i.test(ua)) return "夸克";
  if (/HuaweiBrowser/i.test(ua)) return "华为浏览器";
  if (/MiuiBrowser/i.test(ua)) return "小米浏览器";
  if (/VivoBrowser/i.test(ua)) return "vivo 浏览器";
  if (/HeyTapBrowser|OppoBrowser/i.test(ua)) return "OPPO 浏览器";
  if (/SamsungBrowser/i.test(ua)) return "三星浏览器";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\/|Chromium\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "未知";
}

// ============== iOS 版本提取（处理 Apple 从 iOS 26 起的 UA 冻结）==============
function extractOsVersion(ua: string, deviceType: string): string {
  if (deviceType !== "iPhone" && deviceType !== "iPad") return "";

  const osMatch = ua.match(/iPhone OS (\d+)[._](\d+)/i);
  const osVer = osMatch ? `${osMatch[1]}.${osMatch[2]}` : null;

  const safariMatch = ua.match(/Version\/(\d+)[._](\d+)/i);
  const safariVer = safariMatch ? `${safariMatch[1]}.${safariMatch[2]}` : null;

  // Apple 从 iOS 26 起，Safari UA 里的 iPhone OS 被冻结，真实版本只在 Version/
  // 若 Safari 主版本 > OS 主版本 + 3，判定为冻结，用 Safari 版本
  if (osVer && safariVer) {
    const osMajor = parseInt(osVer.split(".")[0], 10);
    const safariMajor = parseInt(safariVer.split(".")[0], 10);
    if (safariMajor > osMajor + 3) return safariVer;
  }
  return osVer || safariVer || "";
}

// ============== Apple 型号提取 ==============
function extractAppleModelFromUA(ua: string): string | null {
  const qq = ua.match(/Device\/Apple\(([^)]+)\)/i);
  if (qq) return qq[1].trim();
  const hw = ua.match(/(iPhone\d+,\d+)/i);
  if (hw) {
    const map: Record<string, string> = {
      "iPhone13,1": "iPhone 12 mini", "iPhone13,2": "iPhone 12", "iPhone13,3": "iPhone 12 Pro", "iPhone13,4": "iPhone 12 Pro Max",
      "iPhone14,4": "iPhone 13 mini", "iPhone14,5": "iPhone 13", "iPhone14,2": "iPhone 13 Pro", "iPhone14,3": "iPhone 13 Pro Max",
      "iPhone14,7": "iPhone 14", "iPhone14,8": "iPhone 14 Plus",
      "iPhone15,2": "iPhone 14 Pro", "iPhone15,3": "iPhone 14 Pro Max",
      "iPhone15,4": "iPhone 15", "iPhone15,5": "iPhone 15 Plus",
      "iPhone16,1": "iPhone 15 Pro", "iPhone16,2": "iPhone 15 Pro Max",
      "iPhone17,1": "iPhone 16 Pro", "iPhone17,2": "iPhone 16 Pro Max", "iPhone17,3": "iPhone 16", "iPhone17,4": "iPhone 16 Plus",
    };
    return map[hw[1]] || hw[1];
  }
  return null;
}

// ============== Android/鸿蒙 品牌识别 ==============
const ANDROID_BRAND_PREFIX: Record<string, string> = {
  SM: "三星", GT: "三星", SGH: "三星", SCH: "三星",
  M: "小米", "2": "小米", Redmi: "红米", POCO: "POCO",
  HM: "小米", MI: "小米",
  V: "vivo", vivo: "vivo", PD: "vivo", VIVO: "vivo",
  CPH: "OPPO", OPPO: "OPPO", PB: "OPPO", PH: "OPPO",
  PG: "OPPO", PF: "OPPO", PC: "OPPO",
  ALN: "华为", ELE: "华为", VOG: "华为", LYA: "华为", NOH: "华为", JAD: "华为",
  HUAWEI: "华为", HarmonyOS: "华为",
  M2007J: "小米", M2101: "小米",
  NE: "一加", IN: "一加", LE: "一加", KB: "一加", ONEPLUS: "一加",
  RMX: "真我", Realme: "真我",
  motorola: "摩托罗拉", XT: "摩托罗拉",
  Google: "谷歌", Pixel: "谷歌",
  HONOR: "荣耀",
  Nova: "华为", TAS: "华为", ANA: "华为", ANG: "华为",
};

function detectAndroidBrand(model: string): string | null {
  if (!model) return null;
  for (const [prefix, brand] of Object.entries(ANDROID_BRAND_PREFIX)) {
    if (model.toUpperCase().startsWith(prefix.toUpperCase())) return brand;
  }
  return null;
}

function extractAndroidModelFromUA(ua: string): { model: string | null; brand: string | null; isHarmony: boolean } {
  const isHarmony = /HarmonyOS|HMSCore|OpenHarmony/i.test(ua);
  // 格式: Android X.X; MODEL Build/...
  const m = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
  if (!m) return { model: null, brand: null, isHarmony };
  let model = m[1].trim();
  // 过滤无意义的 token
  if (/^(wv|Mobile|HarmonyOS)$/i.test(model)) return { model: null, brand: null, isHarmony };
  const brand = detectAndroidBrand(model);
  return { model, brand, isHarmony };
}

// ============== 设备族（Apple）==============
type DeviceFamily = { family: string; generation: string; models: string[] };

export const DEVICE_FAMILIES: Record<string, DeviceFamily> = {
  "375x812@3": { family: "iPhone mini / 5.8 系列", generation: "2017-2021",
    models: ["iPhone 12 mini", "iPhone 13 mini", "iPhone 11 Pro", "iPhone XS", "iPhone X"] },
  "390x844@3": { family: "iPhone 6.1 标准系列", generation: "2020-2022",
    models: ["iPhone 13", "iPhone 14", "iPhone 12"] },
  "393x852@3": { family: "iPhone 6.1 灵动岛系列", generation: "2022-2024",
    models: ["iPhone 15", "iPhone 16", "iPhone 14 Pro"] },
  "402x874@3": { family: "iPhone 6.3 Pro 系列", generation: "2024",
    models: ["iPhone 16 Pro"] },
  "428x926@3": { family: "iPhone 6.7 大屏系列", generation: "2020-2022",
    models: ["iPhone 13 Pro Max", "iPhone 14 Plus", "iPhone 12 Pro Max"] },
  "430x932@3": { family: "iPhone 6.7 灵动岛系列", generation: "2022-2024",
    models: ["iPhone 15 Plus", "iPhone 16 Plus", "iPhone 14 Pro Max"] },
  "440x956@3": { family: "iPhone 6.9 Pro Max 系列", generation: "2024",
    models: ["iPhone 16 Pro Max"] },
  "375x667@2": { family: "iPhone SE / 8 / 7 系列", generation: "2014-2022",
    models: ["iPhone SE 2", "iPhone SE 3", "iPhone 8", "iPhone 7", "iPhone 6s"] },
  "414x896@2": { family: "iPhone XR / 11 系列", generation: "2018-2019",
    models: ["iPhone 11", "iPhone XR"] },
  "414x896@3": { family: "iPhone XS Max / 11 Pro Max 系列", generation: "2018-2019",
    models: ["iPhone 11 Pro Max", "iPhone XS Max"] },
};

type Evidence = {
  rules_fired: string[];
  family_matched: string | null;
  signals_used: Record<string, unknown>;
  note: string;
};

type Detection = {
  family: string;
  generation: string;
  model: string;
  confidence: string;
  identifiability: string;
  candidates: { model: string; score: number }[];
  topCandidate: string | null;
  secondCandidate: string | null;
  margin: number | null;
  source: "direct" | "inferred" | "manual" | "verified" | "unknown";
  evidence: Evidence;
};

function detectApple(signals: Signals): Detection {
  const ua = signals.ua || "";

  // 路径 1：UA 直接暴露型号（仅 QQ 等少数 App）
  const uaModel = extractAppleModelFromUA(ua);
  if (uaModel) {
    return {
      family: uaModel, generation: "", model: uaModel,
      confidence: "高", identifiability: "exact",
      candidates: [{ model: uaModel, score: 1.0 }],
      topCandidate: uaModel, secondCandidate: null, margin: null,
      source: "direct",
      evidence: {
        rules_fired: ["ua_model_extracted"],
        family_matched: uaModel,
        signals_used: { ua_model: uaModel },
        note: "UA 直接暴露型号",
      },
    };
  }

  // 路径 2：屏幕 + DPR 查设备族
  const key = `${signals.screen}@${signals.dpr}`;
  const fam = DEVICE_FAMILIES[key];
  if (!fam) {
    return {
      family: "iPhone", generation: "", model: "iPhone",
      confidence: "低", identifiability: "unknown",
      candidates: [], topCandidate: null, secondCandidate: null, margin: null,
      source: "unknown",
      evidence: {
        rules_fired: [], family_matched: null,
        signals_used: { screen: signals.screen, dpr: signals.dpr },
        note: "屏幕组合不在已知设备族",
      },
    };
  }

  // 无论 1 款还是多款，都选第一个作为展示型号
  // identifiability 保留真实状态，UI 上可以提示
  const primary = fam.models[0];
  const candidates = fam.models.map((m) => ({ model: m, score: 0.5 }));
  const single = fam.models.length === 1;

  return {
    family: fam.family,
    generation: fam.generation,
    model: primary, // ★ 直接显示具体型号，不再显示族名
    confidence: single ? "中" : "低",
    identifiability: single ? "probable" : "ambiguous",
    candidates,
    topCandidate: primary,
    secondCandidate: fam.models[1] ?? null,
    margin: 0,
    source: "inferred",
    evidence: {
      rules_fired: ["screen_family_match"],
      family_matched: fam.family,
      signals_used: { screen: signals.screen, dpr: signals.dpr, viewport: signals.viewport },
      note: single
        ? `该分辨率对应 ${primary}`
        : `${fam.models.length} 款机型共享该分辨率，已选最可能的一款`,
    },
  };
}

function detectAndroid(signals: Signals): Detection {
  const ua = signals.ua || "";
  const { model, brand, isHarmony } = extractAndroidModelFromUA(ua);

  if (model) {
    const display = brand && !model.toUpperCase().includes(brand)
      ? `${brand} ${model}` : model;
    return {
      family: brand || (isHarmony ? "华为" : "Android"),
      generation: "",
      model: display,
      confidence: "高",
      identifiability: "exact",
      candidates: [{ model: display, score: 1.0 }],
      topCandidate: display,
      secondCandidate: null,
      margin: null,
      source: "direct",
      evidence: {
        rules_fired: ["android_ua_model_extracted"],
        family_matched: brand || "Android",
        signals_used: { ua_model: model, brand, isHarmony },
        note: "Android UA 直接暴露型号",
      },
    };
  }

  return {
    family: isHarmony ? "鸿蒙" : "Android",
    generation: "",
    model: isHarmony ? "华为鸿蒙设备" : "Android 设备",
    confidence: "低",
    identifiability: "unknown",
    candidates: [],
    topCandidate: null,
    secondCandidate: null,
    margin: null,
    source: "unknown",
    evidence: {
      rules_fired: [],
      family_matched: null,
      signals_used: {},
      note: "Android UA 未暴露型号",
    },
  };
}

export async function logUserDevice(
  db: D1Database,
  userId: string,
  clientIp: string,
  location: string,
  fingerprint: Signals,
): Promise<string> {
  const ua = fingerprint?.ua || "";
  const parser = new UAParser(ua);

  // 设备类型判定
  let deviceType = "PC";
  if (/iPhone/i.test(ua)) deviceType = "iPhone";
  else if (/iPad/i.test(ua)) deviceType = "iPad";
  else if (/Android/i.test(ua)) {
    if (/HarmonyOS|HMSCore|OpenHarmony/i.test(ua)) deviceType = "HarmonyOS";
    else deviceType = "Android";
  }

  // 系统名
  const osName = (() => {
    if (deviceType === "iPhone" || deviceType === "iPad") return "iOS";
    if (deviceType === "HarmonyOS") return "HarmonyOS";
    if (deviceType === "Android") {
      const m = ua.match(/Android (\d+(?:\.\d+)*)/i);
      return m ? "Android" : "Android";
    }
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "未知";
  })();

  // 系统版本
  const osVersion = (() => {
    if (deviceType === "iPhone" || deviceType === "iPad") return extractOsVersion(ua, deviceType);
    const m = ua.match(/Android (\d+(?:\.\d+)*)/i);
    if (m) return m[1];
    return parser.getOS().version || "";
  })();

  const browserName = detectBrowserName(ua);
  const versionMatch = ua.match(/Version\/(\d+(?:\.\d+)*)/i);
  const browserVersion = versionMatch ? versionMatch[1] : (parser.getBrowser().version || "");

  // 检测
  let detection: Detection;
  if (deviceType === "iPhone" || deviceType === "iPad") {
    detection = detectApple(fingerprint);
  } else if (deviceType === "Android" || deviceType === "HarmonyOS") {
    detection = detectAndroid(fingerprint);
  } else {
    detection = {
      family: deviceType, generation: "", model: deviceType,
      confidence: "中", identifiability: "unknown",
      candidates: [], topCandidate: null, secondCandidate: null, margin: null,
      source: "inferred",
      evidence: { rules_fired: [], family_matched: null, signals_used: {}, note: "" },
    };
  }

  const deviceId = fingerprint?.device_id || randomUUID();
  const signalsForDb = { ...fingerprint };
  delete signalsForDb.device_id;

  await db.prepare(
    `INSERT INTO user_login_devices 
      (user_id, device_id, device_type, device_model, model_confidence,
       os_name, os_version, browser, browser_name, browser_version,
       ip_address, location, device_signals, model_candidates, model_score,
       device_family, device_generation, top_candidate, second_candidate,
       score_margin, model_identifiability, detection_evidence,
       model_source, detector_version)
    VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24)
    ON CONFLICT(user_id, device_id) DO UPDATE SET
      device_type=excluded.device_type,
      device_model=excluded.device_model,
      model_confidence=excluded.model_confidence,
      os_name=excluded.os_name,
      os_version=excluded.os_version,
      browser=excluded.browser,
      browser_name=excluded.browser_name,
      browser_version=excluded.browser_version,
      last_login_at=CURRENT_TIMESTAMP,
      ip_address=excluded.ip_address,
      location=excluded.location,
      device_signals=excluded.device_signals,
      model_candidates=excluded.model_candidates,
      model_score=excluded.model_score,
      device_family=excluded.device_family,
      device_generation=excluded.device_generation,
      top_candidate=excluded.top_candidate,
      second_candidate=excluded.second_candidate,
      score_margin=excluded.score_margin,
      model_identifiability=excluded.model_identifiability,
      detection_evidence=excluded.detection_evidence,
      model_source=excluded.model_source,
      detector_version=excluded.detector_version`
  ).bind(
    userId, deviceId, deviceType, detection.model, detection.confidence,
    osName, osVersion, browserName, browserName, browserVersion,
    clientIp, location,
    JSON.stringify(signalsForDb),
    JSON.stringify(detection.candidates),
    detection.candidates[0]?.score ?? null,
    detection.family, detection.generation, detection.topCandidate,
    detection.secondCandidate, detection.margin, detection.identifiability,
    JSON.stringify(detection.evidence),
    detection.source, DETECTOR_VERSION,
  ).run();

  return deviceId;
}
