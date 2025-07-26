# iOS 生產版本建置檢查清單

## ✅ 步驟一：取得必要資訊

### 1. Firebase 生產配置
- [ ] 前往 https://console.firebase.google.com/project/donnaai-production/settings/general
- [ ] 複製 Web 應用程式配置：
  - [ ] API Key
  - [ ] Messaging Sender ID  
  - [ ] App ID

### 2. EAS 專案資訊
- [ ] 在終端機執行：`eas login`
- [ ] 執行：`eas whoami` 確認登入
- [ ] 執行：`eas project:info` 取得專案 ID
- [ ] 記錄專案 ID：____________________

### 3. Apple 開發者資訊
- [ ] Apple ID (開發者帳號)：____________________
- [ ] Apple Team ID：____________________
- [ ] App Store Connect App ID：____________________

## ✅ 步驟二：更新配置檔案

### 1. 更新配置腳本
- [ ] 編輯 `scripts/update-eas-config.js`
- [ ] 填入所有實際的配置值
- [ ] 執行：`node scripts/update-eas-config.js`

### 2. 確認 GoogleService-Info.plist
- [ ] 確保 GoogleService-Info.plist 是生產版本
- [ ] 如果不是，從 Firebase Console 下載並替換

## ✅ 步驟三：建立測試帳號

### 1. 設定環境變數
```bash
export $(cat .env.production | grep -v '^#' | xargs)
```

### 2. 執行測試帳號腳本
```bash
npx ts-node scripts/prepare-review-account.ts
```

### 3. 確認輸出
- [ ] 測試帳號建立成功
- [ ] 記錄帳號：reviewer@donnaai.app
- [ ] 記錄密碼：ReviewTest2025!

## ✅ 步驟四：建置 iOS 生產版本

### 1. 清理並準備
```bash
npx expo prebuild --clean
rm -rf node_modules
npm install
cd ios && pod install && cd ..
```

### 2. 開始建置
```bash
eas build --platform ios --profile production
```

### 3. 建置選項
- [ ] 確認 Bundle ID：com.donnaai.app
- [ ] 選擇 Apple 帳號
- [ ] 選擇或建立發布證書
- [ ] 等待建置完成（約 30-45 分鐘）

## ✅ 步驟五：提交到 TestFlight

### 1. 自動提交
```bash
eas submit --platform ios --latest
```

### 2. App Store Connect 設定
- [ ] 登入 App Store Connect
- [ ] 選擇應用程式
- [ ] 前往 TestFlight
- [ ] 填寫測試資訊
- [ ] 邀請內部測試人員

## 📝 記錄區域

### 建置 ID
```
建置 ID：_______________________
建置時間：_____________________
```

### TestFlight 狀態
```
提交時間：_____________________
處理狀態：_____________________
```

### 問題記錄
```
遇到的問題：




解決方案：




```

---

最後更新：2025-07-26