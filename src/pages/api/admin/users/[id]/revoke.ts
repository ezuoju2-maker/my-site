import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireRole } from "../../../../../lib/permissions";
import { recordAdminAction } from "../../../../../lib/admin-audit";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(
  data: unknown,
  status = 200,
  origin: string | null = null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
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
 * Admin 强制使某个用户所有 session 失效。
 *
 * 实现：session_version + 1
 * 效果：该用户所有设备下次请求 /api/* 时 401，需重新登录
 *
 * 保护：
 * - 只能 admin 调用
 * - 不能对自己操作（防误锁死）
 * - 目标用户必须存在
 */
export const POST: APIRoute = async ({ request, params }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireRole(request, "admin");
  if (!auth.ok) return auth.response;

  const targetId = params.id;
  if (!targetId || typeof targetId !== "string") {
    return json({ ok: false, error: "INVALID_ID" }, 400, origin);
  }

  if (targetId === auth.session.userId) {
    return json({ ok: false, error: "CANNOT_REVOKE_SELF" }, 400, origin);
  }

  try {
    const target = await env.DB.prepare(
      "SELECT username FROM users WHERE id = ?1 LIMIT 1",
    )
      .bind(targetId)
      .first<{ username: string }>();

    if (!target) {
      return json({ ok: false, error: "USER_NOT_FOUND" }, 404, origin);
    }

    const result = await env.DB.prepare(
      `UPDATE users
       SET session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?1`,
    )
      .bind(targetId)
      .run();

    if (!result.success) {
      throw new Error("session_version update failed");
    }

    recordAdminAction({
      actorId: auth.session.userId,
      actorUsername: auth.session.username,
      action: "session.revoke",
      targetId,
      targetUsername: target.username,
      details: null,
    }).catch(() => {});

    return json({ ok: true, target: target.username }, 200, origin);
  } catch (error) {
    console.error("admin revoke error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
