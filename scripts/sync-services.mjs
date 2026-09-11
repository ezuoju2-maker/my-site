#!/usr/bin/env node
/**
 * SMS 服务库自动同步脚本
 *
 * 用法：
 *   node scripts/sync-services.mjs --source=mock --dry-run
 *   node scripts/sync-services.mjs --source=mock --apply
 *   node scripts/sync-services.mjs --source=sms-activate --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  }),
);

const SOURCE = args.source || "mock";
const APPLY = args.apply === true;
const LIMIT = Number(args.limit) || 100;

console.log("==========================================================");
console.log("【SMS 服务库自动同步】");
console.log("  来源: " + SOURCE);
console.log("  模式: " + (APPLY ? "应用（会写文件）" : "空跑（只输出报告）"));
console.log("  上限: " + LIMIT + " 个新服务/次");
console.log("==========================================================");

// === 1. 读取现有服务 ===
const dataFile = path.join(ROOT, "src/components/sms-services-data.ts");
const dataContent = fs.readFileSync(dataFile, "utf8");
const dataSlugs = new Set(
  [...dataContent.matchAll(/\bs\("([^"]+)"/g)].map((m) => m[1]),
);

const autoFile = path.join(ROOT, "src/components/sms-services-auto.ts");
let existingAuto = [];
if (fs.existsSync(autoFile)) {
  const autoContent = fs.readFileSync(autoFile, "utf8");
  existingAuto = [...autoContent.matchAll(/\bslug:\s*"([^"]+)"/g)].map(
    (m) => m[1],
  );
}

const knownSlugs = new Set([...dataSlugs, ...existingAuto]);
console.log("");
console.log("[1/5] 现有服务: " + dataSlugs.size + " 个（手写）");
console.log("      自动同步: " + existingAuto.length + " 个");
console.log("      合计已知: " + knownSlugs.size + " 个");

// === 2. 拉取远程服务 ===
console.log("");
console.log("[2/5] 从 " + SOURCE + " 拉取远程服务...");

let remoteServices;
if (SOURCE === "mock") {
  const mod = await import("./mock-sms-api.mjs");
  remoteServices = await mod.fetchMockServices();
} else if (SOURCE === "sms-activate") {
  console.error("ERROR: sms-activate adapter 尚未实现");
  console.error("  接入步骤请参见脚本末尾的 TODO 注释");
  process.exit(1);
} else {
  console.error("ERROR: 未知来源 " + SOURCE);
  process.exit(1);
}
console.log("      远程返回: " + remoteServices.length + " 个服务");

// === 3. Diff ===
const newServices = remoteServices.filter(
  (s) => s.slug && !knownSlugs.has(s.slug),
);
console.log("");
console.log("[3/5] Diff 结果: " + newServices.length + " 个新增");

const limited = newServices.slice(0, LIMIT);
if (newServices.length > LIMIT) {
  console.log("      本次最多处理 " + LIMIT + " 个，剩余下批");
}
if (limited.length === 0) {
  console.log("      没有新增服务，本次同步完成。");
  process.exit(0);
}

// === 4. 检查图标 ===
console.log("");
console.log("[4/5] 检查图标...");
const iconsDir = path.join(ROOT, "public/icons");
const simpleIconsDir = path.join(ROOT, "node_modules/simple-icons/icons");

let available = 0;
const missing = [];
for (const svc of limited) {
  const srcPath = path.join(simpleIconsDir, svc.slug + ".svg");
  if (fs.existsSync(srcPath)) {
    if (APPLY) fs.copyFileSync(srcPath, path.join(iconsDir, svc.slug + ".svg"));
    available++;
    console.log("      ✓ " + svc.slug + ".svg");
  } else {
    missing.push(svc.slug);
    console.log("      ✗ " + svc.slug + "（无官方 SVG，将用首字母兜底）");
  }
}

// === 5. 生成输出 ===
console.log("");
console.log("[5/5] 生成输出...");

const inferCategory = (name) => {
  const n = name.toLowerCase();
  if (/bank|pay|wallet|coin|trade|fintech/.test(n)) return "fintech";
  if (/game|play|fort|valor|roblox|mine|steam|epic|xbox|nintendo/.test(n)) return "gaming";
  if (/shop|store|buy|market|amazon|ebay|etsy|walmart|target|costco|bestbuy/.test(n)) return "ecommerce";
  if (/air|hotel|book|travel|trip|flight|uber|lyft|grab|ola|didi|priceline/.test(n)) return "travel";
  if (/chat|gram|signal|whats|line|wechat|qq|discord/.test(n)) return "social";
  if (/music|video|movie|stream|tv|flix|tube|spotify|netflix|disney/.test(n)) return "entertainment";
  if (/ai|gpt|claude|gemini|llm/.test(n)) return "ai";
  if (/dev|git|code|api|cloud|host|server/.test(n)) return "dev";
  return "other";
};

const newEntries = limited.map((svc) => {
  const category = svc.category || inferCategory(svc.name);
  const brand = svc.brand || "888888";
  return (
    "  { slug: " + JSON.stringify(svc.slug) +
    ", name: " + JSON.stringify(svc.name) +
    ", category: " + JSON.stringify(category) +
    ", brand: " + JSON.stringify(brand) + " },"
  );
});

let existingBlock = "";
if (fs.existsSync(autoFile)) {
  const existingContent = fs.readFileSync(autoFile, "utf8");
  const m = existingContent.match(/AUTO_SERVICES[^=]*=\s*\[([\s\S]*?)\];/);
  if (m) {
    existingBlock = m[1].trim();
    if (existingBlock && !existingBlock.endsWith(",")) existingBlock += ",";
    existingBlock += "\n";
  }
}

const autoContent =
  "// 自动生成 - 由 scripts/sync-services.mjs 维护\n" +
  "// 最后更新: " + new Date().toISOString() + "\n" +
  "// 来源: " + SOURCE + "\n" +
  "// 手动编辑将被覆盖，请勿手动修改此文件。\n" +
  "\n" +
  "export type AutoService = {\n" +
  "  slug: string;\n" +
  "  name: string;\n" +
  "  category: string;\n" +
  "  brand: string;\n" +
  "};\n" +
  "\n" +
  "export const AUTO_SERVICES: AutoService[] = [\n" +
  existingBlock +
  newEntries.join("\n") +
  "\n];\n";

console.log("      新增条目: " + newEntries.length);
console.log("      累计自动条目: " + (existingAuto.length + newEntries.length));
console.log("      图标可用: " + available + " / " + limited.length);
console.log("      图标缺失: " + missing.length);

if (APPLY) {
  fs.writeFileSync(autoFile, autoContent);
  console.log("");
  console.log("✅ 已写入 " + autoFile);

  const missingFile = path.join(iconsDir, "_missing.txt");
  const prevMissing = fs.existsSync(missingFile)
    ? fs.readFileSync(missingFile, "utf8").split("\n").filter(Boolean)
    : [];
  const allMissing = [...new Set([...prevMissing, ...missing])];
  fs.writeFileSync(missingFile, allMissing.join("\n") + "\n");
  console.log("✅ 已更新 " + missingFile + "（累计缺失 " + allMissing.length + " 个）");
} else {
  console.log("");
  console.log("📋 空跑模式，未写任何文件。");
  console.log("   若要应用更改，重新执行并加上 --apply");
  console.log("");
  console.log("---- 生成内容预览（前 25 行）----");
  console.log(autoContent.split("\n").slice(0, 25).join("\n"));
  console.log("...");
}

console.log("");
console.log("==========================================================");
console.log("【完成】");
console.log("==========================================================");

/* TODO: 接入 sms-activate 时，添加以下代码到 SOURCE=sms-activate 分支
 *
 * import { fetchSmsActivateServices } from "./sync-adapters.mjs";
 * remoteServices = await fetchSmsActivateServices(process.env.SMS_API_KEY);
 *
 * 并创建 scripts/sync-adapters.mjs 实现具体的 API 调用。
 */
