# DonnaAI 生產環境部署 - 下一步行動指南

## 🎉 已完成的部分

### ✅ 第一階段：生產環境基礎設定
1. **開發工具安裝**
   - Firebase CLI v14.11.0 ✓
   - EAS CLI v16.17.3 ✓

2. **配置檔案建立**
   - `.env.production` - 生產環境配置模板 ✓
   - `eas.json` - EAS Build 配置 ✓
   - `app.config.js` - 更新支援 Firebase 原生整合 ✓
   - `firestore-production.rules` - 生產環境安全規則 ✓
   - `storage-production.rules` - Storage 安全規則 ✓
   - `.gitignore` - 更新包含敏感檔案 ✓

3. **監控服務整合**
   - `src/services/firebase/monitoring.ts` - Crashlytics 和 Performance 監控 ✓
   - 更新 `App.tsx` 整合監控服務 ✓

4. **文檔建立**
   - `docs/production-deployment-guide.md` - 部署指南 ✓
   - `docs/production-deployment-checklist.md` - 檢查清單 ✓

## 🚀 需要您立即執行的步驟

### 📱 步驟 1：在 Firebase Console 建立生產專案

1. **前往 Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **建立新專案**
   - 專案名稱：`donnaai-production`
   - 專案 ID：`donnaai-production`（或自動生成）
   - 選擇地區：`asia-east1`（台灣）

3. **啟用必要服務**
   - Authentication → 啟用「電子郵件/密碼」
   - Firestore Database → 建立資料庫（多地區）
   - Storage → 建立預設儲存桶
   - 升級到 **Blaze 計費方案**（必要）

4. **新增應用程式**
   - Web 應用程式 → 取得配置值
   - iOS 應用程式 → Bundle ID: `com.donnaai.app`
   - Android 應用程式 → Package: `com.donnaai.app`

5. **下載配置檔案**
   - 下載 `GoogleService-Info.plist`（iOS）
   - 下載 `google-services.json`（Android）
   - 將檔案放在專案根目錄

### 🔑 步驟 2：更新環境變數

編輯 `.env.production` 檔案，填入從 Firebase Console 取得的實際值：

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=你的實際_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=donnaai-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=donnaai-production
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=donnaai-production.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的實際_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=你的實際_APP_ID
```

### 🔐 步驟 3：部署 Firestore 安全規則

```bash
# 使用 Firebase CLI 部署規則
firebase use donnaai-production
firebase deploy --only firestore:rules --rules firestore-production.rules
firebase deploy --only storage:rules --rules storage-production.rules
```

### 📦 步驟 4：安裝 Firebase 監控依賴

```bash
# 安裝必要的 Firebase 套件
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/crashlytics @react-native-firebase/performance

# 安裝 expo-build-properties（如果尚未安裝）
npx expo install expo-build-properties
```

### 🏗️ 步驟 5：初始化 EAS 專案

```bash
# 登入 EAS
eas login

# 初始化專案（如果尚未初始化）
eas build:configure

# 取得 EAS Project ID
eas project:info
```

更新 `app.config.js` 中的 EAS Project ID：
```javascript
extra: {
  eas: {
    projectId: "你的實際-EAS-PROJECT-ID"
  }
}
```

## 🔄 接下來的步驟（按順序執行）

### 1. Cloud Functions 部署（第 3 天）
```bash
# 進入 functions 目錄
cd functions

# 更新依賴
npm install

# 設定 secrets
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set GEMINI_API_KEY

# 部署
firebase deploy --only functions
```

### 2. iOS 開發者帳號設定（第 4-5 天）
- 註冊 Apple Developer Program ($99/年)
- 在 App Store Connect 建立應用程式
- 設定 Bundle ID：`com.donnaai.app`

### 3. 建置測試版本
```bash
# 建置開發版本測試
eas build --platform ios --profile development

# 確認一切正常後建置生產版本
eas build --platform ios --profile production
```

### 4. 準備 App Store 資訊
- 應用程式截圖（各種尺寸）
- 隱私政策網址
- 應用程式描述（中英文）
- 完成隱私標籤配置

### 5. 提交審核
```bash
# 自動提交到 App Store Connect
eas submit --platform ios --profile production
```

## ⚠️ 重要提醒

1. **Blaze 計費方案**：Cloud Functions 需要升級到付費方案
2. **API 金鑰安全**：確保 `.env.production` 不會被提交到版本控制
3. **測試充分**：在提交前進行完整的功能測試
4. **隱私合規**：確保隱私標籤準確反映實際資料收集

## 📞 需要協助？

如果在部署過程中遇到任何問題，請參考：
- `docs/production-deployment-guide.md` - 詳細部署指南
- `docs/production-deployment-checklist.md` - 完整檢查清單
- `PRPs/46-gcp-production-deployment-and-ios-app-store-submission.md` - 原始 PRP 文件

## 🎯 預計時程

- **今天**：完成 Firebase 專案設定和環境配置
- **明天**：Cloud Functions 部署和測試
- **第 3-4 天**：iOS 建置和內部測試
- **第 5-6 天**：準備 App Store 資料
- **第 7 天**：提交審核

---

**建立時間**：2025-07-25
**負責人**：請在此處填寫您的名字

祝您部署順利！🚀