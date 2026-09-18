import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "INVALID_EMAIL" }, 400);

  const db = env.DB;
  if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500);

  try {
    const user = await db.prepare("SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1").bind(email).first();
    return json({ ok: true, registered: !!user });
  } catch (e) {
    console.error("check-email failed", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500);
  }
};
