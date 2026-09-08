export const prerender = import.meta.env.GITHUB_PAGES === "true";

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "my-site-api",
      timestamp: new Date().toISOString(),
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
