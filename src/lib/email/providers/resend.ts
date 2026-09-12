import type { EmailProvider, SendEmailArgs } from "../types";

export const resendProvider: EmailProvider = {
  id: "resend",
  label: "Resend",
  dailyLimit: 100,
  envKey: "RESEND_API_KEY",
  from: "my-site <noreply@ezuoju.dynv6.net>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: resendProvider.from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`resend ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
