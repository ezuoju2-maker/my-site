import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

type RegisterBody = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
};

function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
  origin: string | null = null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
      ...headers,
    },
  });
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,32}$/.test(username);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const saltBase64 = btoa(
    String.fromCharCode(...salt),
  );

  const hashBase64 = btoa(
    String.fromCharCode(...new Uint8Array(bits)),
  );

  return `pbkdf2-sha256$100000$${saltBase64}$${hashBase64}`;
}

export async function OPTIONS({ request }: { request: Request }) {
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
}

export async function POST({ request }: { request: Request }) {
  const origin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
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
  }

  const originError = rejectCrossSiteRequest(request);

  if (originError) {
    return originError;
  }

  let body: RegisterBody;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        error: "INVALID_REQUEST",
      },
      400,
      {},
      origin,
    );
  }

  const username =
    typeof body.username === "string"
      ? body.username.trim()
      : "";

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (!isValidUsername(username)) {
    return json(
      {
        ok: false,
        error: "INVALID_USERNAME",
      },
      400,
      {},
      origin,
    );
  }

  if (!isValidEmail(email)) {
    return json(
      {
        ok: false,
        error: "INVALID_EMAIL",
      },
      400,
      {},
      origin,
    );
  }

  if (password.length < 8 || password.length > 128) {
    return json(
      {
        ok: false,
        error: "INVALID_PASSWORD",
      },
      400,
      {},
      origin,
    );
  }

  try {
    const existing = await env.DB
      .prepare(
        "SELECT 1 FROM users WHERE username = ?1 OR email = ?2 LIMIT 1",
      )
      .bind(username, email)
      .first();

    if (existing) {
      return json(
        {
          ok: false,
          error: "USERNAME_OR_EMAIL_EXISTS",
        },
        409,
        {},
        origin,
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await env.DB
      .prepare(
        `INSERT INTO users
          (id, username, email, password_hash)
         VALUES (?1, ?2, ?3, ?4)`,
      )
      .bind(id, username, email, passwordHash)
      .run();

    return json(
      {
        ok: true,
        user: {
          id,
          username,
          email,
        },
      },
      201,
      {},
      origin,
    );
  } catch {
    return json(
      {
        ok: false,
        error: "USERNAME_OR_EMAIL_EXISTS",
      },
      409,
      {},
      origin,
    );
  }
}
