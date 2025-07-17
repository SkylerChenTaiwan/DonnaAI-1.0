# 錯誤分析報告：Expo 開發伺服器連線失敗

## 錯誤摘要
- **錯誤訊息**: "Unknown error: Could not connect to the server. exp://localhost:8081"
- **發生時間**: 2025-07-18 凌晨 4:58
- **環境**: iOS 模擬器/實機
- **專案類型**: React Native with Expo

## 根本原因分析

### 可能原因（按可能性排序）：

1. **Expo 開發伺服器未啟動**
   - Metro bundler 沒有在運行
   - 伺服器意外關閉或崩潰
   - 端口 8081 被其他進程佔用

2. **網路配置問題**
   - iOS 設備無法訪問 localhost
   - 防火牆阻擋了連接
   - VPN 或代理設定干擾

3. **Metro bundler 配置錯誤**
   - package.json 中的配置有誤
   - Metro 配置文件損壞
   - 快取問題

4. **開發環境問題**
   - Node modules 需要重新安裝
   - Expo CLI 版本不兼容
   - React Native 版本衝突

## 解決方案選項

### 選項 1：重啟 Expo 開發伺服器（推薦）
**步驟**：
```bash
# 1. 停止當前所有 Metro 進程
killall -9 node

# 2. 清除快取並重新啟動
npx expo start -c

# 3. 如果使用實機，使用 tunnel 模式
npx expo start --tunnel
```

**優點**：
- 快速簡單
- 解決大部分常見問題
- 保留現有配置

**缺點**：
- 可能無法解決深層配置問題

### 選項 2：修復網路配置
**步驟**：
```bash
# 1. 檢查端口佔用
lsof -i :8081

# 2. 如果被佔用，終止進程
kill -9 <PID>

# 3. 重置網路配置
sudo dscacheutil -flushcache
```

**優點**：
- 解決端口衝突
- 修復 DNS 快取問題

**缺點**：
- 需要系統權限
- 可能影響其他服務

### 選項 3：重建開發環境
**步驟**：
```bash
# 1. 清理現有環境
rm -rf node_modules
rm -rf .expo
npx expo prebuild --clear

# 2. 重新安裝依賴
npm install
cd ios && pod install && cd ..

# 3. 啟動開發伺服器
npx expo start
```

**優點**：
- 徹底解決依賴問題
- 確保環境一致性

**缺點**：
- 耗時較長
- 需要重新下載所有依賴

### 選項 4：使用備用配置
**步驟**：
1. 修改 app.json 或 app.config.js
2. 指定不同的端口
3. 使用 LAN 模式替代 localhost

**優點**：
- 避開端口衝突
- 支援多設備開發

**缺點**：
- 需要修改專案配置
- 可能影響團隊協作

## 影響評估

- **開發影響**：無法進行即時開發和測試
- **時間成本**：依解決方案不同，5分鐘到30分鐘不等
- **風險等級**：低 - 僅影響開發環境，不影響生產代碼

## 建議執行順序

1. 先嘗試**選項 1**（重啟伺服器）- 最快速
2. 如果失敗，執行**選項 2**（修復網路）
3. 仍有問題時，使用**選項 3**（重建環境）
4. 最後考慮**選項 4**（備用配置）

## 預防措施

1. 定期更新 Expo CLI 和相關依賴
2. 使用 .nvmrc 固定 Node 版本
3. 建立開發環境檢查腳本
4. 文檔化端口使用情況