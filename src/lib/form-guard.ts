export type FormGuardResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Level 1 反自动化：蜜罐字段 + 提交时间检测
 *
 * 信号：
 * 1. 蜜罐字段 website：正常表单不会填，bot 通常会填所有 input
 * 2. 提交时间 elapsed：< 800ms 视为脚本
 *
 * 设计原则：
 * - 只挡明显异常，不误伤真人
 * - 失败返回 INVALID_REQUEST（不泄露具体原因）
 * - 字段缺失时放行（向后兼容）
 */
export function checkFormGuard(body: unknown): FormGuardResult {
  if (!body || typeof body !== "object") {
    return { ok: true };
  }
  const record = body as Record<string, unknown>;

  const website = record.website;
  if (typeof website === "string" && website.length > 0) {
    return { ok: false, error: "INVALID_REQUEST" };
  }

  const elapsed = record.elapsed;
  if (typeof elapsed === "number" && elapsed > 0 && elapsed < 800) {
    return { ok: false, error: "INVALID_REQUEST" };
  }

  return { ok: true };
}
