#!/bin/bash

echo "🔍 Expo 連接診斷工具"
echo "===================="
echo ""

# 檢查網路
echo "1. 網路資訊："
echo "   本機 IP: $(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
echo ""

# 檢查 Expo 端口
echo "2. 檢查 Expo 端口："
lsof -i :8081 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Metro Bundler 正在運行 (Port 8081)"
else
    echo "   ❌ Metro Bundler 未運行"
fi

lsof -i :19000 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Expo DevTools 正在運行 (Port 19000)"
else
    echo "   ⚠️  Expo DevTools 未運行"
fi

# 檢查防火牆
echo ""
echo "3. 防火牆狀態："
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "   無法檢查防火牆狀態"

# 測試建議
echo ""
echo "📋 建議："
echo "1. 確保手機和電腦在同一個 Wi-Fi"
echo "2. 在手機瀏覽器測試: http://$(ipconfig getifaddr en0 || ipconfig getifaddr en1):8081"
echo "3. 如果顯示 'React Native packager is running'，表示連接正常"
echo "4. 嘗試關閉 VPN（如果有開啟）"
echo "5. 重啟 Wi-Fi 路由器"
echo ""
echo "🚀 快速解決方案："
echo "   使用模擬器: npx expo run:ios"
echo "   使用 Tunnel: npx expo start --tunnel"