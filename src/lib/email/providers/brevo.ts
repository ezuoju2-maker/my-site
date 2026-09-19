import type { EmailProvider, SendEmailArgs } from "../types";

export const brevoProvider: EmailProvider = {
  id: "brevo",
  label: "Brevo",
  dailyLimit: 300,
  envKey: "BREVO_API_KEY",
  from: "my-site <noreply@example.com>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const fromEmail = (globalThis as any).__EMAIL_FROM__ || "noreply@example.com";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "my-site", email: fromEmail },
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
