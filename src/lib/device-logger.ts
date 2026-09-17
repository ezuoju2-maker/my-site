import { UAParser } from 'ua-parser-js';
import { randomUUID } from 'crypto';

export function inferDeviceModel(screen: string, dpr: number) {
  if (screen === '393x852' && dpr === 3) return { model: 'iPhone 14 Pro / 15 系列', confidence: '高' };
  if (screen === '390x844' && dpr === 3) return { model: 'iPhone 12 / 13 系列', confidence: '中' };
  if (screen === '430x932' && dpr === 3) return { model: 'iPhone 14 Pro Max / 15 Plus 系列', confidence: '高' };
  if (screen === '428x926' && dpr === 3) return { model: 'iPhone 12 Pro Max / 13 Pro Max 系列', confidence: '高' };
  return { model: 'iPhone (未知具体型号)', confidence: '低' };
}

export async function logUserDevice(
  db: D1Database,
  userId: string,
  clientIp: string,
  location: string,
  fingerprint: any,
): Promise<string> {
  const parser = new UAParser(fingerprint?.ua || '');
  const deviceType = parser.getDevice().type === 'tablet' ? 'iPad' : (parser.getDevice().type === 'mobile' ? 'iPhone' : 'PC');
  const osVersion = parser.getOS().version || '未知';
  const browser = parser.getBrowser().name || '未知';

  let deviceModel = '未知';
  let confidence = '低';

  if (deviceType === 'iPhone' && fingerprint?.screen && fingerprint?.dpr) {
    const inferred = inferDeviceModel(fingerprint.screen, fingerprint.dpr);
    deviceModel = inferred.model;
    confidence = inferred.confidence;
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
