// Cloudflare Workers 环境变量类型声明
//
// 通常由 `wrangler types` 自动生成，但我们这里手动维护，
// 因为 Termux 上跑不了 wrangler。
//
// 参考：https://developers.cloudflare.com/workers/wrangler/commands/#types
//
// 每添加新的绑定（D1/KV/Secret/Service），都需要在此声明。

declare namespace Cloudflare {
  interface Env {
    // ============ 绑定（wrangler.toml）============
    DB: D1Database;
    SESSION: KVNamespace;

    // ============ Secrets（wrangler secret put）============
    RESEND_API_KEY: string;
    OTP_SECRET: string;

    // ============ Vars（wrangler.toml [vars]）============
    CAPTCHA_MODE?: string;
    BUDGET_MODE?: "normal" | "throttled" | "degraded" | "emergency";
    CSP_MODE?: "report-only" | "enforce";
  }
}

// 让全局 Env 指向 Cloudflare.Env
interface Env extends Cloudflare.Env {}
