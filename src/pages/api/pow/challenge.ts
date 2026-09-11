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
    let body: { behaviorScore?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // 允许空 body（旧客户端 / curl）
    }
    const behaviorScore =
      typeof body.behaviorScore === "number" &&
      Number.isInteger(body.behaviorScore) &&
      body.behaviorScore >= 0
        ? body.behaviorScore
        : -1; // -1 = 未知，不惩罚

    const { ip, userAgent } = extractClientIdentity(request);
    const c = await createChallenge(ip, userAgent, behaviorScore);

    if (c === null) {
      return new Response(JSON.stringify({ error: "POW_BLOCKED" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      });
    }

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
