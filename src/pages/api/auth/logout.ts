import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  clearSessionCookie,
  deleteSession,
} from "../../../lib/auth";

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
    await deleteSession(request);

    return json(
      {
        ok: true,
      },
      200,
      {
        "Set-Cookie": clearSessionCookie(),
      },
      origin,
    );
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
