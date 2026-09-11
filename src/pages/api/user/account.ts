import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  verifyPassword,
  deleteSession,
  clearSessionCookie,
} from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const CONFIRM_TEXT = "DELETE";

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

/**
 * 用户自助删除账号。
 *
 * 验证：
 * - 已登录
 * - 提供当前密码且密码正确
 * - 提供确认字符串 "DELETE"
 *
 * 删除：
 * - users 表对应行
 * - 当前 session（KV）
 * - cookie
 *
 * 不删除：
 * - usage_logs（聚合计数，无个人信息）
 */
export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { password?: unknown; confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, {}, origin);
  }

  const password = typeof body.password === "string" ? body.password : "";
  const confirm = typeof body.confirm === "string" ? body.confirm : "";

  if (!password) {
    return json({ ok: false, error: "PASSWORD_REQUIRED" }, 400, {}, origin);
  }

  if (confirm !== CONFIRM_TEXT) {
    return json({ ok: false, error: "INVALID_CONFIRM" }, 400, {}, origin);
  }

  try {
    const user = await env.DB.prepare(
      `SELECT password_hash FROM users WHERE id = ?1 LIMIT 1`,
    )
      .bind(auth.session.userId)
      .first<{ password_hash: string }>();

    if (!user) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, {}, origin);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return json({ ok: false, error: "INVALID_PASSWORD" }, 400, {}, origin);
    }

    // 删除用户行
    const result = await env.DB.prepare(
      `DELETE FROM users WHERE id = ?1`,
    )
      .bind(auth.session.userId)
      .run();

    if (!result.success) {
      throw new Error("user delete failed");
    }

    // 删除 session
    await deleteSession(request);

    return json(
      { ok: true },
      200,
      { "Set-Cookie": clearSessionCookie() },
      origin,
    );
  } catch (error) {
    console.error("account delete error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }
};
