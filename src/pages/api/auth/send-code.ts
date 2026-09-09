import type { APIRoute } from "astro";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../lib/cors";

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin?: string | null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getClientKey(request: Request, email: string) {
  const forwarded = request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")
    || "unknown";

  return `${forwarded}:${email}`;
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
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const origin = getAllowedOrigin(request);

  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return json(
      { ok: false, error: "INVALID_JSON" },
      400,
      {},
      origin,
    );
  }

  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    return json(
      { ok: false, error: "INVALID_EMAIL" },
      400,
      {},
      origin,
    );
  }

  const runtime = (locals as any).runtime;
  const env = runtime?.env as {
    RESEND_API_KEY?: string;
    SESSION?: KVNamespace;
  } | undefined;

  const resendApiKey = env?.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured");
    return json(
      { ok: false, error: "EMAIL_SERVICE_NOT_CONFIGURED" },
      500,
      {},
      origin,
    );
  }

  const kv = env?.SESSION;

  if (!kv) {
    console.error("SESSION KV binding is not configured");
    return json(
      { ok: false, error: "SESSION_SERVICE_NOT_CONFIGURED" },
      500,
      {},
      origin,
    );
  }

  const clientKey = getClientKey(request, email);
  const cooldownKey = `email-code-cooldown:${clientKey}`;
  const codeKey = `email-code:${email}`;

  let cooldown: string | null;

  try {
    cooldown = await kv.get(cooldownKey);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("SESSION KV get failed", detail);

    return json(
      {
        ok: false,
        error: "SESSION_KV_GET_FAILED",
        detail,
      },
      500,
      {},
      origin,
    );
  }

  if (cooldown) {
    return json(
      {
        ok: false,
        error: "TOO_MANY_REQUESTS",
        retryAfter: RESEND_COOLDOWN_SECONDS,
      },
      429,
      {
        "Retry-After": String(RESEND_COOLDOWN_SECONDS),
      },
      origin,
    );
  }

  const code = randomCode();

  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "my-site <noreply@ezuoju.dynv6.net>",
        to: [email],
        subject: "my-site 注册验证码",
        html: `<p>您的 my-site 注册验证码是：</p><p style="font-size:24px;font-weight:bold;">${code}</p><p>验证码 10 分钟内有效。</p>`,
        text: `您的 my-site 注册验证码是：${code}，10 分钟内有效。`,
      }),
    });
  } catch (error) {
    console.error("Resend fetch exception", error);

    return json(
      { ok: false, error: "EMAIL_PROVIDER_UNREACHABLE" },
      502,
      {},
      origin,
    );
  }

  if (!response.ok) {
    let providerBody = "";

    try {
      providerBody = await response.text();
    } catch (error) {
      console.error("Failed to read Resend error response", error);
    }

    console.error("Resend API error", response.status, providerBody);

    return json(
      { ok: false, error: "EMAIL_PROVIDER_ERROR" },
      502,
      {},
      origin,
    );
  }

  await kv.put(codeKey, code, {
    expirationTtl: CODE_TTL_SECONDS,
  });

  await kv.put(cooldownKey, "1", {
    expirationTtl: RESEND_COOLDOWN_SECONDS,
  });

  return json(
    {
      ok: true,
      expiresIn: CODE_TTL_SECONDS,
      retryAfter: RESEND_COOLDOWN_SECONDS,
    },
    200,
    {},
    origin,
  );
};
