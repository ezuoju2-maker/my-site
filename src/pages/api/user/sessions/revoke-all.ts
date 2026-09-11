import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../../lib/cors";
import {
  clearSessionCookie,
  deleteSession,
} from "../../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

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
 * 退出所有设备：
 * 1. session_version + 1 → 所有现存 session 的校验失败
 * 2. 删除当前 session（本次请求的 token）
 * 3. 清 cookie
 *
 * 效果：包括当前设备在内，所有登录态全部失效。
 */
export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await env.DB.prepare(
      `UPDATE users
       SET session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?1`,
    )
      .bind(auth.session.userId)
      .run();

    if (!result.success) {
      throw new Error("session_version update failed");
    }

    await deleteSession(request);

    return json(
      { ok: true },
      200,
      { "Set-Cookie": clearSessionCookie() },
      origin,
    );
  } catch (error) {
    console.error("revoke-all error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, {}, origin);
  }
};
