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
    BREVO_API_KEY?: string;
    SESSION?: KVNamespace;
  } | undefined;

  const brevoApiKey = env?.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.error("BREVO_API_KEY is not configured");
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

  const cooldown = await kv.get(cooldownKey);

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

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "my-site",
        email: "ezuoju2@gmail.com",
      },
      to: [
        {
          email,
        },
      ],
      subject: "my-site 注册验证码",
      textContent: `你的 my-site 注册验证码是：${code}\n\n验证码 10 分钟内有效。如果不是你本人操作，请忽略此邮件。`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.7">
          <h2>my-site 注册验证码</h2>
          <p>你的验证码是：</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p>
          <p>验证码 10 分钟内有效。</p>
          <p>如果不是你本人操作，请忽略此邮件。</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Brevo send failed", response.status, errorText);

    return json(
      { ok: false, error: "EMAIL_SEND_FAILED" },
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
