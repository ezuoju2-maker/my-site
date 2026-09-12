#!/usr/bin/env node
/**
 * 抓号层主脚本
 *
 * 交互式运行：
 *   export GRAB_WORKER_SECRET="你的密钥"
 *   node grabber/index.mjs
 *
 * 流程：
 *   1. 从后端拉取待抓队列
 *   2. 显示列表，用户选一个订单
 *   3. 引导用户去平台 App 查看账号信息
 *   4. 用户输入 ID 和昵称
 *   5. 脚本 POST 到后端，网页自动切成功视图
 */

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getAdapter } from "./adapters/index.mjs";

const API_BASE = process.env.GRAB_API_BASE || "https://my-site-n7j.pages.dev";
const GRAB_KEY = process.env.GRAB_WORKER_SECRET || "";

if (!GRAB_KEY) {
  console.error("\n❌ 缺少环境变量 GRAB_WORKER_SECRET");
  console.error("   请执行：export GRAB_WORKER_SECRET=\"你的密钥\"\n");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

function c(label, code) {
  return `\x1b[${code}m${label}\x1b[0m`;
}
const dim = (s) => c(s, "2");
const bold = (s) => c(s, "1");
const green = (s) => c(s, "32");
const yellow = (s) => c(s, "33");
const red = (s) => c(s, "31");
const cyan = (s) => c(s, "36");

function header(text) {
  console.log("\n" + cyan("━".repeat(50)));
  console.log("  " + bold(text));
  console.log(cyan("━".repeat(50)) + "\n");
}

function fmtTime(iso) {
  if (!iso) return "—";
  return iso.replace("T", " ").slice(0, 16);
}

async function fetchPending() {
  const r = await fetch(`${API_BASE}/api/grab/worker/pending`, {
    headers: { "X-Grab-Key": GRAB_KEY },
  });
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error("密钥错误（401）：GRAB_WORKER_SECRET 与 Cloudflare 上的不一致");
    }
    throw new Error(`后端返回 ${r.status}`);
  }
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || "拉取失败");
  return d.orders || [];
}

async function submit(order, account) {
  const r = await fetch(`${API_BASE}/api/grab/qr/consume`, {
    method: "POST",
    headers: {
      "X-Grab-Key": GRAB_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: order.token,
      nickname: account.nickname,
      externalId: account.externalId,
      avatar: null,
      credential: account.credential,
      ttlDays: 30,
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) {
    throw new Error(d.error || `提交失败（${r.status}）`);
  }
  return d;
}

async function processOrder(order) {
  header(`📋 处理订单：${order.platformName}`);

  console.log(`  订单 ID：${dim(order.id.slice(0, 12))}`);
  console.log(`  平台  ：${bold(order.platformName)}`);
  console.log(`  金额  ：¥${order.price.toFixed(2)}`);
  console.log(`  创建  ：${dim(fmtTime(order.createdAt))}`);
  console.log("");

  const adapter = getAdapter(order.platform);
  if (!adapter) {
    console.log(red(`  ❌ 不支持平台：${order.platform}`));
    console.log(dim("     已跳过\n"));
    return;
  }

  console.log(yellow("  以下操作需要你人工完成："));
  console.log("");
  adapter.instructions.forEach((line, i) => {
    console.log(`    ${bold(i + 1 + ".")} ${line}`);
  });
  console.log("");

  // 收集账号信息
  const nickname = (await rl.question("  请输入「账号昵称」：" )).trim();
  if (!nickname) {
    console.log(red("  ❌ 昵称不能为空，已取消\n"));
    return;
  }

  const externalId = (await rl.question("  请输入「账号 ID」（小红书/抖音号等）：")).trim();
  if (!externalId) {
    console.log(red("  ❌ ID 不能为空，已取消\n"));
    return;
  }

  // 生成凭证（实际是账号标识的封装，用户拿去浏览器用）
  const credential = adapter.buildCredential({
    nickname,
    externalId,
    orderId: order.id,
  });

  console.log("");
  console.log(dim("  正在提交到后端…"));

  try {
    const result = await submit(order, { nickname, externalId, credential });
    console.log("");
    console.log(green("  ✅ 提交成功"));
    console.log(dim(`     授权编号：${result.authorizationCode || "—"}`));
    console.log(dim(`     到期时间：${fmtTime(result.expiresAt)}`));
    console.log("");
    console.log(yellow("  👉 网页端会自动刷新为「抓号成功」"));
  } catch (e) {
    console.log("");
    console.log(red(`  ❌ 提交失败：${e.message}`));
  }
  console.log("");
}

async function main() {
  header("🌐 抓号层 · 交互模式");
  console.log(`  后端：${dim(API_BASE)}`);
  console.log(dim("  按 Ctrl+C 退出\n"));

  while (true) {
    let orders;
    try {
      console.log(dim("  正在拉取待抓队列…"));
      orders = await fetchPending();
    } catch (e) {
      console.log(red(`  ❌ ${e.message}`));
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (orders.length === 0) {
      console.log(dim("  暂无待抓订单，5 秒后重试…"));
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    header(`📥 待抓订单（${orders.length}）`);
    orders.forEach((o, i) => {
      console.log(`  ${bold(String(i + 1))}. [${o.platformName}] ¥${o.price.toFixed(2)}  ${dim(fmtTime(o.createdAt))}`);
    });
    console.log("");
    console.log(dim("  输入编号处理，或输入 q 退出，r 刷新"));

    const choice = (await rl.question("\n  > ")).trim().toLowerCase();

    if (choice === "q" || choice === "quit" || choice === "exit") {
      console.log("\n" + dim("  再见 👋\n"));
      break;
    }
    if (choice === "r" || choice === "") continue;

    const idx = parseInt(choice, 10) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= orders.length) {
      console.log(red("  ❌ 无效编号\n"));
      continue;
    }

    await processOrder(orders[idx]);
  }

  rl.close();
}

process.on("SIGINT", () => {
  console.log("\n" + dim("  已退出\n"));
  rl.close();
  process.exit(0);
});

main().catch((e) => {
  console.error(red(`\n❌ 运行错误：${e.message}\n`));
  process.exit(1);
});
