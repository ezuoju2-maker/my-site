/**
 * Cloudflare Workers 运行时 Env 类型声明。
 *
 * 这些绑定在 wrangler.toml 里定义：
 * - DB: D1 数据库
 * - SESSION: KV 命名空间
 * - RESEND_API_KEY: Resend 邮件服务密钥
 * - OTP_SECRET: OTP 签名独立密钥
 * - CAP_WORKER / CAP_WORKER_URL: Cap 服务绑定
 */
declare global {
  interface Env {
    DB: D1Database;
    SESSION: KVNamespace;
    RESEND_API_KEY: string;
    OTP_SECRET: string;
    CAP_WORKER?: {
      fetch: (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => Promise<Response>;
    };
    CAP_WORKER_URL?: string;
  }
}

export {};
