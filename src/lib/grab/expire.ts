import { env } from "cloudflare:workers";

export async function expireRecords(): Promise<void> {
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      "UPDATE grab_qr_sessions SET status = 'expired' WHERE status = 'waiting' AND expires_at <= ?1"
    ).bind(now).run();
    await env.DB.prepare(
      "UPDATE grab_accounts SET status = 'expired' WHERE status = 'active' AND expires_at <= ?1"
    ).bind(now).run();
    await env.DB.prepare(
      "UPDATE grab_grants SET status = 'expired' WHERE status = 'active' AND expires_at <= ?1"
    ).bind(now).run();
  } catch (e) {
    console.error("[grab-expire] failed", e);
  }
}
