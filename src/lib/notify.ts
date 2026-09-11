import { env } from "cloudflare:workers";

const FROM = "my-site <noreply@ezuoju.dynv6.net>";
const NOTIFY_TIMEOUT_MS = 3000;

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`resend failed: ${response.status}`);
  }
}

/**
 * 带超时的发送：主流程不愿为通知邮件阻塞太久。
 * 超时后仍然继续，邮件可能已发（fire-and-forget 语义）。
 */
async function sendWithTimeout(p: Promise<void>): Promise<void> {
  await Promise.race([
    p,
    new Promise<void>((resolve) =>
      setTimeout(() => resolve(), NOTIFY_TIMEOUT_MS),
    ),
  ]);
}

/**
 * 邮箱修改成功 -> 通知旧邮箱。
 * 不包含新邮箱地址，避免信息泄露。
 */
export async function notifyEmailChanged(oldEmail: string): Promise<void> {
  const when = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const text =
    `您好：\n\n` +
    `您的 my-site 账号邮箱刚刚被修改。\n\n` +
    `时间：${when}\n\n` +
    `如果这是您本人的操作，请忽略本邮件。\n` +
    `如果这不是您本人操作，您的账号可能已被他人控制，请立即：\n` +
    `1. 使用原密码尝试登录并修改密码\n` +
    `2. 如果无法登录，请联系管理员协助\n\n` +
    `—— my-site`;

  const html =
    `<p>您好：</p>` +
    `<p>您的 <strong>my-site</strong> 账号邮箱刚刚被修改。</p>` +
    `<p>时间：<code>${when}</code></p>` +
    `<p>如果这是您本人的操作，请忽略本邮件。</p>` +
    `<p><strong>如果这不是您本人操作</strong>，您的账号可能已被他人控制，请立即：</p>` +
    `<ol>` +
    `<li>使用原密码尝试登录并修改密码</li>` +
    `<li>如果无法登录，请联系管理员协助</li>` +
    `</ol>` +
    `<p>—— my-site</p>`;

  await sendWithTimeout(sendEmail(oldEmail, "my-site 邮箱变更通知", html, text));
}

/**
 * 密码修改成功 -> 通知当前邮箱。
 */
export async function notifyPasswordChanged(email: string): Promise<void> {
  const when = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const text =
    `您好：\n\n` +
    `您的 my-site 账号密码刚刚被修改，所有已登录设备已退出。\n\n` +
    `时间：${when}\n\n` +
    `如果这是您本人的操作，请忽略本邮件。\n` +
    `如果这不是您本人操作，请立即使用新密码登录并再次修改。\n\n` +
    `—— my-site`;

  const html =
    `<p>您好：</p>` +
    `<p>您的 <strong>my-site</strong> 账号密码刚刚被修改，所有已登录设备已退出。</p>` +
    `<p>时间：<code>${when}</code></p>` +
    `<p>如果这是您本人的操作，请忽略本邮件。</p>` +
    `<p>如果这不是您本人操作，请立即使用新密码登录并再次修改。</p>` +
    `<p>—— my-site</p>`;

  await sendWithTimeout(
    sendEmail(email, "my-site 密码变更通知", html, text),
  );
}
