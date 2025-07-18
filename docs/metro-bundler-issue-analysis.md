# Metro Bundler 問題分析報告

## 🔍 問題總結

### 症狀
- Metro bundler 顯示 "Waiting on http://localhost:8081" 但無法實際監聽端口
- Expo Go 無法連接到開發伺服器
- HTTP 500 錯誤："npx expo is in non-interactive mode"

### 根本原因
**Node.js v24.3.0 與 Expo SDK 51/Metro bundler 的相容性問題**

## 📊 版本配置變更歷程

### 1. 初始嘗試升級（失敗）
從 commit `5f389549` 到 `93153deb`：
- **Expo SDK**: 51.0.0 → 53.0.0
- **React**: 18.2.0 → 19.0.0  
- **React Native**: 0.74.5 → 0.79.5
- **結果**: 複雜的依賴衝突，Metro 無法正常啟動

### 2. 完全回滾（部分成功）
從 commit `93153deb` 到 `5f389549`：
- 回滾到原始版本配置
- **Expo SDK**: 51.0.0
- **React**: 18.2.0
- **React Native**: 0.74.5
- **結果**: 依賴安裝成功，但 Metro 仍無法監聽端口

### 3. Node.js 降級（成功）
- **Node.js**: v24.3.0 → v20.18.0
- **結果**: Metro bundler 正常運作

## 🌐 搜尋發現

### 1. Metro Bundler 常見問題
- 端口 8081 被佔用（非本案例問題）
- 防毒軟體（如 McAfee）可能佔用端口
- 多個 Metro 實例同時運行
- 快取問題導致 bundler 卡住

### 2. Node.js v24 相關資訊
- Node.js 24 於 2025 年 5 月 6 日發布
- 將於 2025 年 10 月成為 LTS 版本
- 包含 V8 引擎更新和 NPM 11
- **目前尚未完全支援所有 React Native 工具鏈**

### 3. Expo SDK 51 特性
- 支援 React Native 0.74.x
- 使用 Metro bundler 作為預設打包器
- 移除了 "exotic" bundler，使用標準 @expo/metro-config

## 🔧 解決方案

### 立即解決（已實施）
1. **降級 Node.js 到 v20.18.0**
   ```bash
   nvm install 20.18.0
   nvm use 20.18.0
   ```

2. **重新安裝依賴**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **啟動開發伺服器**
   ```bash
   npx expo start --lan --clear
   ```

### 長期建議
1. **等待 Node.js 24 LTS**
   - 預計 2025 年 10 月後會有更好的相容性
   - React Native 工具鏈需要時間適配

2. **考慮升級路徑**
   - 先保持 Expo SDK 51 + Node.js 20
   - 等待 Expo SDK 54+ 對 Node.js 24 的官方支援

3. **開發環境最佳實踐**
   - 使用 nvm 管理 Node.js 版本
   - 在 `.nvmrc` 檔案中鎖定專案 Node.js 版本
   - 定期更新但避免使用最新的非 LTS 版本

## 📝 經驗教訓

1. **版本相容性矩陣**
   - Expo SDK 51 + React 18.2.0 + RN 0.74.5 + Node.js 20.x = ✅
   - Expo SDK 53 + React 19.0.0 + RN 0.79.5 + Node.js 24.x = ❌

2. **診斷步驟**
   - 檢查 Metro 是否真的在監聽端口
   - 驗證網路連接（localhost vs LAN IP）
   - 確認 Node.js 版本相容性

3. **避免的陷阱**
   - 不要假設 Metro "Waiting on" 訊息代表伺服器正在運行
   - 不要使用太新的 Node.js 版本於生產專案
   - 升級前要檢查完整的相容性矩陣

## 🚀 後續行動

1. **建立 .nvmrc 檔案**
   ```
   20.18.0
   ```

2. **更新專案文件**
   - 在 README.md 中註明 Node.js 版本要求
   - 記錄版本相容性資訊

3. **監控更新**
   - 關注 Expo SDK 54 發布
   - 追蹤 Node.js 24 LTS 狀態
   - 測試新版本相容性

---

最後更新：2025-07-18