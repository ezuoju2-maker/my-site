#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/my-site

echo "=================================================="
echo "【阶段 2A】安装 simple-icons 并下载本地图标"
echo "=================================================="

if [ ! -d "node_modules/simple-icons" ]; then
  echo "正在安装 simple-icons（首次会下载约 15MB，请耐心等待）..."
  npm install simple-icons --save-dev --no-audit --no-fund
fi

echo "OK: simple-icons 已就绪"

mkdir -p public/icons

node << 'NODE'
const fs = require("fs");
const path = require("path");

const dataFile = "src/components/sms-services-data.ts";
const data = fs.readFileSync(dataFile, "utf8");
const slugs = [...data.matchAll(/\bs\("([^"]+)"/g)].map((m) => m[1]);

const srcDir = "node_modules/simple-icons/icons";
const destDir = "public/icons";

if (!fs.existsSync(srcDir)) {
  console.error("ERROR: simple-icons 未正确安装，找不到 " + srcDir);
  process.exit(1);
}

let ok = 0;
let miss = 0;
const missing = [];

for (const slug of slugs) {
  const src = path.join(srcDir, slug + ".svg");
  const dest = path.join(destDir, slug + ".svg");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    ok++;
  } else {
    miss++;
    missing.push(slug);
  }
}

console.log("");
console.log("已复制图标: " + ok);
console.log("缺失图标: " + miss);
if (missing.length > 0) {
  console.log("");
  console.log("缺失列表（页面会用首字母 fallback）:");
  console.log(missing.join(", "));
}

fs.writeFileSync("public/icons/_missing.txt", missing.join("\n") + "\n");
NODE

echo ""
echo "=================================================="
echo "【阶段 2A 完成】"
echo "=================================================="
echo "图标文件数：$(ls public/icons/*.svg 2>/dev/null | wc -l)"
echo "目录大小：$(du -sh public/icons 2>/dev/null | cut -f1)"
echo ""
echo "下一步：把上面的完整输出发给我，我给你阶段 2B 脚本（更新页面组件）。"
