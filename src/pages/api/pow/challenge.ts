import type { APIRoute } from "astro";
import { createChallenge, extractClientIdentity } from "../../../lib/pow";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  try {
    const { ip, userAgent } = extractClientIdentity(request);
    const c = await createChallenge(ip, userAgent);
    return new Response(JSON.stringify(c), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (error) {
    console.error("pow challenge error", error);
    return new Response(JSON.stringify({ error: "POW_UNAVAILABLE" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  }
};
