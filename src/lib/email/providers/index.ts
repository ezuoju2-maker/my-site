/**
 * Provider 优先级顺序：
 *   AgentMail (100/天) → Resend (100/天) → AISend (33/天)
 *
 * 总免费额度：约 233 封/天
 * JetEmail 已移除（其主打收信功能，非发信服务）。
 */
import { agentmailProvider } from "./agentmail";
import { resendProvider } from "./resend";
import { aisendProvider } from "./aisend";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  agentmailProvider,
  resendProvider,
  aisendProvider,
];

export { agentmailProvider, resendProvider, aisendProvider };
