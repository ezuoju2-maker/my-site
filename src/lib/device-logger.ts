import { UAParser } from "ua-parser-js";
import { randomUUID } from "crypto";

export const DETECTOR_VERSION = "1.2.0";

type Signals = {
  ua?: string; screen?: string; screenWidth?: number; screenHeight?: number;
  viewport?: string; viewportWidth?: number; viewportHeight?: number;
  dpr?: number; orientation?: string | null; maxTouchPoints?: number;
  colorDepth?: number; language?: string; timezone?: string;
  gpu?: string | null;
  safeArea?: { top: number; bottom: number; left: number; right: number };
  device_id?: string;
};

type DeviceFamily = {
  family: string;
  generation: string;
  models: string[];
};

// 物理规格族（按 Apple 官方 CSS 分辨率 + DPR 划分）
// 同族机型共享完全相同的 Web 可观测特征，纯浏览器无法区分
export const DEVICE_FAMILIES: Record<string, DeviceFamily> = {
  "375x812@3": { family: "iPhone mini / 5.8 系列", generation: "2017-2021",
    models: ["iPhone 12 mini", "iPhone 13 mini", "iPhone 11 Pro", "iPhone XS", "iPhone X"] },
  "390x844@3": { family: "iPhone 6.1 标准系列", generation: "2020-2022",
    models: ["iPhone 14", "iPhone 13", "iPhone 12"] },
  "393x852@3": { family: "iPhone 6.1 灵动岛系列", generation: "2022-2024",
    models: ["iPhone 16", "iPhone 15", "iPhone 14 Pro"] },
  "402x874@3": { family: "iPhone 6.3 Pro 系列", generation: "2024",
    models: ["iPhone 16 Pro"] },
  "428x926@3": { family: "iPhone 6.7 大屏系列", generation: "2020-2022",
    models: ["iPhone 14 Plus", "iPhone 13 Pro Max", "iPhone 12 Pro Max"] },
  "430x932@3": { family: "iPhone 6.7 灵动岛系列", generation: "2022-2024",
    models: ["iPhone 16 Plus", "iPhone 15 Plus", "iPhone 14 Pro Max"] },
  "440x956@3": { family: "iPhone 6.9 Pro Max 系列", generation: "2024",
    models: ["iPhone 16 Pro Max"] },
  "375x667@2": { family: "iPhone SE / 8 / 7 系列", generation: "2014-2022",
    models: ["iPhone SE 3", "iPhone SE 2", "iPhone 8", "iPhone 7", "iPhone 6s"] },
  "414x896@2": { family: "iPhone XR / 11 系列", generation: "2018-2019",
    models: ["iPhone 11", "iPhone XR"] },
  "414x896@3": { family: "iPhone XS Max / 11 Pro Max 系列", generation: "2018-2019",
    models: ["iPhone 11 Pro Max", "iPhone XS Max"] },
};


// 从 UA 提取真实 iOS 版本
// 规则：
//   - Apple 从 iOS 26 开始冻结 Safari UA 里的 "iPhone OS X_Y"，真实版本只通过 "Version/X.Y" 暴露
//   - 微信等 App 不遵守冻结规则，直接写真实版本（如 "iPhone OS 26_6"）
//   - 快手的 WebView 可能缓存旧 UA，无法修，保留原值
function extractOsVersion(ua: string, deviceType: string): string {
  if (deviceType !== "iPhone" && deviceType !== "iPad") return "未知";

  const osMatch = ua.match(/iPhone OS (\d+)[._](\d+)/i);
  const osVer = osMatch ? `${osMatch[1]}.${osMatch[2]}` : null;

  const safariMatch = ua.match(/Version\/(\d+)[._](\d+)/i);
  const safariVer = safariMatch ? `${safariMatch[1]}.${safariMatch[2]}` : null;

  // 如果 OS 和 Safari 都拿到，且 Safari 主版本远大于 OS 主版本 → OS 是被冻结的，用 Safari 版本
  if (osVer && safariVer) {
    const osMajor = parseInt(osVer.split(".")[0], 10);
    const safariMajor = parseInt(safariVer.split(".")[0], 10);
    if (safariMajor > osMajor + 3) {
      return safariVer;
    }
  }

  return osVer || safariVer || "未知";
}

function extractModelFromUA(ua: string): string | null {
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

type Evidence = {
  rules_fired: string[];
  family_matched: string | null;
  signals_used: Record<string, unknown>;
  ambiguous: boolean;
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

function detectDevice(signals: Signals): Detection {
  const emptyEvidence: Evidence = {
    rules_fired: [], family_matched: null, signals_used: {}, ambiguous: false, note: "",
  };

  const uaModel = extractModelFromUA(signals.ua || "");
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
        ambiguous: false,
        note: "UA 直接暴露了型号",
      },
    };
  }

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
        ambiguous: true, note: "屏幕组合不在已知设备族里",
      },
    };
  }

  const candidates = fam.models.map((m) => ({ model: m, score: 0.5 }));
  const margin = 0;
  const single = fam.models.length === 1;

  return {
    family: fam.family,
    generation: fam.generation,
    model: single ? fam.models[0] : fam.family,
    confidence: single ? "中" : "低",
    identifiability: single ? "probable" : "ambiguous",
    candidates,
    topCandidate: single ? fam.models[0] : null,
    secondCandidate: null,
    margin,
    source: "inferred",
    evidence: {
      rules_fired: ["screen_family_match"],
      family_matched: fam.family,
      signals_used: {
        screen: signals.screen,
        dpr: signals.dpr,
        viewport: signals.viewport,
        safeArea: signals.safeArea,
        osVersion: null,
      },
      ambiguous: !single,
      note: single
        ? `该分辨率在知识库中只对应 ${fam.models[0]}`
        : `${fam.models.length} 款机型共享该分辨率，无法仅凭 Web 特征区分`,
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
  const deviceType = parser.getDevice().type === "tablet" ? "iPad"
    : parser.getDevice().type === "mobile" ? "iPhone" : "PC";

  const osName = deviceType === "iPhone" || deviceType === "iPad" ? "iOS" : "未知";
  const osVersion = extractOsVersion(ua, deviceType);
  const browserName = parser.getBrowser().name || "未知";
  const versionMatch = ua.match(/Version\/([\d.]+)/i);
  const browserVersion = versionMatch ? versionMatch[1] : (parser.getBrowser().version || "");

  const detection = deviceType === "iPhone" ? detectDevice(fingerprint) : {
    family: deviceType, generation: "", model: deviceType,
    confidence: "中", identifiability: "unknown",
    candidates: [], topCandidate: null, secondCandidate: null, margin: null,
    source: "inferred" as const,
    evidence: { rules_fired: [], family_matched: null, signals_used: {}, ambiguous: false, note: "" },
  };

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
