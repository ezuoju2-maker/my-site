import fs from "fs";
const p = "src/pages/api/auth/register.ts";
let c = fs.readFileSync(p, "utf8");

const oldBlock = [
  "      if (existingUser) {",
  "        if (existingUser.username === username) {",
  "          return json(",
  '            { ok: false, error: "USERNAME_EXISTS" },',
  "            409,",
  "            {},",
  "            origin,",
  "          );",
  "        }",
  "        return json(",
  '          { ok: false, error: "EMAIL_EXISTS" },',
  "          409,",
  "          {},",
  "          origin,",
  "        );",
  "      }"
].join("\n");

if (!c.includes(oldBlock)) { console.error("no anchor 1"); process.exit(1); }

const newBlock = [
  "      if (existingUser) {",
  "        // 不区分用户名/邮箱已存在，防止账号枚举",
  "        return json(",
  '          { ok: false, error: "ACCOUNT_EXISTS" },',
  "          409,",
  "          {},",
  "          origin,",
  "        );",
  "      }"
].join("\n");

c = c.replace(oldBlock, newBlock);

c = c.replace(
  'if (message.includes("UNIQUE constraint failed: users.username")) {',
  'if (message.includes("UNIQUE constraint failed: users.username") || message.includes("UNIQUE constraint failed: users.email")) {'
);

const secondCheck = [
  '    if (message.includes("UNIQUE constraint failed: users.email")) {',
  "      return json(",
  '        { ok: false, error: "EMAIL_EXISTS" },',
  "        409,",
  "        {},",
  "        origin,",
  "      );",
  "    }"
].join("\n");
c = c.replace(secondCheck, "");

c = c.replace(
  '        { ok: false, error: "USERNAME_EXISTS" },\n        409,',
  '        { ok: false, error: "ACCOUNT_EXISTS" },\n        409,'
);

fs.writeFileSync(p, c);
console.log("OK");
