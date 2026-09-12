/**
 * Provider 优先级顺序：
 *   Resend (100/天) → Brevo (300/天) → MailerSend (100/天)
 *   → ElasticEmail (100/天) → SMTP2GO (33/天)
 *
 * 排序原则：免费额度大 + 送达率好的排前面。
 */
import { resendProvider } from "./resend";
import { brevoProvider } from "./brevo";
import { mailersendProvider } from "./mailersend";
import { elasticemailProvider } from "./elasticemail";
import { smtp2goProvider } from "./smtp2go";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  resendProvider,
  brevoProvider,
  mailersendProvider,
  elasticemailProvider,
  smtp2goProvider,
];

export {
  resendProvider,
  brevoProvider,
  mailersendProvider,
  elasticemailProvider,
  smtp2goProvider,
};
