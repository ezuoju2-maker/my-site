import { env } from "cloudflare:workers";

export type BudgetMode = "normal" | "watch" | "throttled" | "degraded" | "emergency";

const MODE_KEY = "budget:mode";
const MODE_TTL = 86400;
const EMAIL_COUNT_KEY_PREFIX = "budget:email";
const EMAIL_COUNT_TTL = 86400;
const MODE_CACHE_MS = 30_000;
const RESEND_DAILY_LIMIT = 100;

const ORDER: Record<BudgetMode, number> = {
  normal: 0,
  watch: 1,
  throttled: 2,
  degraded: 3,
  emergency: 4,
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// 模块级缓存：每个 Worker 实例 30 秒只读 1 次 KV
let cachedMode: BudgetMode | null = null;
let cachedModeExpire = 0;

export async function getCurrentMode(): Promise<BudgetMode> {
  const now = Date.now();
  if (cachedMode && now < cachedModeExpire) return cachedMode;

  const envMode = ((env as any).BUDGET_MODE as BudgetMode) || "normal";

  if (envMode === "emergency" || envMode === "degraded") {
    cachedMode = envMode;
    cachedModeExpire = now + MODE_CACHE_MS;
    return envMode;
  }

  const kv = env.SESSION;
  if (!kv) {
    cachedMode = envMode;
    cachedModeExpire = now + MODE_CACHE_MS;
    return envMode;
  }

  try {
    const kvMode = (await kv.get(MODE_KEY)) as BudgetMode | null;
    const result =
      kvMode && ORDER[kvMode] !== undefined && ORDER[kvMode] > ORDER[envMode]
        ? kvMode
        : envMode;
    cachedMode = result;
    cachedModeExpire = now + MODE_CACHE_MS;
    return result;
  } catch {
    cachedMode = envMode;
    cachedModeExpire = now + MODE_CACHE_MS;
    return envMode;
  }
}

/**
 * 记录一次邮件类操作（send-code / forgot-password / email-send-code）。
 * 只在 3 个邮件接口调用。
 */
export async function recordEmailOp(): Promise<void> {
  const kv = env.SESSION;
  if (!kv) return;
  const key = `${EMAIL_COUNT_KEY_PREFIX}:${todayUtc()}`;
  try {
    const current = Number.parseInt((await kv.get(key)) ?? "0", 10) || 0;
    const next = current + 1;
    await kv.put(key, String(next), { expirationTtl: EMAIL_COUNT_TTL });
    await evaluateMode(next);
  } catch {
    // 静默
  }
}

export async function getEmailCount(): Promise<number> {
  const kv = env.SESSION;
  if (!kv) return 0;
  try {
    const raw = await kv.get(`${EMAIL_COUNT_KEY_PREFIX}:${todayUtc()}`);
    return Number.parseInt(raw ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

async function evaluateMode(currentCount: number): Promise<void> {
  const kv = env.SESSION;
  if (!kv) return;

  const ratio = currentCount / RESEND_DAILY_LIMIT;

  let newMode: BudgetMode = "normal";
  if (ratio >= 0.9) newMode = "emergency";
  else if (ratio >= 0.8) newMode = "degraded";
  else if (ratio >= 0.7) newMode = "throttled";
  else if (ratio >= 0.5) newMode = "watch";

  if (newMode === "normal") return;

  const envMode = ((env as any).BUDGET_MODE as BudgetMode) || "normal";
  if (envMode === "emergency" || envMode === "degraded") return;

  const current = (await kv.get(MODE_KEY)) as BudgetMode | null;
  const cur = current ?? "normal";
  if (ORDER[newMode] <= ORDER[cur]) return;

  await kv.put(MODE_KEY, newMode, { expirationTtl: MODE_TTL });
  cachedMode = newMode;
  cachedModeExpire = Date.now() + MODE_CACHE_MS;
  console.warn(
    `[budget] escalated: ${cur} -> ${newMode} (emails=${currentCount})`,
  );
}

export async function checkBudget(
  operation: string,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const mode = await getCurrentMode();
  if (mode === "normal" || mode === "watch") return { ok: true };

  const isEmailOp = ["send-code", "forgot-password", "email-send-code"].includes(
    operation,
  );

  if (mode === "throttled" && isEmailOp) {
    return rejectBudget("BUDGET_THROTTLED", 429);
  }

  if (mode === "degraded" && (isEmailOp || operation === "register")) {
    return rejectBudget("BUDGET_DEGRADED", 429);
  }

  if (mode === "emergency" && operation !== "login") {
    return rejectBudget("BUDGET_EMERGENCY", 503);
  }

  return { ok: true };
}

function rejectBudget(
  code: string,
  status: number,
): { ok: false; response: Response } {
  return {
    ok: false,
    response: new Response(
      JSON.stringify({ ok: false, error: code }),
      {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    ),
  };
}

export async function getUsageSnapshot(): Promise<{
  date: string;
  mode: BudgetMode;
  counts: Record<string, number>;
  total: number;
}> {
  const date = todayUtc();
  const mode = await getCurrentMode();
  const emailCount = await getEmailCount();
  return {
    date,
    mode,
    counts: { "email-total": emailCount },
    total: emailCount,
  };
}
