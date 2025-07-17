# Metro Bundler 啟動失敗根本原因分析

## 問題發現
通過深入診斷發現**真正的根本原因**：
- Metro bundler 聲稱啟動成功並顯示 "Waiting on http://localhost:8081"
- 但實際上端口 8081 **沒有在監聽任何連接**
- `curl localhost:8081` 顯示 "Connection refused"
- `lsof -i :8081` 和 `netstat -an | grep 8081` 都無結果
- 這不是網路連接問題，而是 Metro bundler 本身啟動失敗問題

## 可能原因

### 1. 端口被其他進程佔用但未正確釋放
### 2. Metro bundler 內部啟動錯誤但沒有報告
### 3. Node.js 版本不相容 (v24.3.0 可能太新)
### 4. 依賴衝突導致 Metro 模組無法正常載入
### 5. 快取問題或檔案權限問題

## 診斷步驟記錄

1. **依賴問題**：發現 React 19 和測試庫版本衝突 ✅ 已修復
2. **防火牆檢查**：macOS 防火牆已關閉 ✅
3. **網路設定**：本機 IP 10.1.1.142，無網路隔離問題 ✅
4. **Metro 實際狀態**：**問題在這裡 - Metro 未真正啟動** ❌

## 下一步解決方案

### 方案 A: Node.js 版本降級
```bash
# 使用 nvm 切換到穩定版本
nvm install 20.18.0
nvm use 20.18.0
```

### 方案 B: 完全清理重建
```bash
# 清理所有快取和模組
rm -rf node_modules package-lock.json
npm cache clean --force
watchman watch-del-all
npm install --legacy-peer-deps
```

### 方案 C: 使用替代工具
```bash
# 嘗試 Expo Development Build
npx create-expo --template
# 或使用 Vite + React Native Web
```

### 方案 D: 調試模式啟動
```bash
# 增加詳細日誌輸出
DEBUG=* npx expo start --lan
NODE_OPTIONS="--inspect" npx expo start
```

## 影響範圍
- **嚴重程度**: 關鍵 - 完全阻止開發
- **影響**: 整個 React Native 開發流程停滯
- **緊急程度**: 高 - 需要立即解決