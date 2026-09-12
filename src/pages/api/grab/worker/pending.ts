import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { decryptCredential } from "../../../../lib/grab/crypto";

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

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const GET: APIRoute = async ({ request }) => {
  // 抓号层密钥鉴权
  const grabKey = request.headers.get("X-Grab-Key") || "";
  const expectedKey = (env as any).GRAB_WORKER_SECRET as string | undefined;
  if (!expectedKey || grabKey !== expectedKey) {
    return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  }

  try {
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `SELECT q.id, q.platform_code, q.token_encrypted, q.expires_at, q.created_at,
              p.name AS platform_name, p.brand AS platform_brand, p.price AS platform_price
       FROM grab_qr_sessions q
       LEFT JOIN grab_platforms p ON p.code = q.platform_code
       WHERE q.status = 'waiting' AND q.expires_at > ?1
       ORDER BY q.created_at ASC
       LIMIT 20`
    ).bind(now).all<{
      id: string;
      platform_code: string;
      token_encrypted: string | null;
      expires_at: string;
      created_at: string;
      platform_name: string | null;
      platform_brand: string | null;
      platform_price: number | null;
    }>();

    const otpSecret = (env as any).OTP_SECRET as string | undefined;
    if (!otpSecret) return json({ ok: false, error: "SECRET_NOT_CONFIGURED" }, 500);

    const items = await Promise.all(
      (result.results ?? []).map(async (r) => {
        let token = "";
        if (r.token_encrypted) {
          try {
            token = await decryptCredential(r.token_encrypted, otpSecret);
          } catch {}
        }
        return {
          id: r.id,
          platform: r.platform_code,
          platformName: r.platform_name || r.platform_code,
          platformBrand: r.platform_brand || "737373",
          price: r.platform_price ?? 0,
          token,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
        };
      })
    );

    return json({ ok: true, count: items.length, orders: items });
  } catch (e) {
    console.error("grab worker pending error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500);
  }
};
