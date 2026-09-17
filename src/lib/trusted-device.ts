import { env } from "cloudflare:workers";

const TOKEN_TTL_DAYS = 90;
const COOKIE_NAME = "device_token";

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

export function isValidDeviceToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

/**
 * 创建一条信任设备记录，返回原始 token（只能显示这一次）
 */
export async function createTrustedDevice(
  userId: string,
  userAgent: string,
): Promise<string> {
  const db = env.DB;
  if (!db) throw new Error("DB unavailable");

  const token = generateDeviceToken();
  const tokenHash = await sha256Hex(token);
  const ua = userAgent.slice(0, 500);
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 同一用户 + 同一 User-Agent → 视为同一台设备，先删旧记录（滚动续期）
  await db
    .prepare("DELETE FROM trusted_devices WHERE user_id = ?1 AND user_agent = ?2")
    .bind(userId, ua)
    .run();

  await db
    .prepare(
      `INSERT INTO trusted_devices
       (id, user_id, token_hash, user_agent, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(crypto.randomUUID(), userId, tokenHash, ua, expiresAt)
    .run();

  return token;
}

/**
 * 从请求中读取 device_token，查找对应的用户。
 * 同时滚动更新 last_used_at。
 */
export async function getTrustedUser(
  request: Request,
): Promise<{ userId: string; deviceId: string } | null> {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)device_token=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  if (!isValidDeviceToken(token)) return null;

  const db = env.DB;
  if (!db) return null;

  const tokenHash = await sha256Hex(token);

  try {
    const row = await db
      .prepare(
        `SELECT id, user_id, expires_at
         FROM trusted_devices
         WHERE token_hash = ?1
         LIMIT 1`,
      )
      .bind(tokenHash)
      .first<{ id: string; user_id: string; expires_at: string }>();

    if (!row) return null;

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await db.prepare("DELETE FROM trusted_devices WHERE id = ?1").bind(row.id).run();
      return null;
    }

    // 滚动更新 last_used_at（不阻塞主流程）
    db.prepare(
      "UPDATE trusted_devices SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?1",
    )
      .bind(row.id)
      .run()
      .catch(() => {});

    return { userId: row.user_id, deviceId: row.id };
  } catch {
    return null;
  }
}

/**
 * 删除当前设备的信任记录（用于"退出此设备"）
 */
export async function deleteTrustedDevice(request: Request): Promise<void> {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)device_token=([^;]+)/);
  if (!match) return;

  const token = match[1];
  if (!isValidDeviceToken(token)) return;

  const db = env.DB;
  if (!db) return;

  const tokenHash = await sha256Hex(token);
  await db
    .prepare("DELETE FROM trusted_devices WHERE token_hash = ?1")
    .bind(tokenHash)
    .run();
}

/**
 * 删除用户的所有信任设备（用于"退出所有设备"）
 */
export async function deleteAllTrustedDevices(userId: string): Promise<void> {
  const db = env.DB;
  if (!db) return;
  await db
    .prepare("DELETE FROM trusted_devices WHERE user_id = ?1")
    .bind(userId)
    .run();
}

/**
 * 生成 set-cookie 头部（90 天）
 */
export function deviceCookie(token: string): string {
  const maxAge = TOKEN_TTL_DAYS * 24 * 60 * 60;
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

export function clearDeviceCookie(): string {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Max-Age=0",
  ].join("; ");
}

export type TrustedDeviceInfo = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

/**
 * 列出用户所有未过期的信任设备（按最近使用时间倒序）
 */
export async function listTrustedDevices(
  userId: string,
): Promise<TrustedDeviceInfo[]> {
  const db = env.DB;
  if (!db) return [];

  try {
    const result = await db
      .prepare(
        `SELECT id, user_agent, created_at, last_used_at, expires_at
         FROM trusted_devices
         WHERE user_id = ?1 AND datetime(expires_at) > datetime('now')
         ORDER BY last_used_at DESC
         LIMIT 50`,
      )
      .bind(userId)
      .all<{
        id: string;
        user_agent: string | null;
        created_at: string;
        last_used_at: string;
        expires_at: string;
      }>();

    return (result.results ?? []).map((r) => ({
      id: r.id,
      userAgent: r.user_agent,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
      expiresAt: r.expires_at,
    }));
  } catch {
    return [];
  }
}

/**
 * 撤销某台设备。必须校验 user_id 匹配，防止越权。
 * 返回 true 表示删除成功。
 */
export async function revokeDeviceById(
  userId: string,
  deviceId: string,
): Promise<boolean> {
  const db = env.DB;
  if (!db) return false;

  try {
    const row = await db
      .prepare("SELECT user_id FROM trusted_devices WHERE id = ?1 LIMIT 1")
      .bind(deviceId)
      .first<{ user_id: string }>();

    if (!row || row.user_id !== userId) return false;

    await db
      .prepare("DELETE FROM trusted_devices WHERE id = ?1")
      .bind(deviceId)
      .run();

    return true;
  } catch {
    return false;
  }
}
