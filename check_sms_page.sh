#!/data/data/com.termux/files/usr/bin/bash
set -u

FILE="src/components/SmsServicePage.tsx"

echo "================================================"
echo "【阶段 3｜接码页面源码体检脚本】"
echo "================================================"
echo

echo "========== 【步骤 1/7：检查项目目录】 =========="
if [ ! -d "$PWD" ]; then
  echo "ERROR: 当前目录不存在"
  exit 1
fi
echo "OK: 项目目录 $PWD"
echo

echo "========== 【步骤 2/7：检查目标文件】 =========="
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE 不存在"
  exit 1
fi
echo "OK: $FILE"
echo "文件大小：$(wc -c < "$FILE") bytes"
echo "文件行数：$(wc -l < "$FILE")"
echo

echo "========== 【步骤 3/7：检查核心页面结构】 =========="
check_text() {
  LABEL="$1"
  TEXT="$2"

  if grep -Fq "$TEXT" "$FILE"; then
    echo "OK: $LABEL"
  else
    echo "WARN: 未找到 $LABEL"
  fi
}

check_text "接码系统标题" "接码系统"
check_text "服务搜索框" 'placeholder="搜索服务"'
check_text "热门服务" "热门服务"
check_text "其他服务" "其他服务"
check_text "国家搜索框" 'placeholder="搜索国家 / 地区"'
check_text "热门国家" "热门国家"
check_text "其他国家" "其他国家"
check_text "返回按钮" 'aria-label="返回"'
echo

echo "========== 【步骤 4/7：检查热门服务数量】 =========="
SERVICE_COUNT=$(grep -c '\"id\": \"' "$FILE" || true)
echo "检测到服务定义数量：$SERVICE_COUNT"

if [ "$SERVICE_COUNT" -eq 8 ]; then
  echo "OK: 热门服务数量为 8"
else
  echo "WARN: 热门服务数量不是 8，请人工检查"
fi
echo

echo "========== 【步骤 5/7：检查热门国家数量】 =========="
COUNTRY_COUNT=$(grep -c 'id: "' "$FILE" || true)
echo "检测到国家定义数量：$COUNTRY_COUNT"

if [ "$COUNTRY_COUNT" -eq 8 ]; then
  echo "OK: 热门国家数量为 8"
else
  echo "WARN: 热门国家数量不是 8，请人工检查"
fi
echo

echo "========== 【步骤 6/7：检查关键 UI class】 =========="
check_text "两列服务布局" 'grid grid-cols-2'
check_text "白色页面背景" 'bg-neutral-50'
check_text "白色卡片" 'bg-white'
check_text "圆角卡片" 'rounded-xl'
check_text "页面最大宽度" 'max-w-3xl'
check_text "移动端左右内边距" 'px-5'
echo

echo "========== 【步骤 7/7：检查潜在风险点】 =========="

if grep -Fq "dangerouslySetInnerHTML" "$FILE"; then
  echo "INFO: 检测到 dangerouslySetInnerHTML"
  echo "      当前用于内置 SVG Logo，需要继续确认内容是否全部为固定常量"
else
  echo "OK: 未使用 dangerouslySetInnerHTML"
fi

if grep -Fq 'window.location.href' "$FILE"; then
  echo "INFO: 检测到页面跳转逻辑"
  echo "      当前用于返回 Dashboard，需要保留"
else
  echo "WARN: 未检测到返回跳转逻辑"
fi

if grep -Fq 'useState' "$FILE"; then
  echo "OK: React 状态管理存在"
else
  echo "WARN: 未检测到 useState"
fi

echo
echo "================================================"
echo "【阶段 3｜源码体检完成】"
echo "================================================"
echo
echo "【重要】本脚本只读取和检查源码，不修改目标文件。"
echo "【下一步】请把下面的完整输出原样发给我。"
echo
