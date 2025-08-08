#!/bin/bash

echo "🧹 開始清理並重新部署..."

# 1. 清除所有快取和舊檔案
echo "📦 清除快取..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf dist
rm -rf dist-web

# 2. 重新建構
echo "🔨 重新建構 Web 應用..."
npm run web:build

# 3. 驗證新版本
echo "✅ 驗證建構結果..."
ls -la dist-web/_expo/static/js/web/

# 4. 清除 Firebase 快取並部署
echo "🚀 部署到 Firebase..."
firebase hosting:disable
sleep 2
firebase hosting:enable
firebase deploy --only hosting

# 5. 清除 CDN 快取 (如果使用 Cloudflare)
echo "🌐 提示：請在 Cloudflare 或 CDN 控制台清除快取"

echo "✨ 完成！請使用無痕模式測試："
echo "   https://donnaai-5e601.web.app"
echo ""
echo "⚠️  重要：請按 Cmd+Shift+R 強制重新載入頁面"