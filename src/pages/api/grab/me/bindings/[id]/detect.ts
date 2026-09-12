import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200, origin: string | null = null) {
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
  return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
};

/**
 * 触发一次检测。
 * 说明：当前返回 unknown 状态（占位）。等接入真实平台 API 后，
 * 按平台能力返回 online/offline 和 normal/risk/banned 等状态。
 * 绝不能因为 API 失败就推断为封禁。
 */
export const POST: APIRoute = async ({ request, params }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return json({ ok: false, error: "INVALID_ID" }, 400, origin);

  try {
    const exists = await env.DB.prepare(
      "SELECT id, account_id FROM grab_bindings WHERE id = ?1 AND user_id = ?2 AND status = 'active' LIMIT 1"
    ).bind(id, auth.session.userId).first<{ id: string; account_id: string }>();

    if (!exists) return json({ ok: false, error: "NOT_FOUND" }, 404, origin);

    // TODO: 接入真实平台 API 检测
    // 目前返回 unknown，符合"无法检测不代表异常"的原则
    const now = new Date().toISOString();
    const onlineStatus = "unknown";
    const accountStatus = "unknown";

    await env.DB.prepare(
      `UPDATE grab_bindings
       SET last_detected_at = ?1, last_online_status = ?2, last_account_status = ?3, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`
    ).bind(now, onlineStatus, accountStatus, id).run();

    return json({
      ok: true,
      detectedAt: now,
      onlineStatus,
      accountStatus,
    }, 200, origin);
  } catch (e) {
    console.error("binding detect error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
