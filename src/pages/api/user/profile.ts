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

  // displayName：可选，字符串，去空白后 0-30 字符；未传表示不改，空串表示清空
  const hasDisplayName = "displayName" in body;
  let displayName: string | null = null;
  if (hasDisplayName) {
    if (typeof body.displayName !== "string") {
      return json({ ok: false, error: "INVALID_DISPLAY_NAME" }, 400, origin);
    }
    const trimmed = body.displayName.trim();
    if (trimmed.length > DISPLAY_NAME_MAX) {
      return json({ ok: false, error: "DISPLAY_NAME_TOO_LONG" }, 400, origin);
    }
    displayName = trimmed.length > 0 ? trimmed : null;
  }

  // avatarUrl：可选，支持三种值
  // - http(s)://... 公开链接
  // - data:image/... base64（前端压缩后上传）
  // - null 清空
  // - undefined（未传）不修改
  let avatarUrl: string | null | undefined = undefined;
  if (typeof body.avatarUrl === "string") {
    const trimmed = body.avatarUrl.trim();
    if (trimmed.length === 0) {
      avatarUrl = null;
    } else if (trimmed.length > 120_000) {
      return json({ ok: false, error: "AVATAR_TOO_LARGE" }, 400, origin);
    } else if (
      /^https:\/\//i.test(trimmed) ||
      /^data:image\/(jpeg|png|webp|gif);base64,/i.test(trimmed)
    ) {
      avatarUrl = trimmed;
    } else {
      return json({ ok: false, error: "AVATAR_URL_INVALID" }, 400, origin);
    }
  } else if (body.avatarUrl === null) {
    avatarUrl = null;
  }

  // bio：可选，字符串，去空白后 0-200 字符；未传表示不改，空串表示清空
  const hasBio = "bio" in body;
  let bio: string | null = null;
  if (hasBio) {
    if (typeof body.bio !== "string") {
      return json({ ok: false, error: "INVALID_BIO" }, 400, origin);
    }
    const trimmed = body.bio.trim();
    if (trimmed.length > BIO_MAX) {
      return json({ ok: false, error: "BIO_TOO_LONG" }, 400, origin);
    }
    bio = trimmed.length > 0 ? trimmed : null;
  }

  try {
    const sets: string[] = [];
    const binds: unknown[] = [];

    if (hasDisplayName) {
      sets.push(`display_name = ?${binds.length + 1}`);
      binds.push(displayName);
    }

    if (hasBio) {
      sets.push(`bio = ?${binds.length + 1}`);
      binds.push(bio);
    }

    if (avatarUrl !== undefined) {
      sets.push(`avatar_url = ?${binds.length + 1}`);
      binds.push(avatarUrl);
    }

    if (sets.length === 0) {
      return json({ ok: true }, 200, origin);
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    binds.push(auth.session.userId);

    await env.DB.prepare(
      `UPDATE users SET ${sets.join(", ")} WHERE id = ?${binds.length}`,
    )
      .bind(...binds)
      .run();

    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Profile PATCH error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
