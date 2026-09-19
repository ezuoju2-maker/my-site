import type { EmailProvider, SendEmailArgs } from "../types";

export const mailjetProvider: EmailProvider = {
  id: "mailjet",
  label: "Mailjet",
  dailyLimit: 200,
  envKey: "MAILJET_API_KEY",
  from: "my-site <noreply@example.com>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const fromEmail = (globalThis as any).__EMAIL_FROM__ || "noreply@example.com";
    const [key, secret] = apiKey.split(":");
    const auth = btoa(`${key}:${secret}`);
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromEmail, Name: "my-site" },
          To: [{ Email: args.to }],
          Subject: args.subject,
          HTMLPart: args.html,
          TextPart: args.text,
        }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`mailjet ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
