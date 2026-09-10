import { env } from "cloudflare:workers";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

/**
 * 数据库健康检查端点。
 *
 * 安全策略：
 * - GitHub Pages 构建（静态）：不查询 D1，返回 skipped
 * - 生产环境：只返回最小 ok 状态，不泄露内部结构
 *
 * 使用建议：
 * 本端点主要用于 uptime 监控系统。如需进一步限制，可以改为
 * 只在特定 header 存在时才返回详细状态。
 */
export async function GET() {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (import.meta.env.GITHUB_PAGES === "true") {
    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "skipped",
      }),
      { status: 200, headers },
    );
  }

  try {
    await env.DB.prepare("SELECT 1").first();

    return new Response(
      JSON.stringify({
        ok: true,
        service: "my-site-api",
        database: "ok",
      }),
      { status: 200, headers },
    );
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        service: "my-site-api",
        database: "error",
      }),
      { status: 500, headers },
    );
  }
}
