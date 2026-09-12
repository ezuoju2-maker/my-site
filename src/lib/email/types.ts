/**
 * 邮件 provider 的统一接口。
 *
 * 每个 provider（Resend/Brevo/...）实现这个接口，
 * 上层 sendEmail() 只依赖这个接口，不关心具体实现。
 */
export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult =
  | { ok: true; providerId: string }
  | { ok: false; providerId: string; error: string };

export type QuotaExhaustedResult = {
  ok: false;
  error: "ALL_EMAIL_PROVIDERS_EXHAUSTED";
};

export interface EmailProvider {
  /** 唯一 id，用于配额记账 */
  id: string;
  /** 显示名（日志用） */
  label: string;
  /** 每日免费配额。0 表示无限 */
  dailyLimit: number;
  /** 环境变量里 API key 的字段名 */
  envKey: string;
  /** 发件人地址（可为每个 provider 单独指定） */
  from: string;
  /** 实际发送 */
  send(args: SendEmailArgs, apiKey: string): Promise<void>;
}
