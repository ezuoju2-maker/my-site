#!/usr/bin/env node
/**
 * 国家/地区库自动同步脚本
 *
 * 用法：
 *   node scripts/sync-countries.mjs --source=mock --dry-run
 *   node scripts/sync-countries.mjs --source=mock --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const VALID_ISO_CODES = new Set(["ad","ae","af","ag","ai","al","am","ao","aq","ar","as","at","au","aw","ax","az","ba","bb","bd","be","bf","bg","bh","bi","bj","bl","bm","bn","bo","bq","br","bs","bt","bv","bw","by","bz","ca","cc","cd","cf","cg","ch","ci","ck","cl","cm","cn","co","cr","cu","cv","cw","cx","cy","cz","de","dj","dk","dm","do","dz","ec","ee","eg","eh","er","es","et","fi","fj","fk","fm","fo","fr","ga","gb","gd","ge","gf","gg","gh","gi","gl","gm","gn","gp","gq","gr","gs","gt","gu","gw","gy","hk","hm","hn","hr","ht","hu","id","ie","il","im","in","io","iq","ir","is","it","je","jm","jo","jp","ke","kg","kh","ki","km","kn","kp","kr","kw","ky","kz","la","lb","lc","li","lk","lr","ls","lt","lu","lv","ly","ma","mc","md","me","mf","mg","mh","mk","ml","mm","mn","mo","mp","mq","mr","ms","mt","mu","mv","mw","mx","my","mz","na","nc","ne","nf","ng","ni","nl","no","np","nr","nu","nz","om","pa","pe","pf","pg","ph","pk","pl","pm","pn","pr","ps","pt","pw","py","qa","re","ro","rs","ru","rw","sa","sb","sc","sd","se","sg","sh","si","sj","sk","sl","sm","sn","so","sr","ss","st","sv","sx","sy","sz","tc","td","tf","tg","th","tj","tk","tl","tm","tn","to","tr","tt","tv","tw","tz","ua","ug","um","us","uy","uz","va","vc","ve","vg","vi","vn","vu","wf","ws","ye","yt","za","zm","zw"]);


const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  }),
);

const SOURCE = args.source || "mock";
const APPLY = args.apply === true;

console.log("==========================================================");
console.log("【国家/地区库自动同步】");
console.log("  来源: " + SOURCE);
console.log("  模式: " + (APPLY ? "应用（会写文件）" : "空跑（只输出报告）"));
console.log("==========================================================");

// === 别名映射表：把平台各种写法映射到 ISO 3166-1 两位码 ===
const ALIAS_TO_ISO = {
  "united states": "us", "usa": "us", "us": "us",
  "united states of america": "us", "america": "us",
  "uk": "gb", "united kingdom": "gb", "great britain": "gb",
  "england": "gb", "britain": "gb",
  "russia": "ru", "russian federation": "ru",
  "south korea": "kr", "korea": "kr", "republic of korea": "kr",
  "korea, republic of": "kr", "korea south": "kr",
  "north korea": "kp", "korea, democratic people's republic of": "kp",
  "china": "cn", "mainland china": "cn", "prc": "cn",
  "hong kong": "hk", "hongkong": "hk", "hong kong sar": "hk",
  "macau": "mo", "macao": "mo",
  "taiwan": "tw", "chinese taipei": "tw",
  "vietnam": "vn", "viet nam": "vn",
  "czech republic": "cz", "czechia": "cz",
  "ivory coast": "ci", "cote d'ivoire": "ci", "côte d'ivoire": "ci",
  "uae": "ae", "united arab emirates": "ae",
  "burma": "mm", "myanmar": "mm",
  "laos": "la", "lao pdr": "la",
  "syria": "sy", "syrian arab republic": "sy",
  "iran": "ir", "islamic republic of iran": "ir",
  "venezuela": "ve", "bolivarian republic of venezuela": "ve",
  "bolivia": "bo", "plurinational state of bolivia": "bo",
  "moldova": "md", "republic of moldova": "md",
  "tanzania": "tz", "united republic of tanzania": "tz",
  "macedonia": "mk", "north macedonia": "mk",
  "swaziland": "sz", "eswatini": "sz",
  "cape verde": "cv", "cabo verde": "cv",
  "democratic republic of the congo": "cd", "dr congo": "cd",
  "republic of the congo": "cg", "congo": "cg",
  "turkey": "tr", "türkiye": "tr",
  "nederland": "nl", "netherlands": "nl", "holland": "nl",
  "deutschland": "de", "germany": "de",
  "españa": "es", "spain": "es",
  "italia": "it", "italy": "it",
  "brasil": "br", "brazil": "br",
  "méxico": "mx", "mexico": "mx",
};

// === 区号 → 大洲推断（兜底用） ===
function inferRegion(dial) {
  if (!dial || typeof dial !== "string") return "other";
  const n = parseInt(dial.replace(/[^\d]/g, ""), 10);
  if (isNaN(n)) return "other";
  if (n === 1) return "north_america";
  if (n === 7) return "europe";
  if (n >= 20 && n <= 28) return "africa";
  if (n >= 30 && n <= 49) return "europe";
  if (n >= 51 && n <= 59) return "south_america";
  if (n >= 60 && n <= 69) return "southeast_asia";
  if (n >= 81 && n <= 86) return "east_asia";
  if (n >= 90 && n <= 99) return "west_asia";
  if (n >= 211 && n <= 299) return "africa";
  if (n >= 350 && n <= 399) return "europe";
  if (n >= 501 && n <= 509) return "north_america";
  if (n >= 590 && n <= 599) return "north_america";
  if (n >= 670 && n <= 699) return "oceania";
  if (n >= 850 && n <= 855) return "east_asia";
  if (n >= 880 && n <= 889) return "south_asia";
  if (n >= 960 && n <= 998) return "south_asia";
  return "other";
}

// === 1. 读取现有国家 ===
const dataFile = path.join(ROOT, "src/components/sms-countries-data.ts");
const dataContent = fs.readFileSync(dataFile, "utf8");
const dataCodes = new Set(
  [...dataContent.matchAll(/\bc\("([^"]+)"/g)].map((m) => m[1].toLowerCase()),
);

const autoFile = path.join(ROOT, "src/components/sms-countries-auto.ts");
let existingAuto = [];
if (fs.existsSync(autoFile)) {
  const autoContent = fs.readFileSync(autoFile, "utf8");
  existingAuto = [...autoContent.matchAll(/code:\s*"([^"]+)"/g)].map(
    (m) => m[1].toLowerCase(),
  );
}

const knownCodes = new Set([...dataCodes, ...existingAuto]);
console.log("");
console.log("[1/5] 现有国家: " + dataCodes.size + " 个（手写）");
console.log("      自动同步: " + existingAuto.length + " 个");
console.log("      合计已知: " + knownCodes.size + " 个");

// === 2. 拉取远程国家 ===
console.log("");
console.log("[2/5] 从 " + SOURCE + " 拉取远程国家...");

let remoteCountries;
if (SOURCE === "mock") {
  const mod = await import("./mock-countries-api.mjs");
  remoteCountries = await mod.fetchMockCountries();
} else if (SOURCE === "sms-activate") {
  console.error("ERROR: sms-activate adapter 尚未实现");
  process.exit(1);
} else {
  console.error("ERROR: 未知来源 " + SOURCE);
  process.exit(1);
}
console.log("      远程返回: " + remoteCountries.length + " 个");

// === 3. Diff ===
const resolved = remoteCountries.map((r) => {
  const nameKey = (r.name || "").toLowerCase().trim();
  const iso = r.code
    ? r.code.toLowerCase()
    : ALIAS_TO_ISO[nameKey] || ALIAS_TO_ISO[nameKey.replace(/-/g, " ")] || null;
  return { ...r, iso };
});

const newCountries = resolved.filter(
  (r) => !r.iso || !knownCodes.has(r.iso),
);
console.log("");
console.log("[3/5] Diff 结果: " + newCountries.length + " 个新增");

if (newCountries.length === 0) {
  console.log("      没有新增国家，本次同步完成。");
  process.exit(0);
}

// === 4. 逐个处理 ===
console.log("");
console.log("[4/5] 处理新增国家...");

const usedCodes = new Set([...knownCodes]);
const processed = newCountries.map((r) => {
  const region = r.region || inferRegion(r.dial);
  let code;
  if (r.iso && VALID_ISO_CODES.has(r.iso)) {
    code = r.iso;
  } else if (r.code && VALID_ISO_CODES.has(r.code.toLowerCase())) {
    code = r.code.toLowerCase();
  } else {
    // 无效 ISO → 用 z 前缀避免与任何真实 ISO 冲突
    const base = "z" + (r.name || "xx")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toLowerCase();
    code = base;
    let n = 1;
    while (usedCodes.has(code)) {
      code = base + n;
      n++;
    }
  }
  usedCodes.add(code);
  const nameEn = r.name || code.toUpperCase();
  const name = r.name || nameEn;
  return { code, name, nameEn, dial: r.dial || "", region };
});

for (const c of processed) {
  const tag = c.code === "??" ? "⚠" : "✓";
  console.log(
    "      " + tag + " " + c.code.padEnd(4) + " " +
    c.name.padEnd(24) + " " + c.dial.padEnd(8) + " " + c.region,
  );
}

// === 5. 生成输出 ===
console.log("");
console.log("[5/5] 生成输出...");

const newEntries = processed.map((c) => {
  return (
    "  { code: " + JSON.stringify(c.code) +
    ", name: " + JSON.stringify(c.name) +
    ", nameEn: " + JSON.stringify(c.nameEn) +
    ", dial: " + JSON.stringify(c.dial) +
    ", region: " + JSON.stringify(c.region) + " as SmsRegion },"
  );
});

let existingBlock = "";
if (fs.existsSync(autoFile)) {
  const existingContent = fs.readFileSync(autoFile, "utf8");
  const m = existingContent.match(/AUTO_COUNTRIES[^=]*=\s*\[([\s\S]*?)\];/);
  if (m) {
    existingBlock = m[1].trim();
    if (existingBlock && !existingBlock.endsWith(",")) existingBlock += ",";
    existingBlock += "\n";
  }
}

const autoContent =
  "// 自动生成 - 由 scripts/sync-countries.mjs 维护\n" +
  "// 最后更新: " + new Date().toISOString() + "\n" +
  "// 来源: " + SOURCE + "\n" +
  "// 手动编辑将被覆盖，请勿手动修改此文件。\n" +
  "\n" +
  "import type { SmsRegion } from \"./sms-countries-data\";\n" +
  "\n" +
  "export type AutoCountry = {\n" +
  "  code: string;\n" +
  "  name: string;\n" +
  "  nameEn: string;\n" +
  "  dial: string;\n" +
  "  region: SmsRegion;\n" +
  "};\n" +
  "\n" +
  "export const AUTO_COUNTRIES: AutoCountry[] = [\n" +
  existingBlock +
  newEntries.join("\n") +
  "\n];\n";

console.log("      新增条目: " + newEntries.length);
console.log("      累计自动条目: " + (existingAuto.length + newEntries.length));

if (APPLY) {
  fs.writeFileSync(autoFile, autoContent);
  console.log("");
  console.log("✅ 已写入 " + autoFile);
} else {
  console.log("");
  console.log("📋 空跑模式，未写任何文件。");
  console.log("");
  console.log("---- 生成内容预览（前 30 行）----");
  console.log(autoContent.split("\n").slice(0, 30).join("\n"));
  console.log("...");
}

console.log("");
console.log("==========================================================");
console.log("【完成】");
console.log("==========================================================");
