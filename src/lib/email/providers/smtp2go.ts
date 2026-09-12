import type { EmailProvider, SendEmailArgs } from "../types";

export const smtp2goProvider: EmailProvider = {
  id: "smtp2go",
  label: "SMTP2GO",
  dailyLimit: 33,
  envKey: "SMTP2GO_API_KEY",
  from: "my-site <noreply@ezuoju.dynv6.net>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const res = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: smtp2goProvider.from,
        to: [args.to],
        subject: args.subject,
        html_body: args.html,
        text_body: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`smtp2go ${res.status} ${body.slice(0, 200)}`);
    }
    const json = (await res.json().catch(() => ({}))) as {
      data?: { succeeded?: number; failed?: number };
    };
    if ((json.data?.failed ?? 0) > 0 && (json.data?.succeeded ?? 0) === 0) {
      throw new Error(`smtp2go rejected: ${JSON.stringify(json.data)}`);
    }
  },
};
