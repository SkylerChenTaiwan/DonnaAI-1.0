#!/bin/bash

echo "啟動 Metro Bundler..."

# 先停止任何現有的 Metro 進程
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null

# 等待進程完全停止
sleep 2

# 執行 Firebase patches
echo "執行 Firebase patches..."
node create-firebase-patches.js

# 在背景啟動 Metro
echo "啟動 Metro..."
nohup npx expo start > metro.log 2>&1 &

# 等待 Metro 啟動
echo "等待 Metro 啟動..."
for i in {1..30}; do
  if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "✅ Metro 已成功啟動！"
    echo "📱 請在 Expo Go 中連接到: localhost:8081"
    echo "📋 查看日誌: tail -f metro.log"
    echo "🛑 停止 Metro: pkill -f 'expo start'"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "⚠️  Metro 啟動可能需要更長時間，請檢查 metro.log"