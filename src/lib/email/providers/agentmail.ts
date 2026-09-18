import type { EmailProvider, SendEmailArgs } from "../types";

/**
 * AgentMail - 无需域名的邮件 API
 * 免费额度：100 封/天（3000 封/月）
 * inbox_id 必须使用完整邮箱地址（URL 编码）
 */
const INBOX_ID = "guiji@agentmail.to";
const INBOX_ID_URL = encodeURIComponent(INBOX_ID);

export const agentmailProvider: EmailProvider = {
  id: "agentmail",
  label: "AgentMail",
  dailyLimit: 100,
  envKey: "AGENTMAIL_API_KEY",
  from: `my-site <${INBOX_ID}>`,
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8s 超时

    const t0 = Date.now();
    let res: Response;
    try {
      res = await fetch(
        `https://api.agentmail.to/v0/inboxes/${INBOX_ID_URL}/messages/send`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            to: [args.to],
            subject: args.subject,
            text: args.text,
            html: args.html,
          }),
        },
      );
    } catch (err) {
      clearTimeout(timer);
      const elapsed = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[agentmail] fetch threw after ${elapsed}ms: ${msg}`);
      // 超时/网络错误：请求可能已送达，返回成功信号让上层不重试
      if (msg.includes("abort") || msg.includes("timeout")) {
        console.warn("[agentmail] timeout - request may have been delivered, treating as success");
        return;
      }
      throw err;
    }
    clearTimeout(timer);

    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[agentmail] HTTP ${res.status} after ${elapsed}ms: ${body.slice(0, 200)}`);
      throw new Error(`agentmail ${res.status} ${body.slice(0, 300)}`);
    }
    console.log(`[agentmail] OK ${res.status} in ${elapsed}ms`);
  },
};
