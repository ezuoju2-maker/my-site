#!/data/data/com.termux/files/usr/bin/bash
set -u

echo "================================================"
echo "【阶段 6｜satteri Android ARM64 Registry 检查】"
echo "================================================"
echo

echo "========== 【步骤 1/5：检查 npm registry】 =========="
echo "当前 registry："
npm config get registry
echo

echo "========== 【步骤 2/5：检查 optional dependency 配置】 =========="
echo "omit："
npm config get omit
echo
echo "include："
npm config get include
echo

echo "========== 【步骤 3/5：检查 Android ARM64 原生包是否可见】 =========="
echo "查询：@bruits/satteri-android-arm64"
npm view @bruits/satteri-android-arm64 version
VIEW_EXIT=$?

if [ "$VIEW_EXIT" -eq 0 ]; then
  echo "OK: registry 可以找到 Android ARM64 原生包"
else
  echo "WARN: registry 无法正常返回 Android ARM64 原生包"
fi
echo

echo "========== 【步骤 4/5：检查 satteri optionalDependencies】 =========="
if [ -f "node_modules/satteri/package.json" ]; then
  grep -n -A 30 '"optionalDependencies"' \
    node_modules/satteri/package.json || true
else
  echo "ERROR: node_modules/satteri/package.json 不存在"
fi
echo

echo "========== 【步骤 5/5：检查 npm 环境平台信息】 =========="
echo "操作系统：$(uname -s)"
echo "CPU 架构：$(uname -m)"
echo "Node platform：$(node -p 'process.platform')"
echo "Node arch：$(node -p 'process.arch')"
echo

echo "================================================"
echo "【阶段 6｜Registry 检查完成】"
echo "================================================"
echo
echo "【重要】本脚本不会修改项目源码、node_modules 或 package-lock.json。"
echo "【下一步】请把完整输出原样发送给我。"
echo
