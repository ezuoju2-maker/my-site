import { UAParser } from 'ua-parser-js';
import { randomUUID } from 'crypto';

// 从 UA 里提取精确型号（微信/QQ/钉钉等内置浏览器会注入）
function extractModelFromUA(ua: string): string | null {
  // QQ 内置浏览器: Device/Apple(iPhone 12 mini)
  const qq = ua.match(/Device\/Apple\(([^)]+)\)/i);
  if (qq) return qq[1].trim();

  // 微信/其他: iPhone14,2 这种硬件标识
  const hw = ua.match(/(iPhone\d+,\d+)/i);
  if (hw) {
    const map: Record<string, string> = {
      'iPhone13,2': 'iPhone 12', 'iPhone13,3': 'iPhone 12 Pro', 'iPhone13,4': 'iPhone 12 Pro Max',
      'iPhone14,2': 'iPhone 13 Pro', 'iPhone14,3': 'iPhone 13 Pro Max', 'iPhone14,4': 'iPhone 13 mini', 'iPhone14,5': 'iPhone 13',
      'iPhone14,7': 'iPhone 14', 'iPhone14,8': 'iPhone 14 Plus',
      'iPhone15,2': 'iPhone 14 Pro', 'iPhone15,3': 'iPhone 14 Pro Max',
      'iPhone15,4': 'iPhone 15', 'iPhone15,5': 'iPhone 15 Plus',
      'iPhone16,1': 'iPhone 15 Pro', 'iPhone16,2': 'iPhone 15 Pro Max',
      'iPhone17,1': 'iPhone 16 Pro', 'iPhone17,2': 'iPhone 16 Pro Max', 'iPhone17,3': 'iPhone 16', 'iPhone17,4': 'iPhone 16 Plus',
    };
    return map[hw[1]] || hw[1];
  }

  return null;
}

export function inferDeviceModel(screen: string, dpr: number) {
  if (screen === '375x812' && dpr === 3) return { model: 'iPhone X/XS/11 Pro/12 mini/13 mini 系列', confidence: '中' };
  if (screen === '390x844' && dpr === 3) return { model: 'iPhone 12/13/14 系列', confidence: '中' };
  if (screen === '393x852' && dpr === 3) return { model: 'iPhone 14 Pro/15/16 系列', confidence: '中' };
  if (screen === '402x874' && dpr === 3) return { model: 'iPhone 16 Pro 系列', confidence: '高' };
  if (screen === '428x926' && dpr === 3) return { model: 'iPhone 12 Pro Max/13 Pro Max/14 Plus 系列', confidence: '中' };
  if (screen === '430x932' && dpr === 3) return { model: 'iPhone 14 Pro Max/15 Plus/16 Plus 系列', confidence: '中' };
  if (screen === '440x956' && dpr === 3) return { model: 'iPhone 16 Pro Max 系列', confidence: '高' };
  if (screen === '375x667' && dpr === 2) return { model: 'iPhone SE/8/7/6s 系列', confidence: '中' };
  if (screen === '414x896' && dpr === 2) return { model: 'iPhone XR/11 系列', confidence: '中' };
  if (screen === '414x896' && dpr === 3) return { model: 'iPhone XS Max/11 Pro Max 系列', confidence: '中' };
  if (screen === '414x736' && dpr === 3) return { model: 'iPhone 6/7/8 Plus 系列', confidence: '中' };
  return { model: 'iPhone (未知具体型号)', confidence: '低' };
}

export async function logUserDevice(
  db: D1Database,
  userId: string,
  clientIp: string,
  location: string,
  fingerprint: any,
): Promise<string> {
  const ua = fingerprint?.ua || '';
  const parser = new UAParser(ua);
  const deviceType = parser.getDevice().type === 'tablet' ? 'iPad' : (parser.getDevice().type === 'mobile' ? 'iPhone' : 'PC');
  const osVersion = parser.getOS().version || '未知';
  const browser = parser.getBrowser().name || '未知';

  let deviceModel = '未知';
  let confidence = '低';

  if (deviceType === 'iPhone') {
    const uaModel = extractModelFromUA(ua);
    if (uaModel) {
      deviceModel = uaModel;
      confidence = '高';
    } else if (fingerprint?.screen && fingerprint?.dpr) {
      const inferred = inferDeviceModel(fingerprint.screen, fingerprint.dpr);
      deviceModel = inferred.model;
      confidence = inferred.confidence;
    }
  }

  const deviceId = fingerprint?.device_id || randomUUID();

  await db.prepare(
    `INSERT INTO user_login_devices 
      (user_id, device_id, device_type, device_model, model_confidence, os_version, browser, ip_address, location)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(user_id, device_id) DO UPDATE SET
      last_login_at = CURRENT_TIMESTAMP,
      ip_address = excluded.ip_address,
      location = excluded.location`
  ).bind(userId, deviceId, deviceType, deviceModel, confidence, osVersion, browser, clientIp, location).run();

  return deviceId;
}
