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
