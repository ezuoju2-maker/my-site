import { UAParser } from "ua-parser-js";
import { randomUUID } from "crypto";

type Signals = {
  ua?: string;
  screen?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewport?: string;
  dpr?: number;
  orientation?: string | null;
  maxTouchPoints?: number;
  colorDepth?: number;
  language?: string;
  timezone?: string;
  gpu?: string | null;
  safeArea?: { top: number; bottom: number; left: number; right: number };
  device_id?: string;
};

type SpecGroup = {
  family: string;
  generation: string;
  models: string[];
};

// 物理规格组：CSS 分辨率 + DPR → 共享该规格的所有机型
// 关键：这些机型在纯 Web 环境下无法区分，硬选一个都是编造精度
const SPEC_GROUPS: Record<string, SpecGroup> = {
  "375x812@3": {
    family: 'iPhone 5.4"/5.8" 全面屏',
    generation: "2017-2021",
    models: ["iPhone 12 mini", "iPhone 13 mini", "iPhone 11 Pro", "iPhone XS", "iPhone X"],
  },
  "390x844@3": {
    family: 'iPhone 6.1" 全面屏',
    generation: "2020-2022",
    models: ["iPhone 14", "iPhone 13", "iPhone 12"],
  },
  "393x852@3": {
    family: 'iPhone 6.1" 灵动岛',
    generation: "2022-2024",
    models: ["iPhone 16", "iPhone 15", "iPhone 14 Pro"],
  },
  "402x874@3": {
    family: 'iPhone 6.3" 灵动岛',
    generation: "2024",
    models: ["iPhone 16 Pro"],
  },
  "428x926@3": {
    family: 'iPhone 6.7" 大屏',
    generation: "2020-2022",
    models: ["iPhone 14 Plus", "iPhone 13 Pro Max", "iPhone 12 Pro Max"],
  },
  "430x932@3": {
    family: 'iPhone 6.7" 灵动岛',
    generation: "2022-2024",
    models: ["iPhone 16 Plus", "iPhone 15 Plus", "iPhone 14 Pro Max"],
  },
  "440x956@3": {
    family: 'iPhone 6.9" 灵动岛',
    generation: "2024",
    models: ["iPhone 16 Pro Max"],
  },
  "375x667@2": {
    family: 'iPhone 4.7" 非全面屏',
    generation: "2014-2022",
    models: ["iPhone SE 3", "iPhone SE 2", "iPhone 8", "iPhone 7", "iPhone 6s"],
  },
  "414x896@2": {
    family: 'iPhone 6.1" 非 Pro',
    generation: "2018-2019",
    models: ["iPhone 11", "iPhone XR"],
  },
  "414x896@3": {
    family: 'iPhone 6.5" 大屏',
    generation: "2018-2019",
    models: ["iPhone 11 Pro Max", "iPhone XS Max"],
  },
};

function extractModelFromUA(ua: string): string | null {
  const qq = ua.match(/Device\/Apple\(([^)]+)\)/i);
  if (qq) return qq[1].trim();
  const hw = ua.match(/(iPhone\d+,\d+)/i);
  if (hw) {
    const map: Record<string, string> = {
      "iPhone13,2": "iPhone 12", "iPhone13,3": "iPhone 12 Pro", "iPhone13,4": "iPhone 12 Pro Max",
      "iPhone14,2": "iPhone 13 Pro", "iPhone14,3": "iPhone 13 Pro Max", "iPhone14,4": "iPhone 13 mini", "iPhone14,5": "iPhone 13",
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
};

function detectDevice(signals: Signals): Detection {
  const empty: Detection = {
    family: "iPhone",
    generation: "",
    model: "iPhone",
    confidence: "低",
    identifiability: "unknown",
    candidates: [],
    topCandidate: null,
    secondCandidate: null,
    margin: null,
  };

  // 阶段 0：UA 明确路径（微信/QQ/钉钉等会注入 Device/Apple(iPhone 12 mini)）
  const uaModel = extractModelFromUA(signals.ua || "");
  if (uaModel) {
    return {
      ...empty,
      family: uaModel,
      model: uaModel,
      confidence: "高",
      identifiability: "exact",
      candidates: [{ model: uaModel, score: 1.0 }],
      topCandidate: uaModel,
      secondCandidate: null,
      margin: null,
    };
  }

  // 阶段 1：物理规格组匹配
  const key = `${signals.screen}@${signals.dpr}`;
  const group = SPEC_GROUPS[key];
  if (!group) return empty;

  // 阶段 2：组内无法区分，所有成员同分（证据制）
  const candidates = group.models.map((m) => ({ model: m, score: 0.5 }));
  const margin = 0;

  let identifiability: string;
  let confidence: string;
  let displayModel: string;
  let topCandidate: string | null;
  let secondCandidate: string | null;

  if (group.models.length === 1) {
    // 组内只有 1 款 → probable
    identifiability = "probable";
    confidence = "中";
    displayModel = group.models[0];
    topCandidate = group.models[0];
    secondCandidate = null;
  } else {
    // 组内多款 → ambiguous，展示 family 名，不硬选 top
    identifiability = "ambiguous";
    confidence = "低";
    displayModel = group.family;
    // 关键修正：分数相同（margin=0）时，不选 top，把整个 family 作为答案
    topCandidate = null;
    secondCandidate = null;
  }

  return {
    family: group.family,
    generation: group.generation,
    model: displayModel,
    confidence,
    identifiability,
    candidates,
    topCandidate,
    secondCandidate,
    margin,
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

  // ===== 拆开三个版本号 =====
  // 1) iOS 版本：从 UA 的 "iPhone OS 18_7" 提取
  const iosMatch = ua.match(/iPhone OS (\d+)[._](\d+)/i);
  const osName = deviceType === "iPhone" || deviceType === "iPad" ? "iOS" : "未知";
  const osVersion = iosMatch
    ? `${iosMatch[1]}.${iosMatch[2]}`
    : (parser.getOS().version || "未知");

  // 2) 浏览器名 + 版本：分别从 UAParser 和 "Version/x.y" 提取
  const browserName = parser.getBrowser().name || "未知";
  const versionMatch = ua.match(/Version\/([\d.]+)/i);
  const browserVersion = versionMatch ? versionMatch[1] : (parser.getBrowser().version || "");

  const detection = deviceType === "iPhone" ? detectDevice(fingerprint) : {
    family: deviceType, generation: "", model: deviceType,
    confidence: "中", identifiability: "unknown",
    candidates: [], topCandidate: null, secondCandidate: null, margin: null,
  };

  const deviceId = fingerprint?.device_id || randomUUID();
  const signalsForDb = { ...fingerprint };
  delete signalsForDb.device_id;

  await db.prepare(
    `INSERT INTO user_login_devices 
      (user_id, device_id, device_type, device_model, model_confidence,
       os_name, os_version, browser, browser_name, browser_version,
       ip_address, location,
       device_signals, model_candidates, model_score,
       device_family, device_generation, top_candidate, second_candidate,
       score_margin, model_identifiability)
    VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21)
    ON CONFLICT(user_id, device_id) DO UPDATE SET
      device_type = excluded.device_type,
      device_model = excluded.device_model,
      model_confidence = excluded.model_confidence,
      os_name = excluded.os_name,
      os_version = excluded.os_version,
      browser = excluded.browser,
      browser_name = excluded.browser_name,
      browser_version = excluded.browser_version,
      last_login_at = CURRENT_TIMESTAMP,
      ip_address = excluded.ip_address,
      location = excluded.location,
      device_signals = excluded.device_signals,
      model_candidates = excluded.model_candidates,
      model_score = excluded.model_score,
      device_family = excluded.device_family,
      device_generation = excluded.device_generation,
      top_candidate = excluded.top_candidate,
      second_candidate = excluded.second_candidate,
      score_margin = excluded.score_margin,
      model_identifiability = excluded.model_identifiability`
  ).bind(
    userId, deviceId, deviceType, detection.model, detection.confidence,
    osName, osVersion, browserName, browserName, browserVersion,
    clientIp, location,
    JSON.stringify(signalsForDb),
    JSON.stringify(detection.candidates),
    detection.candidates[0]?.score ?? null,
    detection.family, detection.generation, detection.topCandidate,
    detection.secondCandidate, detection.margin, detection.identifiability,
  ).run();

  return deviceId;
}
