import { rejectCrossSiteRequest } from "../../../lib/cors";
import {
  clearSessionCookie,
  deleteSession,
} from "../../../lib/auth";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

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

  try {
    await deleteSession(request);

    return json(
      {
        ok: true,
      },
      200,
      {
        "Set-Cookie": clearSessionCookie(),
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
