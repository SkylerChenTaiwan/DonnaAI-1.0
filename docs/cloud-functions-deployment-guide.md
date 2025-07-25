# Cloud Functions 生產環境部署指南

## 📋 部署前檢查

### 環境準備
- [ ] Firebase CLI 已安裝並登入
- [ ] 已選擇生產專案：`firebase use donnaai-production`
- [ ] Blaze 計費方案已啟用
- [ ] Node.js 18 已安裝

### API 金鑰設定
- [ ] OpenAI API Key 已準備
- [ ] Claude API Key 已準備
- [ ] Gemini API Key 已準備

## 🔧 部署步驟

### 1. 設定環境變數

```bash
# 切換到 functions 目錄
cd functions

# 設定 API 金鑰（使用 Firebase Secrets）
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set GEMINI_API_KEY

# 驗證 secrets 設定
firebase functions:secrets:access OPENAI_API_KEY
```

### 2. 安裝依賴

```bash
# 安裝生產依賴
npm install

# 清理並重新安裝（如果需要）
rm -rf node_modules package-lock.json
npm install
```

### 3. 建置 TypeScript

```bash
# 建置 TypeScript 程式碼
npm run build

# 檢查建置輸出
ls -la lib/
```

### 4. 部署到生產環境

```bash
# 部署所有函數
firebase deploy --only functions

# 或部署特定函數
firebase deploy --only functions:processAudioFile
firebase deploy --only functions:aiProcessingAPI
firebase deploy --only functions:extractFieldsFromContent
firebase deploy --only functions:scheduledCalendarSync
```

### 5. 驗證部署

```bash
# 查看部署的函數列表
firebase functions:list

# 查看函數日誌
firebase functions:log --limit 50

# 查看特定函數日誌
firebase functions:log --only processAudioFile --limit 20
```

## 🔍 函數配置說明

### processAudioFile
- **觸發器**: Storage onObjectFinalized
- **路徑**: `records/audio/*`
- **記憶體**: 2GiB
- **逾時**: 540 秒
- **功能**: 處理音訊檔案，轉換為文字並進行 AI 分析

### aiProcessingAPI
- **觸發器**: HTTPS onRequest
- **端點**: `https://asia-east1-donnaai-production.cloudfunctions.net/aiProcessingAPI`
- **記憶體**: 2GiB
- **逾時**: 300 秒
- **功能**: 提供統一的 AI 處理 API

### extractFieldsFromContent
- **觸發器**: HTTPS onCall
- **記憶體**: 1GiB
- **逾時**: 300 秒
- **功能**: 從內容中提取結構化欄位

### scheduledCalendarSync
- **觸發器**: Pub/Sub Schedule
- **排程**: 每小時執行
- **記憶體**: 1GiB
- **逾時**: 300 秒
- **功能**: 定期同步日曆資料

## 🚨 常見問題排除

### 1. 部署失敗：權限錯誤
```bash
# 確保有正確的權限
firebase projects:list
gcloud config set project donnaai-production
```

### 2. 建置錯誤：TypeScript
```bash
# 清理並重新建置
rm -rf lib/
npm run build
```

### 3. Runtime 錯誤：找不到模組
```bash
# 確保所有依賴都已安裝
npm install --production
```

### 4. API Key 錯誤
```bash
# 重新設定 secrets
firebase functions:secrets:destroy OPENAI_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
```

## 📊 監控和維護

### 查看函數指標
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇 Functions
3. 查看執行次數、錯誤率、延遲等指標

### 設定警報
1. 在 Google Cloud Console 設定監控警報
2. 設定錯誤率閾值
3. 設定執行時間閾值

### 成本監控
1. 查看 Firebase 計費頁面
2. 設定預算警報
3. 定期檢查函數使用量

## 🔐 安全最佳實踐

1. **API 金鑰管理**
   - 使用 Firebase Secrets 管理敏感資訊
   - 定期輪換 API 金鑰
   - 不要在程式碼中硬編碼金鑰

2. **權限控制**
   - 使用最小權限原則
   - 定期審查 IAM 權限
   - 使用服務帳號進行函數間通訊

3. **輸入驗證**
   - 驗證所有外部輸入
   - 使用類型檢查
   - 實施速率限制

## 📝 部署檢查清單

### 部署前
- [ ] 所有測試通過
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 環境變數已設定
- [ ] API 金鑰已配置

### 部署後
- [ ] 所有函數成功部署
- [ ] 測試端點可訪問
- [ ] 日誌無錯誤
- [ ] 監控指標正常
- [ ] 成本在預算內

---

更新時間：2025-07-25
負責人：[請填寫]