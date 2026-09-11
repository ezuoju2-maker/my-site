#!/data/data/com.termux/files/usr/bin/bash
set -u

echo "================================================"
echo "【阶段 8｜GitHub Actions 生产构建配置检查】"
echo "================================================"
echo

echo "========== 【步骤 1/6：检查 Git 状态】 =========="
git status --short
echo

echo "========== 【步骤 2/6：检查 GitHub Actions 目录】 =========="
if [ -d ".github/workflows" ]; then
  echo "OK: .github/workflows 存在"
else
  echo "WARN: .github/workflows 不存在"
fi
echo

echo "========== 【步骤 3/6：列出 Workflow 文件】 =========="
if [ -d ".github/workflows" ]; then
  find .github/workflows -maxdepth 1 -type f -print | sort
else
  echo "无 Workflow 文件"
fi
echo

echo "========== 【步骤 4/6：检查 Workflow 中的构建命令】 =========="
if [ -d ".github/workflows" ]; then
  grep -RniE 'npm (ci|install|run build)|pnpm (install|run build)|yarn|astro build|wrangler deploy' \
    .github/workflows 2>/dev/null || true
else
  echo "跳过：Workflow 目录不存在"
fi
echo

echo "========== 【步骤 5/6：检查 package.json 关键脚本】 =========="
grep -nE '"(build|deploy|preview|dev)"[[:space:]]*:' package.json || true
echo

echo "========== 【步骤 6/6：检查 Cloudflare 配置文件】 =========="
for FILE in wrangler.toml wrangler.json wrangler.jsonc; do
  if [ -f "$FILE" ]; then
    echo "FOUND: $FILE"
  fi
done

echo
echo "================================================"
echo "【阶段 8｜GitHub Actions 配置检查完成】"
echo "================================================"
echo
echo "【重要】本脚本只读取配置和 Git 状态，不修改任何文件。"
echo "【下一步】请把完整输出原样发送给我。"
echo
