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
  device_id?: string;
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

// 返回候选列表 [{model, score}]，按分数降序
function scoreCandidates(signals: Signals): { model: string; score: number }[] {
  const screen = signals.screen;
  const dpr = signals.dpr;

  // 屏幕组合 → 候选机型（按概率排序）
  const screenMap: Record<string, string[]> = {
    "375x812@3": ["iPhone 13 mini", "iPhone 12 mini", "iPhone 11 Pro", "iPhone XS", "iPhone X"],
    "390x844@3": ["iPhone 14", "iPhone 13", "iPhone 12"],
    "393x852@3": ["iPhone 16", "iPhone 15", "iPhone 14 Pro"],
    "402x874@3": ["iPhone 16 Pro"],
    "428x926@3": ["iPhone 14 Plus", "iPhone 13 Pro Max", "iPhone 12 Pro Max"],
    "430x932@3": ["iPhone 16 Plus", "iPhone 15 Plus", "iPhone 14 Pro Max"],
    "440x956@3": ["iPhone 16 Pro Max"],
    "375x667@2": ["iPhone SE 2", "iPhone SE 3", "iPhone 8", "iPhone 7"],
    "414x896@2": ["iPhone 11", "iPhone XR"],
    "414x896@3": ["iPhone 11 Pro Max", "iPhone XS Max"],
  };

  const key = `${screen}@${dpr}`;
  const list = screenMap[key];
  if (!list) return [];

  // 简单评分：位置越靠前分越高
  return list.map((model, i) => ({
    model,
    score: Number((0.95 - i * 0.06).toFixed(2)),
  }));
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
  const osVersion = parser.getOS().version || "未知";
  const browser = parser.getBrowser().name || "未知";

  let deviceModel = "未知";
  let confidence = "低";
  let candidates: { model: string; score: number }[] = [];
  let topScore: number | null = null;

  if (deviceType === "iPhone") {
    const uaModel = extractModelFromUA(ua);
    if (uaModel) {
      deviceModel = uaModel;
      confidence = "高";
      candidates = [{ model: uaModel, score: 0.99 }];
      topScore = 0.99;
    } else {
      candidates = scoreCandidates(fingerprint);
      if (candidates.length > 0) {
        deviceModel = candidates[0].model;
        topScore = candidates[0].score;
        confidence = topScore >= 0.9 ? "高" : topScore >= 0.75 ? "中" : "低";
      }
    }
  }

  const deviceId = fingerprint?.device_id || randomUUID();

  // 存原始 signals（去掉 device_id 避免冗余）
  const signalsForDb = { ...fingerprint };
  delete signalsForDb.device_id;

  await db.prepare(
    `INSERT INTO user_login_devices 
      (user_id, device_id, device_type, device_model, model_confidence,
       os_version, browser, ip_address, location,
       device_signals, model_candidates, model_score)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
    ON CONFLICT(user_id, device_id) DO UPDATE SET
      device_type = excluded.device_type,
      device_model = excluded.device_model,
      model_confidence = excluded.model_confidence,
      os_version = excluded.os_version,
      browser = excluded.browser,
      last_login_at = CURRENT_TIMESTAMP,
      ip_address = excluded.ip_address,
      location = excluded.location,
      device_signals = excluded.device_signals,
      model_candidates = excluded.model_candidates,
      model_score = excluded.model_score`
  ).bind(
    userId, deviceId, deviceType, deviceModel, confidence,
    osVersion, browser, clientIp, location,
    JSON.stringify(signalsForDb),
    JSON.stringify(candidates),
    topScore,
  ).run();

  return deviceId;
}
