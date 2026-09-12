import type { EmailProvider, SendEmailArgs } from "../types";

export const brevoProvider: EmailProvider = {
  id: "brevo",
  label: "Brevo",
  dailyLimit: 300,
  envKey: "BREVO_API_KEY",
  from: "my-site <noreply@ezuoju.dynv6.net>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "my-site", email: "noreply@ezuoju.dynv6.net" },
        to: [{ email: args.to }],
        subject: args.subject,
        htmlContent: args.html,
        textContent: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`brevo ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
