import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export async function GET() {
  if (import.meta.env.GITHUB_PAGES === "true") {
    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "skipped",
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
    // 只做一次最小查询验证 D1 可用，不暴露内部结构
    await env.DB.prepare("SELECT 1 AS ok").first();

    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "ok",
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
