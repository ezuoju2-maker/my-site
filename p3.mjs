import fs from "fs";
const p = "src/pages/api/auth/forgot-password.ts";
let c = fs.readFileSync(p, "utf8");

// 让"不存在用户"和"存在用户"路径延迟一致（防时序攻击）
const anchor = `      // 无论邮箱是否存在，返回相同结果，防止账号枚举
      if (!user) {
        await setCooldown(ipCooldownKey, RESEND_COOLDOWN_SECONDS);
        await setCooldown(emailCooldownKey, RESEND_COOLDOWN_SECONDS);
        return json(
          {
            ok: true,
            expiresIn: OTP_TTL_SECONDS,
            retryAfter: RESEND_COOLDOWN_SECONDS,
          },
          200,
          {},
          origin,
        );
      }`;

if (!c.includes(anchor)) { console.error("no enum block"); process.exit(1); }

const newBlock = `      // 无论邮箱是否存在，返回相同结果 + 相同延迟，防止账号枚举（包括时序攻击）
      if (!user) {
        await setCooldown(ipCooldownKey, RESEND_COOLDOWN_SECONDS);
        await setCooldown(emailCooldownKey, RESEND_COOLDOWN_SECONDS);
        // 人为延迟 300-500ms，模拟发邮件的耗时，消除时序差异
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
        return json(
          {
            ok: true,
            expiresIn: OTP_TTL_SECONDS,
            retryAfter: RESEND_COOLDOWN_SECONDS,
          },
          200,
          {},
          origin,
        );
      }`;

c = c.replace(anchor, newBlock);

fs.writeFileSync(p, c);
console.log("OK");
