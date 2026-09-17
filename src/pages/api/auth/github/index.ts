import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

const FRONTEND_ORIGIN = "https://xx-drp.pages.dev";
const REDIRECT_URI = `${FRONTEND_ORIGIN}/api/auth/github/callback`;

export const GET: APIRoute = async ({ request }) => {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID not configured", { status: 500 });
  }

  const kv = env.SESSION;
  if (!kv) {
    return new Response("KV unavailable", { status: 500 });
  }

  // 生成 state 防 CSRF
  const state = crypto.randomUUID();
  await kv.put(`github_oauth_state:${state}`, "1", { expirationTtl: 600 });

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");

  return Response.redirect(url.toString(), 302);
};
