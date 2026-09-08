import { rejectCrossSiteRequest } from "../../../lib/cors";
import { env } from "cloudflare:workers";
import {
  createSession,
  sessionCookie,
  verifyPassword,
} from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

type LoginBody = {
  identifier?: unknown;
  password?: unknown;
};

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function POST({ request }: { request: Request }) {
  const originError = rejectCrossSiteRequest(request);

  if (originError) {
    return originError;
  }

  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        error: "INVALID_REQUEST",
      },
      400,
    );
  }

  const identifier =
    typeof body.identifier === "string"
      ? body.identifier.trim().toLowerCase()
      : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (!identifier || !password) {
    return json(
      {
        ok: false,
        error: "INVALID_CREDENTIALS",
      },
      401,
    );
  }

  try {
    const user = await env.DB
      .prepare(
        `SELECT id, username, email, password_hash
         FROM users
         WHERE lower(username) = ?1 OR lower(email) = ?1
         LIMIT 1`,
      )
      .bind(identifier)
      .first<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
      }>();

    if (!user) {
      return json(
        {
          ok: false,
          error: "INVALID_CREDENTIALS",
        },
        401,
      );
    }

    const valid = await verifyPassword(
      password,
      user.password_hash,
    );

    if (!valid) {
      return json(
        {
          ok: false,
          error: "INVALID_CREDENTIALS",
        },
        401,
      );
    }

    const session = await createSession(
      user.id,
      user.username,
    );

    return json(
      {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      200,
      {
        "Set-Cookie": sessionCookie(
          session.token,
          session.maxAge,
        ),
      },
    );
  } catch {
    return json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
      },
      500,
    );
  }
}
