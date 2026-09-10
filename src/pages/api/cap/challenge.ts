import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

async function proxyToCapWorker(request: Request, path: string) {
  const capWorker = (env as any).CAP_WORKER as
    | {
        fetch: (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => Promise<Response>;
      }
    | undefined;
  const capUrl = (env as any).CAP_WORKER_URL as string | undefined;

  if (!capWorker && !capUrl) {
    return new Response(
      JSON.stringify({ error: "CAP_WORKER not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const body = await request.text();
  const init: RequestInit = {
    method: request.method,
    headers: { "Content-Type": "application/json" },
    body,
  };

  if (capWorker) {
    return capWorker.fetch(`https://cap-worker.internal${path}`, init);
  }

  return fetch(`${capUrl}${path}`, init);
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);

  if (!origin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);

  // CSRF 保护：与业务 API 一致，写操作必须有合法 Origin
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const upstream = await proxyToCapWorker(request, "/api/challenge");

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "no-store");

  if (origin) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      headers.set(key, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};
