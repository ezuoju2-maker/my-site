import { verifyPowToken } from "./pow";
import { env } from "cloudflare:workers";

export async function verifyCaptcha(token: unknown): Promise<boolean> {
  const mode = (env as any).CAPTCHA_MODE as string | undefined;

  if (mode === "disabled") {
    console.warn("[captcha] CAPTCHA_MODE=disabled, skipping verification");
    return true;
  }

  if (typeof token !== "string" || token.length < 10) {
    return false;
  }

  return verifyPowToken(token);
}

export function extractCaptchaToken(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const record = body as Record<string, unknown>;
  const token = record.captchaToken;
  return typeof token === "string" ? token.trim() : "";
}
