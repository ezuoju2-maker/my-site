import type { EmailProvider, SendEmailArgs } from "../types";

export const aisendProvider: EmailProvider = {
  id: "aisend",
  label: "AISend",
  dailyLimit: 33,
  envKey: "AISEND_API_KEY",
  from: "my-site <onboarding@aisend.app>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.aisend.app/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: aisendProvider.from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`aisend ${res.status} ${body.slice(0, 200)}`);
    }
  },
};
