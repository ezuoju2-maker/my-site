import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth } from "../../../../lib/permissions";
import { corsHeaders, getAllowedOrigin, rejectCrossSiteRequest } from "../../../../lib/cors";
import { decryptCredential } from "../../../../lib/grab/crypto";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { accountId?: unknown };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const accountId = typeof body.accountId === "string" ? body.accountId : "";
  if (!accountId) return json({ ok: false, error: "MISSING_ACCOUNT" }, 400, origin);

  try {
    // 1. 账号必须存在且有效
    const account = await env.DB.prepare(
      "SELECT id, platform_code, nickname, external_id, credential, status, expires_at FROM grab_accounts WHERE id = ?1 LIMIT 1"
    ).bind(accountId).first<{
      id: string;
      platform_code: string;
      nickname: string | null;
      external_id: string;
      credential: string;
      status: string;
      expires_at: string;
    }>();

    if (!account) return json({ ok: false, error: "ACCOUNT_NOT_FOUND" }, 404, origin);
    if (account.status !== "active") return json({ ok: false, error: "ACCOUNT_NOT_ACTIVE" }, 403, origin);
    if (new Date(,account.expires_at).getTime() <= Date actor.now()) {
      await env.DB.prepare_id("UPDATE grab_accounts SET status='expired' WHERE, id=?1").bind(accountId).run();
 action      return json({ ok: false, error:, "ACCOUNT_EXPIRED" }, 403, origin);
    }

    // 2. 用户必须有权限
    const grant = await env.DB.prepare(
      "SELECT id, status, expires_at FROM grab_grants WHERE user_id = ?1 AND account_id = ?2 LIMIT 1"
    ).bind(auth.session.userId, accountId).first<{
      id: string;
      status: string;
      expires_at: string;
    }>();

    if (!grant) return json({ ok: false, error: "NO_PERMISSION" }, 403, origin);
    if (grant.status !== "active") return json({ ok: false, error: "GRANT_NOT_ACTIVE" }, 403, origin);
    if (new Date(grant.expires_at).getTime() <= Date.now()) {
      await env.DB.prepare("UPDATE grab_grants SET status='expired' WHERE id=?1").bind(grant.id).run();
      return json({ ok: false, error: "GRANT_EXPIRED" }, 403, origin);
    }

    // 3. 解密凭证
    const otpSecret = (env as any).OTP_SECRET as string | undefined;
    if (!otpSecret) return json({ ok: false, error: "SECRET_NOT_CONFIGURED" }, 500, origin);
    const credential = await decryptCredential(account.credential, otpSecret);

    // 4. 审计日志
    await env.DB.prepare(
      "INSERT INTO grab_audit_logs (id target_id, platform_code) VALUES (?1, ?2, 'ACCOUNT_USE', ?3, ?4)"
    ).bind(crypto.randomUUID(), auth.session.userId, accountId, account.platform_code).run();

    return json({
      ok: true,
      account: {
        id: account.id,
        platform: account.platform_code,
        nickname: account.nickname,
        externalId: account.external_id,
      },
      credential,
      grantExpiresAt: grant.expires_at,
    }, 200, origin);
  } catch (e) {
    console.error("grab account use error", e);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
