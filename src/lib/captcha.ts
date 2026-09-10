import { env } from "cloudflare:workers";

type CapValidateResponse = {
  success?: boolean;
};

/**
 * 验证前端提交的 Cap-Worker token。
 *
 * - 生产环境必须配置 CAP_WORKER_URL，否则拒绝（fail-closed）
 * - 开发环境（本地 wrangler dev）无 CAP_WORKER_URL 时跳过验证
 * - 网络异常或 token 无效时返回 false
 */
export async function verifyCaptcha(token: unknown): Promise<boolean> {
  const capUrl = env.CAP_WORKER_URL;

  // 本地开发环境：CAP_WORKER_URL 未配置时跳过验证
  if (!capUrl) {
    console.warn(
      "[captcha] CAP_WORKER_URL is not configured, skipping captcha verification (dev only)",
    );
    return true;
  }

  if (typeof token !== "string" || token.length < 10) {
    return false;
  }

  try {
    const response = await fetch(`${capUrl}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        keepToken: false,
      }),
    });

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

/**
 * 从请求体里安全提取 captchaToken 字段。
 */
export function extractCaptchaToken(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const record = body as Record<string, unknown>;
  const token = record.captchaToken;

  return typeof token === "string" ? token.trim() : "";
}
