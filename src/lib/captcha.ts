import { env } from "cloudflare:workers";

type CapValidateResponse = {
  success?: boolean;
};

/**
 * 验证前端提交的 Cap-Worker token。
 * 优先使用 Service Binding（内网直达，不走公网），
 * 其次用 CAP_WORKER_URL 公网地址兜底，
 * 两者都没配置时（本地开发）跳过验证。
 */
export async function verifyCaptcha(token: unknown): Promise<boolean> {
  const mode = (env as any).CAPTCHA_MODE as string | undefined;

  if (mode === "disabled") {
    console.warn("[captcha] CAPTCHA_MODE=disabled, skipping verification");
    return true;
  }

  const capWorker = (env as any).CAP_WORKER as
    | { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> }
    | undefined;
  const capUrl = (env as any).CAP_WORKER_URL as string | undefined;

  if (!capWorker && !capUrl) {
    console.warn(
      "[captcha] CAP_WORKER not configured, skipping captcha verification (dev only)",
    );
    return true;
  }

  if (typeof token !== "string" || token.length < 10) {
    return false;
  }

  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, keepToken: false }),
  };

  try {
    const response = capWorker
      ? await capWorker.fetch("https://cap-worker.internal/api/validate", init)
      : await fetch(`${capUrl}/api/validate`, init);

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as CapValidateResponse;
    return data.success === true;
  } catch (error) {
    console.error("[captcha] validate request failed", error);
    return false;
  }
}

export function extractCaptchaToken(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const record = body as Record<string, unknown>;
  const token = record.captchaToken;

  return typeof token === "string" ? token.trim() : "";
}
