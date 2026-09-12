/**
 * Provider 优先级顺序：
 *   AgentMail (100/天) → Resend (100/天) → Brevo (300/天)
 *   → MailerSend (100/天) → ElasticEmail (100/天) → SMTP2GO (33/天)
 *
 * 排序原则：先走"无需域名"的 AgentMail，再用已验证域名的大厂，
 * 哪个用完自动切下一个。
 */
import { agentmailProvider } from "./agentmail";
import { resendProvider } from "./resend";
import { brevoProvider } from "./brevo";
import { mailersendProvider } from "./mailersend";
import { elasticemailProvider } from "./elasticemail";
import { smtp2goProvider } from "./smtp2go";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  agentmailProvider,
  resendProvider,
  brevoProvider,
  mailersendProvider,
  elasticemailProvider,
  smtp2goProvider,
];

export {
  agentmailProvider,
  resendProvider,
  brevoProvider,
  mailersendProvider,
  elasticemailProvider,
  smtp2goProvider,
};
