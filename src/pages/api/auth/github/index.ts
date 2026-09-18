import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

export const GET: APIRoute = async ({ request }) => {
  // 动态获取当前域名（支持 q8top.cc.cd / xx-drp.pages.dev）
  const origin = new URL(request.url).origin;
  const REDIRECT_URI = `${origin}/api/auth/github/callback`;

  // 根据访问域名选择对应的 GitHub App
  const isPages = origin.includes("xx-drp.pages.dev");
  const clientId = isPages
    ? (env as any).GITHUB_CLIENT_ID_PAGES || env.GITHUB_CLIENT_ID
    : env.GITHUB_CLIENT_ID;

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
