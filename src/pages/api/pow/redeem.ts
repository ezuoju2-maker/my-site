import type { APIRoute } from "astro";
import { redeemChallenge } from "../../../lib/pow";
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

  let body: { challenge_id?: unknown; nonce?: unknown; signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  }

  try {
    const token = await redeemChallenge(
      body.challenge_id,
      body.nonce,
      body.signature,
    );

    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "POW_INVALID" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      });
    }

    return new Response(JSON.stringify({ ok: true, token }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  } catch (error) {
    console.error("pow redeem error", error);
    return new Response(JSON.stringify({ ok: false, error: "POW_UNAVAILABLE" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(origin ? corsHeaders(origin) : {}),
      },
    });
  }
};
