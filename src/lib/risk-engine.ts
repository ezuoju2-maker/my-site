/**
 * 登录风险评分引擎
 * 输入：本次登录 + 该用户历史登录记录
 * 输出：风险分数 0-100 + 等级 + 触发的信号清单
 */

export type RiskSignals = {
  isNewDevice: boolean;
  impossibleTravel: boolean;
  countryChanged: boolean;
  regionChanged: boolean;
  uaChanged: boolean;
  ipChanged: boolean;
  nightTime: boolean;
};

export type RiskResult = {
  score: number;
  level: "low" | "medium" | "high";
  signals: RiskSignals;
  reasons: string[];
};

type PrevLogin = {
  device_id: string;
  ip_address: string | null;
  location: string | null;
  last_login_at: string | null;
  browser_name: string | null;
  os_name: string | null;
};

type CurrentLogin = {
  device_id: string;
  ip_address: string;
  location: string;
  browser_name: string;
  os_name: string;
};

// 从 "City, Region, Country" 拆出国家/地区
function parseLocation(loc: string | null): { country: string; region: string } {
  if (!loc) return { country: "", region: "" };
  const parts = loc.split(",").map((s) => s.trim());
  return {
    country: parts[parts.length - 1] || "",
    region: parts[parts.length - 2] || "",
  };
}

// 经纬度差 → 公里（粗估，1 度 ≈ 111km）
function roughDistance(
  locA: string | null,
  locB: string | null,
): number | null {
  // 无 GPS，用"国家/地区是否相同"做粗判
  // 不同国家 → 认为距离 > 1000km；同国不同区 → 300km；同区 → 0
  const a = parseLocation(locA);
  const b = parseLocation(locB);
  if (!a.country || !b.country) return null;
  if (a.country !== b.country) return 1500;
  if (a.region !== b.region) return 300;
  return 0;
}

export function assessLoginRisk(
  current: CurrentLogin,
  previous: PrevLogin | null,
): RiskResult {
  const signals: RiskSignals = {
    isNewDevice: !previous || previous.device_id !== current.device_id,
    impossibleTravel: false,
    countryChanged: false,
    regionChanged: false,
    uaChanged: false,
    ipChanged: false,
    nightTime: false,
  };
  const reasons: string[] = [];

  // 1. 新设备
  if (signals.isNewDevice) {
    reasons.push("首次在此设备登录");
  }

  // 2. 与上次登录对比
  if (previous && previous.device_id === current.device_id) {
    // 同一设备：检查 IP / 位置 / UA 突变
    if (previous.ip_address && previous.ip_address !== current.ip_address) {
      signals.ipChanged = true;
      // IP 变化本身不算可疑，先不加分

      const a = parseLocation(previous.location);
      const b = parseLocation(current.location);

      if (a.country && b.country && a.country !== b.country) {
        signals.countryChanged = true;

        // 不可能旅行判定：跨 1500km，但时间 < 6 小时
        if (previous.last_login_at) {
          const prevTime = new Date(
            previous.last_login_at.includes("T")
              ? previous.last_login_at
              : previous.last_login_at.replace(" ", "T") + "Z",
          ).getTime();
          const now = Date.now();
          const hoursAgo = (now - prevTime) / 3_600_000;
          const distance = roughDistance(previous.location, current.location) || 1500;

          // 飞机速度 ~900 km/h，超过就物理不可能
          if (hoursAgo > 0 && distance / hoursAgo > 900 && hoursAgo < 24) {
            signals.impossibleTravel = true;
            reasons.push(
              `物理不可能旅行：${Math.round(distance)} 公里 / ${hoursAgo.toFixed(1)} 小时`,
            );
          } else if (hoursAgo < 6) {
            reasons.push(`跨国家/地区登录（${previous.location} → ${current.location}）`);
          }
        }
      } else if (a.region && b.region && a.region !== b.region) {
        signals.regionChanged = true;
        reasons.push(`跨地区登录（${previous.location} → ${current.location}）`);
      }
    }

    // UA 大变化：同 device_id 但 OS 或浏览器变了
    const uaChanged =
      (previous.browser_name && previous.browser_name !== current.browser_name) ||
      (previous.os_name && previous.os_name !== current.os_name);
    if (uaChanged) {
      signals.uaChanged = true;
      reasons.push(`设备指纹变化（${previous.browser_name} → ${current.browser_name}）`);
    }
  } else if (previous) {
    // 不同设备：说明是"新设备"，但该用户有其他设备
    signals.isNewDevice = true;
  }

  // 3. 深夜登录（本地时间不易获得，用 UTC 粗判）
  const hour = new Date().getUTCHours();
  // 中国时区 UTC+8，凌晨 2-5 点 = UTC 18-21
  if (hour >= 18 && hour <= 21) {
    signals.nightTime = true;
  }

  // ========== 评分 ==========
  let score = 0;
  if (signals.impossibleTravel) score += 80;
  if (signals.isNewDevice) score += 25;
  if (signals.countryChanged && !signals.impossibleTravel) score += 20;
  if (signals.regionChanged) score += 10;
  if (signals.uaChanged) score += 15;
  if (signals.nightTime && signals.isNewDevice) score += 10;

  score = Math.min(100, score);

  let level: "low" | "medium" | "high";
  if (score >= 60) level = "high";
  else if (score >= 25) level = "medium";
  else level = "low";

  return { score, level, signals, reasons };
}
