import type { APIRoute } from "astro";
import { getCurrentMode } from "../../../lib/budget";
import { getUsageForDay } from "../../../lib/usage-log";
import { requireRole } from "../../../lib/permissions";
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const date = new Date().toISOString().slice(0, 10);
    const mode = await getCurrentMode();
    const counts = await getUsageForDay(date);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return new Response(
      JSON.stringify({ ok: true, date, mode, counts, total }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      },
    );
  } catch (error) {
    console.error("usage snapshot error", error);
    return new Response(
      JSON.stringify({ ok: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(origin ? corsHeaders(origin) : {}),
        },
      },
    );
  }
};
