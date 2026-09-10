import { getSession, type ActiveSession } from "./auth";

export type AuthResult =
  | { ok: true; session: ActiveSession }
  | { ok: false; response: Response };

/**
 * API 用：要求已登录。未登录返回 401 JSON。
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const session = await getSession(request);

  if (!session) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ ok: false, error: "UNAUTHENTICATED" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      ),
    };
  }

  return { ok: true, session };
}

/**
 * API 用：要求指定角色。
 *
 * - 未登录 → 401（正常，让前端知道要登录）
 * - 已登录但角色不对 → 404（避免暴露 /admin 路由的存在）
 */
export async function requireRole(
  request: Request,
  role: string,
): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;

  if (result.session.role !== role) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ ok: false, error: "NOT_FOUND" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      ),
    };
  }

  return result;
}
