/**
 * Provider 优先级顺序（精简版）：
 *   AgentMail (100/天) → Resend (100/天)
 *
 * 总免费额度：200 封/天
 * 其他 provider（Brevo/MailerSend/ElasticEmail/SMTP2GO）已删除。
 * 如需恢复，参考 git 历史或重新添加。
 */
import { agentmailProvider } from "./agentmail";
import { resendProvider } from "./resend";
import type { EmailProvider } from "../types";

export const PROVIDERS: EmailProvider[] = [
  agentmailProvider,
  resendProvider,
];

export { agentmailProvider, resendProvider };
