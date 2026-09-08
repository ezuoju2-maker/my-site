export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET({ request }: { request: Request }) {
  if (import.meta.env.GITHUB_PAGES === "true") {
    return json(
      {
        ok: false,
        error: "UNAUTHENTICATED",
      },
      401,
    );
  }

  try {
    const { getSession } = await import("../../../lib/auth");
    const session = await getSession(request);

    if (!session) {
      return json(
        {
          ok: false,
          error: "UNAUTHENTICATED",
        },
        401,
      );
    }

    return json({
      ok: true,
      user: {
        id: session.userId,
        username: session.username,
      },
    });
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
