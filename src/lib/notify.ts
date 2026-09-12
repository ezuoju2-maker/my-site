import { sendEmail } from "./email";

const FROM_LABEL = "my-site";
const NOTIFY_TIMEOUT_MS = 3000;

/**
 * 带超时的发送：主流程不愿为通知邮件阻塞太久。
 * 超时后仍继续（fire-and-forget 语义），邮件可能已发。
 */
async function sendWithTimeout(p: Promise<unknown>): Promise<void> {
  await Promise.race([
    p,
    new Promise<void>((resolve) =>
      setTimeout(() => resolve(), NOTIFY_TIMEOUT_MS),
    ),
  ]);
}

function subjectFor(kind: string): string {
  return `${FROM_LABEL} ${kind}`;
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

  await sendWithTimeout(
    sendEmail({
      to: oldEmail,
      subject: subjectFor("邮箱变更通知"),
      html,
      text,
    }),
  );
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
    sendEmail({
      to: email,
      subject: subjectFor("密码变更通知"),
      html,
      text,
    }),
  );
}
