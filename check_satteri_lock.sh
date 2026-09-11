#!/data/data/com.termux/files/usr/bin/bash
set -u

FILE="package-lock.json"

echo "================================================"
echo "【阶段 7｜satteri 跨平台 Lockfile 检查】"
echo "================================================"
echo

echo "========== 【步骤 1/5：检查 package-lock.json】 =========="
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE 不存在"
  exit 1
fi

echo "OK: $FILE 存在"
echo "文件大小：$(wc -c < "$FILE") bytes"
echo

echo "========== 【步骤 2/5：检查 Linux x64 原生包 =========="
if grep -Fq '"node_modules/@bruits/satteri-linux-x64-gnu"' "$FILE"; then
  echo "OK: satteri-linux-x64-gnu 已记录"
else
  echo "WARN: 未找到 satteri-linux-x64-gnu"
fi
echo

echo "========== 【步骤 3/5：检查 Linux ARM64 原生包 =========="
if grep -Fq '"node_modules/@bruits/satteri-linux-arm64-gnu"' "$FILE"; then
  echo "OK: satteri-linux-arm64-gnu 已记录"
else
  echo "WARN: 未找到 satteri-linux-arm64-gnu"
fi
echo

echo "========== 【步骤 4/5：检查 WASM fallback =========="
if grep -Fq '"node_modules/@bruits/satteri-wasm32-wasi"' "$FILE"; then
  echo "OK: satteri-wasm32-wasi 已记录"
else
  echo "WARN: 未找到 satteri-wasm32-wasi"
fi
echo

echo "========== 【步骤 5/5：输出所有 satteri 平台包 =========="
echo "package-lock.json 中的 satteri 平台包："
grep -n '"node_modules/@bruits/satteri-' "$FILE" 2>/dev/null || true
echo

echo "================================================"
echo "【阶段 7｜跨平台 Lockfile 检查完成】"
echo "================================================"
echo
echo "【重要】本脚本只读取 package-lock.json，不修改任何文件。"
echo "【下一步】请把完整输出原样发送给我。"
echo
