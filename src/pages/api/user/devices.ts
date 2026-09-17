import type { APIRoute } from "astro";
import { requireAuth } from "../../../lib/permissions";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

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
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const db = env.DB;
    if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, origin);

    const result = await db
      .prepare(
        `SELECT device_id, device_type, device_model, model_confidence,
                os_version, browser, first_login_at, last_login_at,
                ip_address, location
         FROM user_login_devices
         WHERE user_id = ?1
         ORDER BY last_login_at DESC
         LIMIT 50`,
      )
      .bind(auth.session.userId)
      .all<{
        device_id: string;
        device_type: string | null;
        device_model: string | null;
        model_confidence: string | null;
        os_version: string | null;
        browser: string | null;
        first_login_at: string | null;
        last_login_at: string | null;
        ip_address: string | null;
        location: string | null;
      }>();

    const devices = (result.results ?? []).map((r) => ({
      deviceId: r.device_id,
      deviceType: r.device_type,
      deviceModel: r.device_model,
      modelConfidence: r.model_confidence,
      osVersion: r.os_version,
      browser: r.browser,
      firstLoginAt: r.first_login_at,
      lastLoginAt: r.last_login_at,
      ipAddress: r.ip_address,
      location: r.location,
    }));

    return json({ ok: true, devices }, 200, origin);
  } catch (error) {
    console.error("list devices error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("device_id");

  if (!deviceId || deviceId.length > 128) {
    return json({ ok: false, error: "INVALID_DEVICE_ID" }, 400, origin);
  }

  try {
    const db = env.DB;
    if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, origin);

    const result = await db
      .prepare(
        "DELETE FROM user_login_devices WHERE user_id = ?1 AND device_id = ?2",
      )
      .bind(auth.session.userId, deviceId)
      .run();

    if (!result.success || (result.meta?.changes ?? 0) === 0) {
      return json({ ok: false, error: "DEVICE_NOT_FOUND" }, 404, origin);
    }

    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("revoke device error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
