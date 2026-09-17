import type { APIRoute } from "astro";
import { requireAuth } from "../../../lib/permissions";
import {
  listTrustedDevices,
  revokeDeviceById,
} from "../../../lib/trusted-device";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

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
    const devices = await listTrustedDevices(auth.session.userId);
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
  const deviceId = url.searchParams.get("id");

  if (!deviceId || deviceId.length > 64) {
    return json({ ok: false, error: "INVALID_DEVICE_ID" }, 400, origin);
  }

  try {
    const ok = await revokeDeviceById(auth.session.userId, deviceId);
    if (!ok) {
      return json({ ok: false, error: "DEVICE_NOT_FOUND" }, 404, origin);
    }
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("revoke device error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
