import { checkBudget } from "../../../lib/budget";
import { recordUsage } from "../../../lib/usage-log";
import { recordLogin } from "../../../lib/login-log";
import type { APIRoute } from "astro";
import { checkFormGuard } from "../../../lib/form-guard";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import { incrementLimit, resetLimit } from "../../../lib/rate-limit";
import { createTrustedDevice, deviceCookie } from "../../../lib/trusted-device";
import { logUserDevice } from "../../../lib/device-logger";
import { assessLoginRisk } from "../../../lib/risk-engine";
import {
  createSession,
  sessionCookie,
  verifyPassword,
} from "../../../lib/auth";
import {
  extractCaptchaToken,
  verifyCaptcha,
} from "../../../lib/captcha";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

type LoginBody = {
  identifier?: unknown;
  password?: unknown;
  remember?: unknown;
  captchaToken?: unknown;
  fingerprint?: unknown;
};

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS_PER_IDENTIFIER = 10;
const LOGIN_MAX_ATTEMPTS_PER_IP = 30;

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin: string | null = null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
      ...headers,
    },
  });
}

function getClientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function normalizeIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}


export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const budget = await checkBudget("login");
  if (!budget.ok) return budget.response;
  await recordUsage("login").catch(() => {});
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const guard = checkFormGuard(body);
  if (!guard.ok) {
    return json({ ok: false, error: guard.error }, 400, {}, origin);
  }

  const identifier = normalizeIdentifier(body.identifier);
  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember === true;
    const captchaToken = extractCaptchaToken(body);
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) {
      return json(
        { ok: false, error: "CAPTCHA_FAILED" },
        403,
        {},
        origin,
      );
    }

  if (!identifier || !password) {
    return json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      401,
      {},
      origin,
    );
  }

  const kv = env.SESSION;
  if (!kv) {
    console.error("SESSION KV binding is not configured");
    return json(
      { ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" },
      500,
      {},
      origin,
    );
  }

  const clientIp = getClientIp(request);
  const identifierKey = `login-attempts:${clientIp}:${identifier}`;
  const ipKey = `login-ip-attempts:${clientIp}`;

  try {
    const identifierLimited = (await incrementLimit(identifierKey, LOGIN_WINDOW_SECONDS, LOGIN_MAX_ATTEMPTS_PER_IDENTIFIER)).limited;
    const ipLimited = (await incrementLimit(ipKey, LOGIN_WINDOW_SECONDS, LOGIN_MAX_ATTEMPTS_PER_IP)).limited;

    if (identifierLimited || ipLimited) {
      return json(
        {
          ok: false,
          error: "TOO_MANY_REQUESTS",
          retryAfter: LOGIN_WINDOW_SECONDS,
        },
        429,
        { "Retry-After": String(LOGIN_WINDOW_SECONDS) },
        origin,
      );
    }

    const user = await env.DB.prepare(
      `SELECT id, username, email, password_hash, session_version, role
       FROM users
       WHERE lower(username) = ?1 OR lower(email) = ?1
       LIMIT 1`,
    )
      .bind(identifier)
      .first<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        session_version: number;
        role: string;
      }>();

    if (!user) {
      // 用户不存在时也执行一次 PBKDF2 计算，抵消时序差异（防账号枚举）
      await verifyPassword(password, "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA").catch(() => {});
      return json(
        { ok: false, error: "INVALID_CREDENTIALS" },
        401,
        {},
        origin,
      );
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      return json(
        { ok: false, error: "INVALID_CREDENTIALS" },
        401,
        {},
        origin,
      );
    }

    await resetLimit(identifierKey);
    await resetLimit(ipKey);

    const session = await createSession(
      user.id,
      user.username,
      remember,
      Number.isInteger(user.session_version) ? user.session_version : 1,
    );

    // 用户勾选"记住登录" → 同时创建 90 天信任设备
    let deviceToken: string | null = null;
    if (remember) {
      try {
        deviceToken = await createTrustedDevice(
          user.id,
          request.headers.get("User-Agent") || "unknown",
        );
      } catch (err) {
        console.warn("[login] createTrustedDevice failed", err);
      }
    }

    // Fire-and-forget: record login history
    recordLogin(user.id, request).catch(() => {});

    // 设备指纹落库
    let deviceId: string | null = null;
    let riskResult: any = null;
    try {
      const cf = (request as any).cf;
      const location = cf
        ? [cf.city, cf.region, cf.country].filter(Boolean).join(", ")
        : "未知";
      deviceId = await logUserDevice(env.DB, user.id, clientIp, location, (body as any).fingerprint);
      try {
        const prev = await env.DB.prepare(
          "SELECT device_id, ip_address, location, last_login_at, browser_name, os_name FROM user_login_devices WHERE user_id = ?1 AND device_id != ?2 ORDER BY last_login_at DESC LIMIT 1"
        ).bind(user.id, deviceId).first();
        riskResult = assessLoginRisk({
          device_id: deviceId,
          ip_address: clientIp,
          location,
          browser_name: "unknown",
          os_name: "unknown",
        }, (prev as any) || null);
        await env.DB.prepare(
          "UPDATE user_login_devices SET risk_score=?1, risk_level=?2, risk_signals=?3, is_new_device=?4 WHERE user_id=?5 AND device_id=?6"
        ).bind(riskResult.score, riskResult.level, JSON.stringify(riskResult.signals), riskResult.signals.isNewDevice ? 1 : 0, user.id, deviceId).run();
      } catch (e) { console.warn("[login] risk failed", e); }
    } catch (err) {
      console.warn("[login] logUserDevice failed", err);
    }

    // 手动构造 Response（要设置两个 Set-Cookie）
    const resHeaders = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    if (origin) {
      const cors = corsHeaders(origin);
      for (const [k, v] of Object.entries(cors)) {
        resHeaders.set(k, v);
      }
    }
    resHeaders.append("Set-Cookie", sessionCookie(session.token, session.maxAge));
    if (deviceToken) {
      resHeaders.append("Set-Cookie", deviceCookie(deviceToken));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || "user",
        },
        device_id: deviceId,
        risk: riskResult ? { score: riskResult.score, level: riskResult.level, isNewDevice: riskResult.signals.isNewDevice, reasons: riskResult.reasons } : null,
      }),
      { status: 200, headers: resHeaders },
    );
  } catch (error) {
    console.error("Login error", error);
    return json(
      { ok: false, error: "INTERNAL_ERROR" },
      500,
      {},
      origin,
    );
  }
};
