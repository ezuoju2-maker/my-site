import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireRole } from "../../../../../lib/permissions";
import { isValidRole, USER_ROLES } from "../../../../../lib/roles";
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
      "Access-Control-Allow-Methods": "PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

/**
 * 修改用户角色。仅 admin 可调用。
 *
 * 保护：
 * - 不能改自己（防锁死）
 * - 只能改成 USER_ROLES 里的值
 * - 目标用户必须存在
 */
export const PATCH: APIRoute = async ({ request, params }) => {
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
    return json({ ok: false, error: "CANNOT_CHANGE_SELF" }, 400, origin);
  }

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  if (!isValidRole(body.role)) {
    return json(
      { ok: false, error: "INVALID_ROLE", allowed: [...USER_ROLES] },
      400,
      origin,
    );
  }

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM users WHERE id = ?1 LIMIT 1`,
    )
      .bind(targetId)
      .first<{ id: string }>();

    if (!existing) {
      return json({ ok: false, error: "USER_NOT_FOUND" }, 404, origin);
    }

    const result = await env.DB.prepare(
      `UPDATE users
       SET role = ?1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
      .bind(body.role, targetId)
      .run();

    if (!result.success) {
      throw new Error("role update failed");
    }

    return json({ ok: true, role: body.role }, 200, origin);
  } catch (error) {
    console.error("role update error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
