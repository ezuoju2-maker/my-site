#!/data/data/com.termux/files/usr/bin/bash
set -u

echo "================================================"
echo "【阶段 4｜接码页面生产构建验证脚本】"
echo "================================================"
echo

echo "========== 【步骤 1/5：确认项目目录】 =========="
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json 不存在"
  exit 1
fi
echo "OK: package.json 存在"
echo

echo "========== 【步骤 2/5：确认目标页面源码】 =========="
if [ ! -f "src/components/SmsServicePage.tsx" ]; then
  echo "ERROR: SmsServicePage.tsx 不存在"
  exit 1
fi
echo "OK: SmsServicePage.tsx 存在"
echo

echo "========== 【步骤 3/5：确认 package.json 构建脚本】 =========="
if grep -Fq '"build"' package.json; then
  echo "OK: 检测到 build 脚本"
  grep -n '"build"' package.json | head -n 1
else
  echo "ERROR: 未检测到 build 脚本"
  exit 1
fi
echo

echo "========== 【步骤 4/5：执行生产构建】 =========="
echo "说明：这一阶段只进行构建验证，不修改页面源码。"
echo
npm run build
BUILD_EXIT=$?
echo

if [ "$BUILD_EXIT" -eq 0 ]; then
  echo "OK: npm run build 执行成功"
else
  echo "ERROR: npm run build 执行失败"
  echo "构建退出码：$BUILD_EXIT"
  exit "$BUILD_EXIT"
fi
echo

echo "========== 【步骤 5/5：检查构建产物】 =========="
if [ -d "dist" ]; then
  echo "OK: dist 目录存在"
else
  echo "ERROR: dist 目录不存在"
  exit 1
fi

echo
echo "================================================"
echo "【阶段 4｜生产构建验证完成】"
echo "================================================"
echo
echo "【重要】本阶段没有主动修改 SmsServicePage.tsx。"
echo "【下一步】请把完整构建输出原样发送给我。"
echo
