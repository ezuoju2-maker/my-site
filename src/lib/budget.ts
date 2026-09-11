import { env } from "cloudflare:workers";

/**
 * 免费额度保护（阶段 1：只记录，不拦截）
 *
 * 设计原则：
 * - 静默失败：KV 写失败绝不影响主流程
 * - 非阻塞：调用方用 .catch(() => {}) 触发，不用 await
 * - 每日聚合：UTC 日期为 key 前缀，KV 保留 30 天
 *
 * 阶段 2 会加入 checkBudget() 拦截，本阶段不做。
 */

export type BudgetMode = "normal" | "throttled" | "degraded" | "emergency";

const BUDGET_TTL = 30 * 86400;
const BUDGET_PREFIX = "budget";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 记录一次操作。失败静默，不影响业务。
 * 用法：recordUsage("login").catch(() => {});
 */
export async function recordUsage(operation: string): Promise<void> {
  if (!operation || !/^[a-z0-9-]{1,32}$/.test(operation)) return;

  const kv = env.SESSION;
  if (!kv) return;

  const date = todayUtc();
  const key = `${BUDGET_PREFIX}:${date}:${operation}`;

  try {
    const current = Number.parseInt((await kv.get(key)) ?? "0", 10) || 0;
    await kv.put(key, String(current + 1), { expirationTtl: BUDGET_TTL });
  } catch {
    // 静默：额度记录失败绝不阻塞业务
  }
}

/**
 * 读取今日快照（供 admin 面板使用）。
 */
export async function getUsageSnapshot(): Promise<{
  date: string;
  mode: BudgetMode;
  counts: Record<string, number>;
  total: number;
}> {
  const date = todayUtc();
  const mode: BudgetMode = ((env as any).BUDGET_MODE as BudgetMode) || "normal";
  const kv = env.SESSION;

  const counts: Record<string, number> = {};

  if (kv) {
    try {
      let cursor: string | undefined;
      do {
        const list = await kv.list({
          prefix: `${BUDGET_PREFIX}:${date}:`,
          cursor,
          limit: 100,
        });
        for (const k of list.keys) {
          const parts = k.name.split(":");
          const op = parts[2];
          if (!op) continue;
          const v = await kv.get(k.name);
          counts[op] = Number.parseInt(v ?? "0", 10) || 0;
        }
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
    } catch {
      // 忽略读取失败
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return { date, mode, counts, total };
}
