import type { EmailProvider, SendEmailArgs } from "../types";

export const elasticemailProvider: EmailProvider = {
  id: "elasticemail",
  label: "Elastic Email",
  dailyLimit: 100,
  envKey: "ELASTICEMAIL_API_KEY",
  from: "my-site <noreply@ezuoju.dynv6.net>",
  async send(args: SendEmailArgs, apiKey: string): Promise<void> {
    const form = new URLSearchParams();
    form.set("apikey", apiKey);
    form.set("from", elasticemailProvider.from);
    form.set("to", args.to);
    form.set("subject", args.subject);
    form.set("bodyHtml", args.html);
    form.set("bodyText", args.text);
    form.set("isTransactional", "true");

    const res = await fetch("https://api.elasticemail.com/v2/email/send", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`elasticemail ${res.status} ${body.slice(0, 200)}`);
    }
    const json = (await res.json().catch(() => ({}))) as { success?: boolean };
    if (json.success === false) {
      throw new Error(`elasticemail rejected: ${JSON.stringify(json)}`);
    }
  },
};
