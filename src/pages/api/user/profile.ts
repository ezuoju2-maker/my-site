import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const DISPLAY_NAME_MAX = 30;
const BIO_MAX = 200;

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

type UserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
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
    const user = await env.DB.prepare(
      `SELECT id, username, email, role, display_name, avatar_url, bio, created_at
       FROM users WHERE id = ?1 LIMIT 1`,
    )
      .bind(auth.session.userId)
      .first<UserRow>();

    if (!user) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    return json(
      {
        ok: true,
        profile: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || "user",
          displayName: user.display_name || user.username,
          avatarUrl: user.avatar_url || null,
          bio: user.bio || "",
          createdAt: user.created_at,
        },
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("Profile GET error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { displayName?: unknown; bio?: unknown; avatarUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  // displayName：可选，字符串，去空白后 1-30 字符
  let displayName: string | null = null;
  if (typeof body.displayName === "string") {
    const trimmed = body.displayName.trim();
    if (trimmed.length > DISPLAY_NAME_MAX) {
      return json({ ok: false, error: "DISPLAY_NAME_TOO_LONG" }, 400, origin);
    }
    displayName = trimmed.length > 0 ? trimmed : null;
  }

  // avatarUrl：可选，字符串，http(s) 开头或空
  let avatarUrl: string | null = null;
  if (typeof body.avatarUrl === "string") {
    const trimmed = body.avatarUrl.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > 500) {
        return json({ ok: false, error: "AVATAR_URL_TOO_LONG" }, 400, origin);
      }
      if (!/^https?:\/\//i.test(trimmed)) {
        return json({ ok: false, error: "AVATAR_URL_INVALID" }, 400, origin);
      }
      avatarUrl = trimmed;
    }
  } else if (body.avatarUrl === null) {
    avatarUrl = null;
  } else {
    // 未传 avatarUrl：保持原值（不修改）
    avatarUrl = undefined as unknown as null;
  }

  // bio：可选，字符串，去空白后 0-200 字符
  let bio: string | null = null;
  if (typeof body.bio === "string") {
    const trimmed = body.bio.trim();
    if (trimmed.length > BIO_MAX) {
      return json({ ok: false, error: "BIO_TOO_LONG" }, 400, origin);
    }
    bio = trimmed.length > 0 ? trimmed : null;
  }

  try {
    // avatarUrl === undefined 表示不修改；null 表示清空
    if (avatarUrl === (undefined as unknown as null)) {
      await env.DB.prepare(
        `UPDATE users
         SET display_name = ?1, bio = ?2, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?3`,
      )
        .bind(displayName, bio, auth.session.userId)
        .run();
    } else {
      await env.DB.prepare(
        `UPDATE users
         SET display_name = ?1, bio = ?2, avatar_url = ?3, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?4`,
      )
        .bind(displayName, bio, avatarUrl, auth.session.userId)
        .run();
    }

    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Profile PATCH error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
