import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

type UsersTableRow = {
  name: string;
};

export async function GET() {
  if (import.meta.env.GITHUB_PAGES === "true") {
    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "skipped-on-github-pages",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const row = await env.DB
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users' LIMIT 1",
      )
      .first<UsersTableRow>();

    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "connected",
        usersTable: row?.name === "users",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        service: "my-site-api",
        database: "error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
