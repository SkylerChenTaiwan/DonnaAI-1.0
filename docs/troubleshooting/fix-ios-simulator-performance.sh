#!/bin/bash
# iOS 模擬器效能問題修復腳本
# 請按順序執行以下命令

echo "開始修復 iOS 模擬器效能問題..."

# 1. 關閉所有相關進程
echo "\n步驟 1: 關閉所有相關進程..."
killall Simulator 2>/dev/null
killall node 2>/dev/null
killall watchman 2>/dev/null

# 2. 清理 Metro 快取
echo "\n步驟 2: 清理 Metro 快取..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-*

# 3. 清理 Watchman 狀態
echo "\n步驟 3: 清理 Watchman 狀態..."
watchman watch-del-all 2>/dev/null

# 4. 清理 Expo 快取
echo "\n步驟 4: 清理 Expo 快取..."
rm -rf ~/.expo/

# 5. 清理 npm/yarn 快取
echo "\n步驟 5: 清理 npm 快取..."
npm cache clean --force

# 6. 重置 iOS 模擬器
echo "\n步驟 6: 重置 iOS 模擬器..."
xcrun simctl shutdown all
xcrun simctl erase all

# 7. 清理專案快取
echo "\n步驟 7: 清理專案快取..."
cd /Users/skyler/coding/DonnaAI-1.0
rm -rf node_modules/.cache
rm -rf .expo

# 8. 重新安裝依賴（可選）
echo "\n步驟 8: 是否要重新安裝依賴？(y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    npm install
fi

echo "\n✅ 修復完成！"
echo "\n建議操作："
echo "1. 重新啟動電腦（可選但推薦）"
echo "2. 開啟活動監視器，檢查是否有占用大量資源的進程"
echo "3. 確保至少有 10GB 可用磁碟空間"
echo "4. 使用 'npm start -- --reset-cache' 啟動專案"
echo "\n如果問題持續，請執行以下額外步驟："
echo "- 在 Xcode 中清理衍生資料：~/Library/Developer/Xcode/DerivedData"
echo "- 更新 Xcode 和命令列工具"
echo "- 檢查是否有防毒軟體影響效能"