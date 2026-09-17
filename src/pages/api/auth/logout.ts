import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  clearSessionCookie,
  deleteSession,
} from "../../../lib/auth";
import {
  deleteTrustedDevice,
  clearDeviceCookie,
} from "../../../lib/trusted-device";

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

export async function OPTIONS({ request }: { request: Request }) {
  const origin = getAllowedOrigin(request);

  if (!origin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST({ request }: { request: Request }) {
  const origin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
    if (!origin) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(origin),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const originError = rejectCrossSiteRequest(request);

  if (originError) {
    return originError;
  }

  try {
    // ?full=1 表示"彻底退出"，同时清除 device_token
    const full = new URL(request.url).searchParams.get("full") === "1";

    await deleteSession(request);

    if (full) {
      try {
        await deleteTrustedDevice(request);
      } catch (err) {
        console.warn("[logout] deleteTrustedDevice failed", err);
      }
    }

    // 手动构造 Response，需要 append 两个 Set-Cookie
    const resHeaders = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    if (origin) {
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        resHeaders.set(k, v);
      }
    }
    resHeaders.append("Set-Cookie", clearSessionCookie());
    if (full) {
      resHeaders.append("Set-Cookie", clearDeviceCookie());
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: resHeaders,
    });
  } catch {
    return json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
      },
      500,
      {},
      origin,
    );
  }
}
