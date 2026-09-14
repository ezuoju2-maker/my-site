import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireRole } from "../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

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

  const auth = await requireRole(request, "admin");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const offsetRaw = Number.parseInt(url.searchParams.get("offset") ?? "", 10);
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= MAX_LIMIT
      ? limitRaw
      : DEFAULT_LIMIT;
  const offset =
    Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  try {
    // 用 LIMIT + 1 检测是否有下一页，避免全表 COUNT(*)
    const rowsResult = await env.DB.prepare(
      `SELECT id, username, email, role, display_name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ?1 OFFSET ?2`,
    )
      .bind(limit + 1, offset)
      .all<{
        id: string;
        username: string;
        email: string;
        role: string;
        display_name: string | null;
        created_at: string;
      }>();

    const allRows = rowsResult.results ?? [];
    const hasMore = allRows.length > limit;
    const users = allRows.slice(0, limit).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role || "user",
      displayName: u.display_name || u.username,
      createdAt: u.created_at,
    }));

    return json(
      {
        ok: true,
        users,
        hasMore,
        limit,
        offset,
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("admin users list error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
