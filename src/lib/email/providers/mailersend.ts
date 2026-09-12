import type { EmailProvider, SendEmailArgs } from "../types";

export const mailersendProvider: EmailProvider = {
  id: "mailersend",
  label: "MailerSend",
  dailyLimit: 100,
  envKey: "MAILERSEND_API_KEY",
  from: "my-site <noreply@ezuoju.dynv6.net>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: { email: "noreply@ezuoju.dynv6.net", name: "my-site" },
        to: [{ email: args.to }],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`mailersend ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
