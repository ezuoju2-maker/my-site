import type { EmailProvider, SendEmailArgs } from "../types";

/**
 * AgentMail - 无需域名的邮件 API
 * 免费额度：100 封/天（3000 封/月）
 * 发件人必须使用账号下已分配的 inbox 地址
 */
export const agentmailProvider: EmailProvider = {
  id: "agentmail",
  label: "AgentMail",
  dailyLimit: 100,
  envKey: "AGENTMAIL_API_KEY",
  from: "my-site <guiji@agentmail.to>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch(
      "https://api.agentmail.to/v0/inboxes/guiji/messages/send",
      {
        method: "POST",
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
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`agentmail ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
