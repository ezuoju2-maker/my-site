import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getSession } from "../../../lib/auth";
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  if (import.meta.env.GITHUB_PAGES === "true") {
    return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
  }

  try {
    const session = await getSession(request);

    if (!session) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    const user = await env.DB.prepare(
      "SELECT id, username, email FROM users WHERE id = ?1 LIMIT 1",
    )
      .bind(session.userId)
      .first<{ id: string; username: string; email: string }>();

    if (!user) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    return json(
      {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("Session lookup error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
