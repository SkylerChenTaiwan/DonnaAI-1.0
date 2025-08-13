#!/bin/bash

# Adaptive 元件檢查腳本
# 檢查是否使用了禁用的 React Native 元件

echo "🔍 檢查 Adaptive 元件使用..."

# 檢查是否使用了禁用的元件
FORBIDDEN_IMPORTS=(
  "import.*Switch.*from.*['\"]react-native['\"]"
  "import.*Picker.*from.*['\"]@react-native-picker/picker['\"]"
  "from ['\"]react-native['\"].*Switch"
  "from ['\"]react-native['\"].*Picker"
)

# 錯誤計數
ERROR_COUNT=0

# 只檢查 staged 的檔案
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ 沒有需要檢查的檔案"
  exit 0
fi

for pattern in "${FORBIDDEN_IMPORTS[@]}"; do
  for file in $STAGED_FILES; do
    if grep -E "$pattern" "$file" > /dev/null 2>&1; then
      echo "❌ 發現禁用的元件 import 在 $file："
      grep -E "$pattern" "$file" | head -5
      echo ""
      echo "💡 請使用 @/components/adaptive 中的 Adaptive 元件："
      echo "   - Switch → AdaptiveSwitch"
      echo "   - Picker → AdaptiveSelect"
      echo "   - Modal → AdaptiveModal"
      echo "   - Button → AdaptiveButton"
      echo "   - TextInput → AdaptiveInput"
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
done

# 檢查直接使用元件標籤
FORBIDDEN_TAGS=(
  "<Switch[[:space:]]"
  "<Picker[[:space:]]"
  "</Switch>"
  "</Picker>"
)

for pattern in "${FORBIDDEN_TAGS[@]}"; do
  for file in $STAGED_FILES; do
    if grep -E "$pattern" "$file" > /dev/null 2>&1; then
      echo "❌ 發現禁用的元件標籤在 $file："
      grep -E "$pattern" "$file" | head -5
      echo ""
      echo "💡 請替換為對應的 Adaptive 元件"
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
done

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ Adaptive 元件檢查失敗！發現 $ERROR_COUNT 個問題"
  echo ""
  echo "📚 詳細指南請參考 CLAUDE.md 的『🎯 Web UI 元件使用規範』章節"
  exit 1
fi

echo "✅ Adaptive 元件檢查通過！"
exit 0