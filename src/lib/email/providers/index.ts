/**
 * Provider 优先级顺序：
 *   AgentMail (100/天) → Resend (100/天) → AISend (33/天) → JetEmail (100/天)
 *
 * 总免费额度：约 333 封/天
 */
import { agentmailProvider } from "./agentmail";
import { resendProvider } from "./resend";
import { aisendProvider } from "./aisend";
import { jetemailProvider } from "./jetemail";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  agentmailProvider,
  resendProvider,
  aisendProvider,
  jetemailProvider,
];

export {
  agentmailProvider,
  resendProvider,
  aisendProvider,
  jetemailProvider,
};
