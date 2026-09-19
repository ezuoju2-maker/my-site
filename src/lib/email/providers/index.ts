/**
 * Provider 优先级顺序（按额度从大到小 + 可靠性）：
 *   Brevo (300/天) → Mailjet (200/天) → AgentMail (100/天)
 *   → Resend (100/天) → AISend (33/天)
 *
 * 总免费额度：约 733 封/天
 */
import { brevoProvider } from "./brevo";
import { mailjetProvider } from "./mailjet";
import { agentmailProvider } from "./agentmail";
import { resendProvider } from "./resend";
import { aisendProvider } from "./aisend";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  brevoProvider,
  mailjetProvider,
  agentmailProvider,
  resendProvider,
  aisendProvider,
];

export { brevoProvider, mailjetProvider, agentmailProvider, resendProvider, aisendProvider };
