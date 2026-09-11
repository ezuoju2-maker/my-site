import { env } from "cloudflare:workers";

const textEncoder = new TextEncoder();

function getSecret(): string {
  const s = (env as any).OTP_SECRET as string | undefined;
  if (!s || !/^[0-9a-fA-F]{64}$/.test(s)) {
    throw new Error("POW secret unavailable");
  }
  return s;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", textEncoder.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 记录一次登录。失败静默，不影响主流程。
 */
export async function recordLogin(
  userId: string,
  request: Request,
): Promise<void> {
  const db = env.DB;
  if (!db) return;

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = request.headers.get("User-Agent") || "unknown";

  try {
    const secret = getSecret();
    const ipHash = (await sha256Hex(`${secret}:login-ip:${ip}`)).slice(0, 32);
    const uaHash = (await sha256Hex(`${secret}:login-ua:${ua}`)).slice(0, 32);

    await db
      .prepare(
        `INSERT INTO user_login_logs (id, user_id, ip_hash, ua_hash)
         VALUES (?1, ?2, ?3, ?4)`,
      )
      .bind(crypto.randomUUID(), userId, ipHash, uaHash)
      .run();
  } catch (error) {
    console.warn("[login-log] failed", error);
  }
}

export type LoginLogEntry = {
  id: string;
  ipHash: string;
  uaHash: string;
  createdAt: string;
};

export async function listLoginHistory(
  userId: string,
  limit = 10,
): Promise<LoginLogEntry[]> {
  const db = env.DB;
  if (!db) return [];

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

  try {
    const result = await db
      .prepare(
        `SELECT id, ip_hash, ua_hash, created_at
         FROM user_login_logs
         WHERE user_id = ?1
         ORDER BY created_at DESC
         LIMIT ?2`,
      )
      .bind(userId, safeLimit)
      .all<{
        id: string;
        ip_hash: string;
        ua_hash: string;
        created_at: string;
      }>();

    return (result.results ?? []).map((r) => ({
      id: r.id,
      ipHash: r.ip_hash,
      uaHash: r.ua_hash,
      createdAt: r.created_at,
    }));
  } catch (error) {
    console.warn("[login-log] list failed", error);
    return [];
  }
}
