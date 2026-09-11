#!/data/data/com.termux/files/usr/bin/bash
set -u

CI=".github/workflows/ci.yml"
DEPLOY=".github/workflows/deploy.yml"

echo "================================================"
echo "【阶段 9｜CI / Deploy Workflow 深度检查】"
echo "================================================"
echo

echo "========== 【步骤 1/6：检查 CI Workflow】 =========="
if [ -f "$CI" ]; then
  echo "OK: $CI 存在"
else
  echo "ERROR: $CI 不存在"
fi
echo

echo "========== 【步骤 2/6：输出 ci.yml 完整内容】 =========="
if [ -f "$CI" ]; then
  cat "$CI"
else
  echo "跳过"
fi
echo

echo "========== 【步骤 3/6：检查 Deploy Workflow】 =========="
if [ -f "$DEPLOY" ]; then
  echo "OK: $DEPLOY 存在"
else
  echo "ERROR: $DEPLOY 不存在"
fi
echo

echo "========== 【步骤 4/6：输出 deploy.yml 完整内容】 =========="
if [ -f "$DEPLOY" ]; then
  cat "$DEPLOY"
else
  echo "跳过"
fi
echo

echo "========== 【步骤 5/6：检查 Node / npm / 构建 / 部署关键词】 =========="
echo "CI："
grep -nE 'runs-on|setup-node|node-version|npm ci|npm install|npm run build|wrangler|workflow_dispatch|push:|pull_request:' \
  "$CI" 2>/dev/null || true
echo
echo "Deploy："
grep -nE 'runs-on|setup-node|node-version|npm ci|npm install|npm run build|wrangler|workflow_dispatch|push:|pull_request:' \
  "$DEPLOY" 2>/dev/null || true
echo

echo "========== 【步骤 6/6：检查当前 Git 状态】 =========="
git status --short
echo

echo "================================================"
echo "【阶段 9｜CI / Deploy Workflow 检查完成】"
echo "================================================"
echo
echo "【重要】本脚本只读取 Workflow，不修改任何文件。"
echo "【下一步】请把完整输出原样发送给我。"
echo
