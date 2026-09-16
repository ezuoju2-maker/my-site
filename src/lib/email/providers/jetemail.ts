import type { EmailProvider, SendEmailArgs } from "../types";

export const jetemailProvider: EmailProvider = {
  id: "jetemail",
  label: "JetEmail",
  dailyLimit: 100,
  envKey: "JETEMAIL_API_KEY",
  from: "my-site <onboarding@jetemail.com>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.jetemail.com/v1/email/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: jetemailProvider.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`jetemail ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
