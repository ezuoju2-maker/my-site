#!/data/data/com.termux/files/usr/bin/bash
set -u

echo "================================================"
echo "【阶段 5｜satteri 原生依赖故障诊断脚本】"
echo "================================================"
echo

echo "========== 【步骤 1/6：检查 Node / npm 环境】 =========="
echo "Node：$(node -v)"
echo "npm ：$(npm -v)"
echo

echo "========== 【步骤 2/6：检查 Astro 版本】 =========="
if [ -f "node_modules/astro/package.json" ]; then
  grep -m 1 '"version"' node_modules/astro/package.json || true
else
  echo "WARN: node_modules/astro/package.json 不存在"
fi
echo

echo "========== 【步骤 3/6：检查 satteri 是否安装】 =========="
if [ -d "node_modules/satteri" ]; then
  echo "OK: node_modules/satteri 存在"
else
  echo "WARN: node_modules/satteri 不存在"
fi

if [ -f "node_modules/satteri/package.json" ]; then
  echo "satteri package.json："
  grep -E '"name"|"version"|"optionalDependencies"|"os"|"cpu"' \
    node_modules/satteri/package.json || true
else
  echo "WARN: satteri package.json 不存在"
fi
echo

echo "========== 【步骤 4/6：检查 satteri Android ARM64 原生包】 =========="
if [ -d "node_modules/@bruits" ]; then
  echo "@bruits 目录内容："
  find node_modules/@bruits -maxdepth 2 -type d 2>/dev/null | sort
else
  echo "WARN: node_modules/@bruits 不存在"
fi
echo

echo "========== 【步骤 5/6：检查 lockfile 中的依赖关系】 =========="
echo "package-lock.json 中与 satteri 相关的记录："
grep -n -C 3 '"satteri"' package-lock.json 2>/dev/null || true
echo

echo "========== 【步骤 6/6：检查 node_modules 中实际原生文件】 =========="
echo "搜索 satteri native 文件："
find node_modules -type f \( \
  -name '*satteri*.node' \
  -o -name 'satteri_napi.*.node' \
\) 2>/dev/null | head -n 50

echo
echo "================================================"
echo "【阶段 5｜satteri 故障诊断完成】"
echo "================================================"
echo
echo "【重要】本脚本只读取和检查，不删除、不安装、不修改项目文件。"
echo "【下一步】请把完整输出原样发送给我。"
echo
