import { env } from "cloudflare:workers";

const POW_PREFIX = "pow";
const CHALLENGE_TTL = 10 * 60;
const TOKEN_TTL = 5 * 60;

// 动态难度：基础 3，随失败次数上升
const BASE_DIFFICULTY = 3;
const FAIL_WINDOW_SECONDS = 600;

const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getSecret(): string {
  const s = (env as any).OTP_SECRET as string | undefined;
  if (!s || !/^[0-9a-fA-F]{64}$/.test(s)) {
    throw new Error("POW secret unavailable");
  }
  return s;
}

async function hmac(message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return new Uint8Array(sig);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", textEncoder.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeClientBinding(
  ip: string,
  userAgent: string,
): Promise<{ ipHash: string; uaHash: string }> {
  const secret = getSecret();
  const ipHash = (await sha256Hex(`${secret}:ip:${ip}`)).slice(0, 32);
  const uaHash = (await sha256Hex(`${secret}:ua:${userAgent}`)).slice(0, 32);
  return { ipHash, uaHash };
}

/**
 * 根据 IP 的失败次数决定难度。
 * 返回值：null 表示直接拒绝（已被临时封禁）。
 */
async function getDifficultyForIp(ip: string): Promise<number | null> {
  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const key = `${POW_PREFIX}:fail:${ip}`;
  const raw = await kv.get(key);
  const failCount = Number.parseInt(raw ?? "0", 10) || 0;

  if (failCount > 10) return null;     // 临时封禁
  if (failCount > 5) return 5;
  if (failCount > 2) return 4;
  return BASE_DIFFICULTY;
}

/**
 * 记录一次失败。TTL 10 分钟，自然过期。
 */
export async function recordFail(ip: string): Promise<void> {
  const kv = env.SESSION;
  if (!kv) return;
  const key = `${POW_PREFIX}:fail:${ip}`;
  try {
    const raw = await kv.get(key);
    const current = Number.parseInt(raw ?? "0", 10) || 0;
    await kv.put(key, String(current + 1), {
      expirationTtl: FAIL_WINDOW_SECONDS,
    });
  } catch {
    // 静默：记录失败不影响主流程
  }
}

/**
 * 成功则清零。真人成功一次，不累计失败。
 */
export async function clearFail(ip: string): Promise<void> {
  const kv = env.SESSION;
  if (!kv) return;
  try {
    await kv.delete(`${POW_PREFIX}:fail:${ip}`);
  } catch {
    // 静默
  }
}

export type Challenge = {
  challenge_id: string;
  salt: string;
  difficulty: number;
  expires_at: number;
  ip_hash: string;
  ua_hash: string;
  signature: string;
};

export async function createChallenge(
  ip: string,
  userAgent: string,
  behaviorScore: number = -1,
): Promise<Challenge | null> {
  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const baseDifficulty = await getDifficultyForIp(ip);
  if (baseDifficulty === null) {
    return null; // 拒绝：临时封禁
  }

  // 行为信号加分：
  // - behaviorScore = -1：未提供（老客户端 / curl），不惩罚
  // - behaviorScore >= 1：有交互，正常
  // - behaviorScore = 0：完全无交互（无头/脚本），难度 +1
  let difficulty = baseDifficulty;
  if (behaviorScore === 0) {
    difficulty = Math.min(6, difficulty + 1);
  }

  const challenge_id = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const expires_at = Date.now() + CHALLENGE_TTL * 1000;
  const { ipHash, uaHash } = await computeClientBinding(ip, userAgent);

  const message = `${POW_PREFIX}:challenge:${challenge_id}:${salt}:${difficulty}:${expires_at}:${ipHash}:${uaHash}`;
  const signature = bytesToBase64Url(await hmac(message));

  await kv.put(
    `${POW_PREFIX}:challenge:${challenge_id}`,
    JSON.stringify({ salt, difficulty, expires_at, ipHash, uaHash }),
    { expirationTtl: CHALLENGE_TTL },
  );

  return {
    challenge_id,
    salt,
    difficulty,
    expires_at,
    ip_hash: ipHash,
    ua_hash: uaHash,
    signature,
  };
}

/**
 * 分类 redeem 失败原因。
 * - "soft"：网络抖动/重试（不记账）
 * - "hard"：签名/绑定/难度不达标（记账）
 */
type FailKind = "soft" | "hard";

export async function redeemChallenge(
  challenge_id: unknown,
  nonce: unknown,
  signature: unknown,
  ip: string,
  userAgent: string,
): Promise<{ token: string } | { error: FailKind }> {
  if (
    typeof challenge_id !== "string" || !challenge_id || challenge_id.length > 64 ||
    typeof nonce !== "number" || !Number.isInteger(nonce) || nonce < 0 || nonce > 1e12 ||
    typeof signature !== "string" || !signature || signature.length > 128
  ) {
    return { error: "hard" };
  }

  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const key = `${POW_PREFIX}:challenge:${challenge_id}`;
  const raw = await kv.get(key);

  // challenge 不存在：可能是过期/已消费/网络重试 → soft
  if (!raw) {
    return { error: "soft" };
  }

  await kv.delete(key);

  let stored: {
    salt: string;
    difficulty: number;
    expires_at: number;
    ipHash: string;
    uaHash: string;
  };
  try {
    stored = JSON.parse(raw);
  } catch {
    return { error: "hard" };
  }

  if (Date.now() > stored.expires_at) {
    return { error: "soft" };
  }

  const { ipHash, uaHash } = await computeClientBinding(ip, userAgent);
  if (ipHash !== stored.ipHash || uaHash !== stored.uaHash) {
    return { error: "hard" };
  }

  const message = `${POW_PREFIX}:challenge:${challenge_id}:${stored.salt}:${stored.difficulty}:${stored.expires_at}:${stored.ipHash}:${stored.uaHash}`;
  const expectedSig = await hmac(message);

  let providedSig: Uint8Array;
  try {
    const normalized = signature.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    providedSig = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return { error: "hard" };
  }

  if (!constantTimeEqual(providedSig, expectedSig)) {
    return { error: "hard" };
  }

  const hex = await sha256Hex(`${stored.salt}:${nonce}`);
  const target = "0".repeat(stored.difficulty);
  if (!hex.startsWith(target)) {
    return { error: "hard" };
  }

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64Url(tokenBytes);

  await kv.put(`${POW_PREFIX}:token:${token}`, "1", {
    expirationTtl: TOKEN_TTL,
  });

  return { token };
}

export async function verifyPowToken(token: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) {
    return false;
  }
  const kv = env.SESSION;
  if (!kv) throw new Error("KV unavailable");

  const key = `${POW_PREFIX}:token:${token}`;
  const exists = await kv.get(key);
  if (!exists) return false;

  await kv.delete(key);
  return true;
}

export function extractClientIdentity(request: Request): {
  ip: string;
  userAgent: string;
} {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "unknown";
  return { ip, userAgent };
}
