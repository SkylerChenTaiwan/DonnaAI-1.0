# DonnaAI 生產環境部署指南

## 📋 部署進度追蹤

此文件記錄 DonnaAI 生產環境部署的完整過程和狀態。

## 🔧 開發工具安裝狀態

- ✅ Firebase CLI (v14.11.0) - 已安裝
- ✅ EAS CLI (v16.17.3) - 已安裝  
- ✅ Node.js (v20.18.0) - 已安裝
- ✅ Expo (v53.0.0) - 已安裝

## 🔥 Firebase 生產專案設定

### 第一步：在 Firebase Console 建立生產專案

1. **前往 Firebase Console**
   - 網址：https://console.firebase.google.com/
   - 使用您的 Google 帳號登入

2. **建立新專案**
   - 點擊「新增專案」
   - 專案名稱：`donnaai-production`
   - 專案 ID：建議使用 `donnaai-production`
   - 選擇地區：`asia-east1` (台灣)
   - 啟用 Google Analytics：是（選擇性）

3. **啟用必要的 Firebase 服務**
   - **Authentication**
     - 啟用「電子郵件/密碼」驗證方式
   - **Firestore Database**
     - 建立資料庫
     - 選擇「多地區」設定
     - 初始安全規則：「鎖定模式」（稍後會更新）
   - **Storage**
     - 建立預設儲存體
     - 選擇最近的地區
   - **Cloud Functions**
     - 升級到 Blaze 計費方案（必要）
   - **Crashlytics**
     - 啟用錯誤監控

4. **新增 Web 應用程式**
   - 在專案總覽中點擊「新增應用程式」
   - 選擇 Web 平台 (</>) 
   - 應用程式暱稱：`DonnaAI Web`
   - 註冊應用程式

5. **複製配置值**
   - 從 Firebase Console 取得配置
   - 更新 `.env.production` 檔案中的值

### 第二步：新增 iOS 和 Android 應用程式

1. **新增 iOS 應用程式**
   - Bundle ID：`com.donnaai.app`
   - 應用程式暱稱：`DonnaAI iOS`
   - App Store ID：（選擇性，稍後填寫）
   - 下載 `GoogleService-Info.plist`

2. **新增 Android 應用程式**
   - Package name：`com.donnaai.app`
   - 應用程式暱稱：`DonnaAI Android`
   - SHA-1 憑證指紋：（稍後從 EAS Build 取得）
   - 下載 `google-services.json`

## 📱 EAS Build 設定

### 初始化 EAS 專案

```bash
# 登入 EAS
eas login

# 初始化 EAS 配置
eas build:configure
```

### 設定 iOS 憑證

```bash
# 讓 EAS 自動管理憑證
eas credentials
```

選擇：
- Platform: iOS
- What do you want to do?: Manage credentials
- Build credentials: Let EAS manage

## 🔐 環境變數配置

### 開發環境 (.env)
- 用於本地開發和測試
- 連接到開發 Firebase 專案

### 生產環境 (.env.production)
- 用於生產建置
- 連接到生產 Firebase 專案
- 請確保所有值都已正確填寫

## 📝 下一步行動

1. **完成 Firebase Console 設定**
   - [ ] 建立 donnaai-production 專案
   - [ ] 啟用所有必要服務
   - [ ] 下載配置檔案
   - [ ] 更新 .env.production

2. **配置 EAS Build**
   - [ ] 建立 eas.json 檔案
   - [ ] 設定建置 profiles
   - [ ] 配置環境變數

3. **準備 iOS 上架**
   - [ ] 註冊 Apple Developer 帳號
   - [ ] 設定 Bundle ID
   - [ ] 準備 App Store Connect

## ⚠️ 重要提醒

- **Blaze 計費方案**：Cloud Functions 需要升級到付費方案
- **API 金鑰安全**：生產環境的 API 金鑰不應該提交到版本控制
- **隱私合規**：確保所有資料收集都符合隱私法規要求
- **測試充分**：在提交 App Store 前進行完整測試

## 🚀 部署檢查清單

### Firebase 設定
- [ ] 生產專案已建立
- [ ] Authentication 已啟用
- [ ] Firestore 已設定
- [ ] Storage 已配置
- [ ] Cloud Functions 已準備
- [ ] Blaze 計費方案已啟用

### 配置檔案
- [ ] .env.production 已建立並填寫
- [ ] GoogleService-Info.plist 已下載
- [ ] google-services.json 已下載
- [ ] eas.json 已配置

### 建置準備
- [ ] 所有測試通過
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 生產環境配置已驗證

---

更新時間：2025-07-25
部署負責人：[請填寫]