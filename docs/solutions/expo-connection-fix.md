# Expo Go 連接問題解決方案

## 問題症狀
- Expo Go 顯示："Could not connect to the server"
- 錯誤訊息：`exp://localhost:8081`
- Metro bundler 已啟動但 App 無法連接

## 根本原因
1. **localhost 限制**：Expo Go 嘗試連接 `localhost:8081`，但在行動設備上 localhost 指向設備本身，不是開發機器
2. **網路介面綁定**：Metro bundler 可能只綁定到 localhost，無法接受外部連接

## 解決方案

### 方案 1: 使用 Expo CLI 的 LAN 模式（推薦）
```bash
# 停止現有進程
pkill -f metro || true
pkill -f expo || true

# 啟動 Expo 開發伺服器 - LAN 模式
npx expo start --lan --clear
```

### 方案 2: 使用 React Native CLI 指定 host
```bash
# 停止現有進程
pkill -f metro || true

# 使用 React Native CLI 啟動，指定監聽所有介面
npx react-native start --host 0.0.0.0 --reset-cache
```

### 方案 3: 使用 Tunnel 模式（需要網路穩定）
```bash
# 安裝 ngrok 依賴
npm install -g @expo/ngrok

# 使用 tunnel 模式
npx expo start --tunnel --clear
```

## 驗證步驟

### 1. 確認 Metro 運行狀態
```bash
# 檢查 Metro 進程
ps aux | grep metro

# 檢查端口佔用
lsof -i :8081

# 測試連接
curl -I http://本機IP:8081
```

### 2. 檢查網路設定
```bash
# 獲取本機 IP
ifconfig | grep -A 1 "inet "

# 確保 Expo Go 和開發機器在同一網段
```

### 3. Expo Go 連接設定
- 在 Expo Go 中手動輸入開發機器 IP：`exp://本機IP:8081`
- 或掃描 QR code（確保使用 LAN 模式生成的 QR code）

## 建議的啟動腳本

在 `package.json` 中添加：
```json
{
  "scripts": {
    "start": "expo start",
    "start:lan": "expo start --lan --clear",
    "start:tunnel": "expo start --tunnel --clear",
    "start:metro": "react-native start --host 0.0.0.0 --reset-cache"
  }
}
```

## 疑難排解

### 問題：仍然無法連接
**解決方案**：
1. 檢查防火牆設定，允許 8081 端口
2. 確認路由器不阻擋設備間通信
3. 重啟 Wi-Fi 連接
4. 嘗試 USB 除錯模式

### 問題：Metro 啟動失敗
**解決方案**：
1. 清除 node_modules 和重新安裝
2. 檢查 Node.js 版本相容性
3. 檢查是否有其他服務佔用 8081 端口

### 問題：QR code 掃描後無反應
**解決方案**：
1. 確保使用 `--lan` 模式生成 QR code
2. 手動輸入 IP 地址：`exp://本機IP:8081`
3. 檢查 Expo Go App 是否需要更新

## 預防措施

1. **建立啟動檢查腳本**：
   ```bash
   #!/bin/bash
   echo "檢查網路連接..."
   ping -c 1 google.com
   echo "啟動 Metro bundler..."
   npm run start:lan
   ```

2. **設定開發環境變數**：
   - 記錄常用的開發機器 IP
   - 建立快速切換網路模式的腳本

3. **文檔化常見問題**：
   - 在專案 README 中記錄連接步驟
   - 建立疑難排解清單