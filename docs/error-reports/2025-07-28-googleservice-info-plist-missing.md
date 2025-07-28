# 錯誤分析報告：iOS 建置時 GoogleService-Info.plist 遺失

## 錯誤摘要
- **錯誤訊息**：`Build input file cannot be found: '/Users/expo/workingdir/build/ios/DonnaAI/GoogleService-Info.plist'`
- **錯誤時間**：2025-07-28
- **影響範圍**：iOS 生產版本無法建置

## 根本原因分析

### 問題描述
EAS Build 在遠端伺服器建置時找不到 GoogleService-Info.plist 檔案。這個檔案是 Firebase 配置檔，但由於包含敏感資訊，通常會被加入 .gitignore。

### 技術細節
- 本地專案有此檔案：`/ios/DonnaAI/GoogleService-Info.plist`
- EAS Build 在雲端建置時需要此檔案
- 檔案通常不會提交到 Git（安全考量）

## 解決方案

### 方案一：使用 EAS Secrets（推薦）
1. 將 GoogleService-Info.plist 內容轉為 base64
2. 上傳到 EAS Secrets
3. 在建置時自動還原

### 方案二：將檔案加入 Git
1. 確認檔案不包含真正的敏感資訊
2. 將檔案提交到 Git
3. 重新建置

### 方案三：使用 app.config.js 動態生成
1. 從環境變數讀取配置
2. 在 prebuild 時生成檔案

## 實施步驟

### 使用 EAS Secrets 方法：

1. **將檔案轉為 base64**
   ```bash
   base64 -i ios/DonnaAI/GoogleService-Info.plist -o GoogleService-Info.plist.base64
   ```

2. **上傳到 EAS**
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --value "$(cat GoogleService-Info.plist.base64)" --type file
   ```

3. **修改 eas.json 使用 secret**
   ```json
   {
     "build": {
       "production": {
         "env": {
           "GOOGLE_SERVICE_INFO_PLIST": "@GOOGLE_SERVICE_INFO_PLIST"
         }
       }
     }
   }
   ```

### 直接提交檔案方法（如果檔案安全）：

1. **檢查 .gitignore**
   確保 GoogleService-Info.plist 沒有被忽略

2. **提交檔案**
   ```bash
   git add ios/DonnaAI/GoogleService-Info.plist
   git commit -m "fix: 加入 GoogleService-Info.plist 以修復 EAS 建置"
   ```

3. **重新建置**
   ```bash
   eas build --platform ios --profile production
   ```

## 影響評估
- **中等風險**：需要處理敏感配置檔案
- **無資料影響**：只影響建置流程
- **安全考量**：確保 API 金鑰不外洩

## 預防措施
1. 使用 EAS Secrets 管理敏感檔案
2. 在專案文檔中記錄必要的建置檔案
3. 建立建置前檢查清單

## 建議行動
由於 Firebase 專案已經是公開的配置，建議直接將 GoogleService-Info.plist 提交到 Git 以快速解決問題。