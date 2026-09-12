import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashToken, encryptCredential } from "../../../../lib/grab/crypto";
import { corsHeaders, getAllowedOrigin } from "../../../../lib/cors";

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

function genAuthCode(platform: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) s += chars[b % chars.length];
  return platform.slice(0, 3).toUpperCase() + "-" + s;
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request }) => {
  // 抓号层密钥鉴权
  const grabKey = request.headers.get("X-Grab-Key") || "";
  const expectedKey = (env as any).GRAB_WORKER_SECRET as string | undefined;
  if (!expectedKey || grabKey !== expectedKey) {
    return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  }

  let body: {
    token?: unknown;
    nickname?: unknown;
    externalId?: unknown;
    avatar?: unknown;
    credential?: unknown;
    ttlDays?: unknown;
  };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  const nickname = typeof body.nickname === "string" ? body.nickname.slice(0, 100) : null;
  const externalId = typeof body.externalId === "string" ? body.externalId.slice(0, 200) : "";
  const avatar = typeof body.avatar === "string" ? body.avatar.slice(0, 500) : null;
  const credential = typeof body.credential === "string" ? body.credential : "";
  const ttlDays = typeof body.ttlDays === "number" && body.ttlDays > 0 && body.ttlDays <= 30
    ? Math.floor(body.ttlDays) : 30;

  if (!token || token.length < 20) {
    return json({ ok: false, error: "INVALID_TOKEN" }, 400);
  }
  if (!externalId || !credential) {
    return json({ ok: false, error: "MISSING_FIELDS" }, 400);
  }

  try {
    const tokenHash = await hashToken(token);
    const qr = await env.DB.prepare(
      "SELECT id, platform_code, status, created_by, expires_at FROM grab_qr_sessions WHERE token_hash = ?1 LIMIT 1"
    ).bind(tokenHash).first<{
      id: string;
      platform_code: string;
      status: string;
      created_by: string | null;
      expires_at: string;
    }>();

    if (!qr) return json({ ok: false, error: "QR_NOT_FOUND" }, 404);
    if (qr.status !== "waiting") return json({ ok: false, error: "QR_ALREADY_USED", status: qr.status }, 409);
    if (new Date(qr.expires_at).getTime() <= Date.now()) {
      await env.DB.prepare("UPDATE grab_qr_sessions SET status='expired' WHERE id=?1").bind(qr.id).run();
      return json({ ok: false, error: "QR_EXPIRED" }, 410);
    }

    // 加密凭证
    const otpSecret = (env as any).OTP_SECRET as string | undefined;
    if (!otpSecret || !/^[0-9a-fA-F]{64}$/.test(otpSecret)) {
      return json({ ok: false, error: "SECRET_NOT_CONFIGURED" }, 500);
    }
    const credentialEnc = await encryptCredential(credential, otpSecret);

    const accountId = crypto.randomUUID();
    const authCode = genAuthCode(qr.platform_code);
    const accountExpiresAt = new Date(Date.now() + ttlDays * 86400000).toISOString();

    // 事务性插入：先建账号，再标记二维码
    await env.DB.prepare(
      "INSERT INTO grab_accounts (id, platform_code, nickname, external_id, avatar, credential, authorization_code, status, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', ?8)"
    ).bind(accountId, qr.platform_code, nickname, externalId, avatar, credentialEnc, authCode, accountExpiresAt).run();

    await env.DB.prepare(
      "UPDATE grab_qr_sessions SET status='consumed', result_account_id=?1, consumed_at=CURRENT_TIMESTAMP WHERE id=?2"
    ).bind(accountId, qr.id).run();

    await env.DB.prepare(
      "INSERT INTO grab_audit_logs (id, action, target_id, platform_code, details) VALUES (?1, 'QR_CONSUMED', ?2, ?3, ?4)"
    ).bind(crypto.randomUUID(), accountId, qr.platform_code, JSON.stringify({ authCode })).run();

    return json({
      ok: true,
      accountId,
      authorizationCode: authCode,
      expiresAt: accountExpiresAt,
    }, 200);
  } catch (e) {
    console.error("grab qr consume error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500);
  }
};
