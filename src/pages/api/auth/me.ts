import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getSession, createSession, sessionCookie } from "../../../lib/auth";
import { getTrustedUser } from "../../../lib/trusted-device";
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
    let session = await getSession(request);
    let newSession: { token: string; maxAge: number | null } | null = null;

    // session 失效 → 尝试用 device_token 自动续期
    if (!session) {
      const trusted = await getTrustedUser(request);
      if (trusted) {
        // 查用户拿最新 session_version + username
        const row = await env.DB.prepare(
          "SELECT username, session_version FROM users WHERE id = ?1 LIMIT 1",
        )
          .bind(trusted.userId)
          .first<{ username: string; session_version: number }>();

        if (row && Number.isInteger(row.session_version)) {
          newSession = await createSession(
            trusted.userId,
            row.username,
            true,
            row.session_version,
          );
          session = {
            token: newSession.token,
            userId: trusted.userId,
            username: row.username,
            sessionVersion: row.session_version,
            role: "user",
          };
        }
      }
    }

    if (!session) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    const user = await env.DB.prepare(
      "SELECT id, username, email, role, display_name, avatar_url FROM users WHERE id = ?1 LIMIT 1",
    )
      .bind(session.userId)
      .first<{ id: string; username: string; email: string; role: string; display_name: string | null; avatar_url: string | null }>();

    if (!user) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    const payload = {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url || null,
      },
    };

    // 有自动续期的 session → 手动构造 Response 设置 Set-Cookie
    if (newSession) {
      const headers = new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      if (origin) {
        for (const [k, v] of Object.entries(corsHeaders(origin))) {
          headers.set(k, v);
        }
      }
      headers.append("Set-Cookie", sessionCookie(newSession.token, newSession.maxAge));
      return new Response(JSON.stringify(payload), { status: 200, headers });
    }

    return json(payload, 200, origin);
  } catch (error) {
    console.error("Session lookup error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
