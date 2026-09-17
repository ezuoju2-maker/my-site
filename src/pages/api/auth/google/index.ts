import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const FRONTEND_ORIGIN = "https://xx-drp.pages.dev";
const REDIRECT_URI = `${FRONTEND_ORIGIN}/api/auth/google/callback`;

export const GET: APIRoute = async ({ request }) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  }

  // 生成 state 防 CSRF
  const state = crypto.randomUUID();
  const kv = env.SESSION;
  if (kv) {
    await kv.put(`google_oauth_state:${state}`, "1", { expirationTtl: 600 });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return Response.redirect(url.toString(), 302);
};
