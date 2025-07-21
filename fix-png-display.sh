#!/bin/bash

echo "🔧 開始修復 PNG 顯示問題..."

# 1. 停止所有 Metro 進程
echo "📦 停止 Metro Bundler..."
pkill -f "metro" || true
pkill -f "react-native" || true

# 2. 清除快取
echo "🧹 清除快取..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# 3. 清除 node_modules 快取
echo "🗑️  清除 node_modules 快取..."
rm -rf node_modules/.cache

# 4. 重置 watchman (如果有安裝)
if command -v watchman &> /dev/null; then
    echo "🔄 重置 Watchman..."
    watchman watch-del-all
fi

# 5. 檢查圖片檔案
echo "🖼️  檢查圖片檔案..."
echo "PNG 檔案列表："
find assets -name "*.png" -type f -exec ls -la {} \;

# 6. 驗證圖片格式
echo "📋 驗證圖片格式："
find assets -name "*.png" -type f -exec file {} \;

# 7. 提示下一步
echo ""
echo "✅ 清理完成！"
echo ""
echo "📝 下一步："
echo "1. 執行: npx expo start -c"
echo "2. 在 App.tsx 中暫時導入測試頁面："
echo "   import { ImageTestScreen } from './src/screens/test/ImageTestScreen';"
echo "   然後在主要組件中使用 <ImageTestScreen />"
echo "3. 查看控制台的圖片載入訊息"
echo ""
echo "💡 如果還是無法顯示，請嘗試："
echo "- 檢查是否有防火牆或安全軟體阻擋"
echo "- 確認 Expo Go 應用程式是最新版本"
echo "- 在不同裝置/模擬器上測試"