#!/bin/bash

echo "🚀 啟動 DonnaAI Expo 開發伺服器"
echo "================================"
echo ""
echo "你的本地 IP: 10.1.1.130"
echo ""
echo "請選擇啟動方式："
echo "1) 標準模式 (同網路)"
echo "2) Tunnel 模式 (不同網路也可)"
echo "3) 開發客戶端模式"
echo ""
read -p "請輸入選項 (1-3): " choice

case $choice in
  1)
    echo "啟動標準模式..."
    npx expo start --clear
    ;;
  2)
    echo "啟動 Tunnel 模式..."
    npx expo start --tunnel --clear
    ;;
  3)
    echo "啟動開發客戶端模式..."
    echo "請選擇平台："
    echo "i) iOS"
    echo "a) Android"
    read -p "請輸入選項: " platform
    case $platform in
      i)
        npx expo run:ios
        ;;
      a)
        npx expo run:android
        ;;
      *)
        echo "無效選項"
        ;;
    esac
    ;;
  *)
    echo "無效選項，使用標準模式"
    npx expo start --clear
    ;;
esac