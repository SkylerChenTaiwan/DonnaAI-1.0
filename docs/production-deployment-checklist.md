# DonnaAI 生產環境部署檢查清單

## 📋 部署前檢查清單

### 🔧 開發工具
- [x] Firebase CLI 已安裝 (v14.11.0)
- [x] EAS CLI 已安裝 (v16.17.3)
- [x] Node.js v20.18.0
- [x] Expo SDK 53

### 📁 配置檔案
- [x] `.env.production` 已建立（需填寫實際值）
- [x] `eas.json` 已配置
- [x] `app.config.js` 已更新支援 Firebase 原生整合
- [x] `firestore-production.rules` 已建立
- [x] `storage-production.rules` 已建立
- [x] `.gitignore` 已更新（包含敏感檔案）
- [ ] `GoogleService-Info.plist` 需從 Firebase Console 下載
- [ ] `google-services.json` 需從 Firebase Console 下載

### 🔥 Firebase 生產專案
- [ ] 在 Firebase Console 建立 `donnaai-production` 專案
- [ ] 啟用 Authentication (Email/Password)
- [ ] 建立 Firestore Database (多地區)
- [ ] 建立 Storage Bucket
- [ ] 啟用 Cloud Functions
- [ ] 升級到 Blaze 計費方案
- [ ] 啟用 Crashlytics
- [ ] 新增 Web、iOS、Android 應用程式

### 🏗️ EAS Build 設定
- [ ] 執行 `eas login`
- [ ] 執行 `eas build:configure`
- [ ] 取得 EAS Project ID
- [ ] 更新 `app.config.js` 中的 EAS Project ID

### 🍎 iOS 開發者帳號
- [ ] 註冊 Apple Developer Program ($99/年)
- [ ] 建立 App ID (com.donnaai.app)
- [ ] 設定推播通知憑證
- [ ] 在 App Store Connect 建立應用程式

### 📝 App Store 資訊準備
- [ ] 應用程式名稱和描述（中英文）
- [ ] 應用程式截圖 (iPhone 6.5", 5.5", iPad)
- [ ] 隱私政策網址
- [ ] 支援網址
- [ ] 行銷網址（選擇性）

### 🔐 環境變數和密鑰
- [ ] 生產環境 Firebase 配置值
- [ ] OpenAI API Key
- [ ] Claude API Key
- [ ] Gemini API Key
- [ ] Apple Team ID
- [ ] Apple ID (開發者帳號)

### 🧪 測試和驗證
- [ ] 所有單元測試通過
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 在實機測試所有功能
- [ ] 測試離線模式
- [ ] 測試推播通知
- [ ] 測試 AI 功能

### 📊 監控設定
- [ ] Crashlytics 整合測試
- [ ] Performance Monitoring 設定
- [ ] 自訂監控指標配置
- [ ] 錯誤警報設定

### 🚀 部署步驟
1. [ ] 完成所有配置檔案
2. [ ] 建置開發版本測試
3. [ ] 建置生產版本
4. [ ] 上傳到 TestFlight
5. [ ] 內部測試
6. [ ] 提交 App Store 審核

## 🔗 重要連結

- **Firebase Console**: https://console.firebase.google.com/
- **Apple Developer**: https://developer.apple.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **EAS Build**: https://expo.dev/accounts/[your-account]/projects
- **Expo 文檔**: https://docs.expo.dev/

## 📞 支援聯絡

- **技術問題**: [開發團隊 Email]
- **業務問題**: [業務團隊 Email]
- **緊急聯絡**: [緊急聯絡電話]

## 🎯 目標時程

- **Day 1-2**: Firebase 和 EAS 設定
- **Day 3**: Cloud Functions 部署
- **Day 4-5**: iOS 建置和測試
- **Day 6**: 監控系統設定
- **Day 7**: App Store 提交

---

最後更新：2025-07-25
負責人：[待填寫]