import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../lib/permissions";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";
import {
  hashPassword,
  verifyPassword,
  clearSessionCookie,
  deleteSession,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "../../../lib/auth";
import { notifyPasswordChanged } from "../../../lib/notify";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function isValidPassword(password: string) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { oldPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const oldPassword =
    typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!oldPassword || !newPassword) {
    return json({ ok: false, error: "INVALID_REQUEST" }, 400, origin);
  }

  if (!isValidPassword(newPassword)) {
    return json({ ok: false, error: "INVALID_NEW_PASSWORD" }, 400, origin);
  }

  if (oldPassword === newPassword) {
    return json({ ok: false, error: "SAME_AS_OLD" }, 400, origin);
  }

  try {
    const user = await env.DB.prepare(
      `SELECT password_hash FROM users WHERE id = ?1 LIMIT 1`,
    )
      .bind(auth.session.userId)
      .first<{ password_hash: string }>();

    if (!user) {
      return json({ ok: false, error: "UNAUTHENTICATED" }, 401, origin);
    }

    const oldValid = await verifyPassword(oldPassword, user.password_hash);
    if (!oldValid) {
      return json({ ok: false, error: "INVALID_OLD_PASSWORD" }, 400, origin);
    }

    const newHash = await hashPassword(newPassword);

    const userInfo = await env.DB.prepare(
      "SELECT email FROM users WHERE id = ?1 LIMIT 1",
    )
      .bind(auth.session.userId)
      .first<{ email: string }>();

    await env.DB.prepare(
      `UPDATE users
       SET password_hash = ?1,
           session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
      .bind(newHash, auth.session.userId)
      .run();

    // 通知当前邮箱（fire-and-forget，带 3 秒超时）
    if (userInfo?.email) {
      notifyPasswordChanged(userInfo.email).catch(() => {});
    }

    // 改密后让当前 session 也失效，强制重新登录。
    await deleteSession(request);

    return new Response(
      JSON.stringify({ ok: true, relogin: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Set-Cookie": clearSessionCookie(),
          ...(origin ? corsHeaders(origin) : {}),
        },
      },
    );
  } catch (error) {
    console.error("Password change error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
