/**
 * 后端 API 响应的统一类型和解析工具。
 *
 * 背景：`fetch().json()` 在新版 TS 中返回 unknown，
 * 直接访问属性会报 "Property does not exist on type '{}'"。
 * 用本工具解析能保证类型安全，同时运行时行为与原来一致。
 */

export type ApiUserInfo = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type ApiResponse = {
  ok?: boolean;
  user?: ApiUserInfo;
  error?: string;
  attemptsRemaining?: number;
  retryAfter?: number;
  expiresIn?: number;
};

/**
 * 解析 API 响应。
 *
 * - 成功解析 JSON：返回解析后的对象
 * - 解析失败：返回 `{ ok: false, error: "INVALID_JSON" }`
 *
 * 这与原先 `response.json().catch(() => null)` 的效果一致，
 * 调用方依然用 `if (!response.ok || !data?.ok)` 判断即可。
 */
export async function parseApiResponse(
  response: Response,
): Promise<ApiResponse> {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      return data as ApiResponse;
    }
    return { ok: false, error: "INVALID_JSON" };
  } catch {
    return { ok: false, error: "INVALID_JSON" };
  }
}
