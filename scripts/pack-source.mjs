#!/usr/bin/env node
// 把 git ls-files 里所有文本文件拼成一个 txt
// 二进制文件只列路径，不写内容

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .sort();

const out = [];
out.push("# my-site 完整源码转储");
out.push(`# 生成时间：${new Date().toISOString()}`);
out.push(`# git 跟踪文件总数：${files.length}`);
out.push("#");
out.push("# 说明：本文件由 scripts/pack-source.mjs 自动生成，来源于 git ls-files。");
out.push("#       二进制文件（图片等）仅列出路径，不包含内容。");
out.push("");

let textCount = 0;
let skipCount = 0;

for (const f of files) {
  const full = path.join(ROOT, f);

  let isBinary = false;
  let size = 0;
  let buf;
  try {
    buf = fs.readFileSync(full);
    size = buf.length;
    const head = buf.subarray(0, 8000);
    for (let i = 0; i < head.length; i++) {
      if (head[i] === 0) { isBinary = true; break; }
    }
  } catch {
    out.push(`\n===== ./${f} =====`);
    out.push("（无法读取，跳过）");
    skipCount++;
    continue;
  }

  out.push(`\n===== ./${f} =====`);
  if (isBinary) {
    out.push(`（二进制文件，${size} 字节，内容已跳过）`);
    skipCount++;
  } else {
    try {
      const text = buf.toString("utf8");
      out.push(text);
      textCount++;
    } catch {
      out.push("（读取文本失败）");
      skipCount++;
    }
  }
}

out.push("");
out.push(`# 包含文本内容：${textCount}`);
out.push(`# 跳过：${skipCount}`);

process.stdout.write(out.join("\n"));
