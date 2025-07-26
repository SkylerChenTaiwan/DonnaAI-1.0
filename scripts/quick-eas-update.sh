#!/bin/bash

# 快速更新 EAS Project ID 腳本
# 使用方式: ./scripts/quick-eas-update.sh YOUR-PROJECT-ID

if [ -z "$1" ]; then
    echo "❌ 錯誤：請提供 Project ID"
    echo "使用方式: ./scripts/quick-eas-update.sh YOUR-PROJECT-ID"
    echo ""
    echo "範例:"
    echo "  ./scripts/quick-eas-update.sh a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
    exit 1
fi

PROJECT_ID=$1

echo "🔄 更新 EAS Project ID: $PROJECT_ID"

# 更新 app.config.js
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-eas-project-id/$PROJECT_ID/g" app.config.js
else
    # Linux
    sed -i "s/your-eas-project-id/$PROJECT_ID/g" app.config.js
fi

echo "✅ 已更新 app.config.js"

# 驗證更新
echo ""
echo "📋 驗證更新結果："
grep -n "projectId" app.config.js | grep -v "//"

echo ""
echo "🎉 更新完成！"
echo ""
echo "下一步："
echo "1. 更新 Firebase 配置 (.env.production)"
echo "2. 更新 Apple 憑證資訊 (eas.json)"
echo "3. 執行測試帳號腳本"
echo "4. 開始建置"