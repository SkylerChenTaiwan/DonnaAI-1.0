# 🚨 Expo Go 連接問題 - 立即解決方案

## 根本原因發現
通過深入分析，發現**真正問題**是：
- Metro bundler 看似啟動，但實際上沒有監聽任何端口
- 這是 Node.js v24.3.0 + Expo SDK 53 + React 19 組合的相容性問題
- 依賴衝突導致 Metro bundler 無法正確初始化

## 💡 立即解決方案（3 個選項）

### 選項 1: 使用 Expo Development Server（最推薦）
```bash
# 停止所有 Metro 進程
pkill -f metro; pkill -f expo

# 啟動 Expo Development Server（不依賴本地 Metro）
npx @expo/dev-server start --lan
```

### 選項 2: 降級 Node.js 版本
```bash
# 安裝 nvm（如果還沒有）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 使用穩定版本 Node.js
nvm install 20.18.0
nvm use 20.18.0

# 重新安裝依賴和啟動
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run start:lan
```

### 選項 3: 使用 Expo Tunnel（繞過網路問題）
```bash
# 確保安裝 ngrok
npm install -g @expo/ngrok

# 使用 tunnel 模式（穿透任何網路限制）
npx expo start --tunnel
```

## 🔧 快速除錯指令

### 檢查 Metro 是否真正運行
```bash
# 這個指令應該要有回應，如果沒有代表 Metro 沒有真正啟動
curl -I http://localhost:8081

# 檢查端口監聽狀態
lsof -i :8081
```

### 測試網路連接
```bash
# 獲取本機 IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 在 Expo Go 中手動輸入：exp://你的IP:8081
```

## 📱 Expo Go 連接步驟

1. **確保使用正確模式**：
   - 使用 `--lan` 或 `--tunnel` 模式
   - 不要使用預設的 localhost 模式

2. **手動輸入連接**：
   - 在 Expo Go 中點選 "Enter URL manually"
   - 輸入：`exp://你的本機IP:8081`
   - 例如：`exp://10.1.1.142:8081`

3. **確認 QR Code**：
   - QR code 應該包含你的 IP 地址，不是 localhost
   - 如果是 localhost，代表 LAN 模式沒有生效

## ⚡ 臨時快速測試

如果你想立即測試是否可以連接：

```bash
# 方法 1: 使用 serve 簡單 HTTP 伺服器測試
npx serve -l 8081 .

# 方法 2: 使用 Python 簡單伺服器
python3 -m http.server 8081 --bind 0.0.0.0
```

然後在瀏覽器或 Expo Go 測試 `http://你的IP:8081`

## 🎯 根本解決建議

1. **升級到 Expo SDK 54+**（當可用時）
2. **使用 Development Build** 而不是 Expo Go
3. **固定 Node.js 版本到 20.x**
4. **使用 Yarn** 而不是 npm（更好的依賴解析）

---
**如果以上都無效，問題可能是路由器的 AP 隔離設定阻止了設備間通信。**