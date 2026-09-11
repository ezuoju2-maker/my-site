import { env } from "cloudflare:workers";

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 10 * 60;

const OTP_SECRET_PREFIX = "my-site:otp:v1";
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

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i];
  }

  return difference === 0;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePurpose(purpose: string): void {
  if (!/^[a-z0-9-]{1,64}$/.test(purpose)) {
    throw new Error("Invalid OTP purpose");
  }
}

const OTP_SECRET_HEX_RE = /^[0-9a-fA-F]{64}$/;

function getOtpSecret(): string {
  const secret = env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET is not configured");
  }

  if (!OTP_SECRET_HEX_RE.test(secret)) {
    throw new Error(
      "OTP_SECRET must be exactly 64 hexadecimal characters (32 bytes)",
    );
  }

  return secret;
}

async function hmacSha256(message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getOtpSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(message),
  );

  return new Uint8Array(signature);
}

export function generateOtp(): string {
  const max = 1_000_000;
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const random = new Uint32Array(1);

  do {
    crypto.getRandomValues(random);
  } while (random[0] >= limit);

  return String(random[0] % max).padStart(OTP_LENGTH, "0");
}

export async function createOtpDigest(
  purpose: string,
  email: string,
  code: string,
): Promise<string> {
  validatePurpose(purpose);

  const normalizedEmail = normalizeEmail(email);

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Invalid OTP code");
  }

  const message = [
    OTP_SECRET_PREFIX,
    purpose,
    normalizedEmail,
    code,
  ].join(":");

  return bytesToBase64Url(await hmacSha256(message));
}

export async function verifyOtpDigest(
  storedDigest: string,
  purpose: string,
  email: string,
  code: string,
): Promise<boolean> {
  if (!storedDigest || !/^[A-Za-z0-9_-]{43}$/.test(storedDigest)) {
    return false;
  }

  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  try {
    const expectedDigest = await createOtpDigest(
      purpose,
      email,
      code,
    );

    const storedBytes = base64UrlToBytes(storedDigest);
    const expectedBytes = base64UrlToBytes(expectedDigest);

    return constantTimeEqual(storedBytes, expectedBytes);
  } catch {
    return false;
  }
}
