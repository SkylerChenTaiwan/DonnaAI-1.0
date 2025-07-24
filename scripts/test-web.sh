#!/bin/bash

# Web 版本測試腳本
echo "🌐 正在構建 Web 版本..."
echo "================================"

# 清理舊的構建
rm -rf dist-web

# 導出 Web 版本
npx expo export --platform web --output-dir dist-web --clear

# 檢查是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Web 版本構建成功！"
    echo "================================"
    echo "🚀 啟動本地伺服器..."
    echo ""
    echo "Web 應用將在以下網址開啟："
    echo "http://localhost:3000"
    echo ""
    echo "按 Ctrl+C 停止伺服器"
    echo "================================"
    
    # 啟動伺服器
    cd dist-web && npx serve -p 3000
else
    echo ""
    echo "❌ Web 版本構建失敗"
    exit 1
fi