# 🔴 您必須親自執行的項目清單

這份文件列出所有需要您親自操作的項目，因為這些涉及個人帳號、付費、或需要網頁介面操作。

## 📋 必做項目總覽

1. **Firebase 專案建立和配置** ⏰ 今天
2. **Apple 開發者帳號註冊** 💰 $99/年
3. **API 金鑰設定** 🔐 需要您的 API Keys
4. **App Store Connect 設定** 📱 需要 Apple ID
5. **最終審核提交** ✅ 需要確認所有資訊

---

## 1️⃣ Firebase 專案建立（立即執行）

### 您需要做什麼：
1. **登入 Firebase Console**
   ```
   網址：https://console.firebase.google.com/
   使用您的 Google 帳號登入
   ```

2. **建立新專案**
   - 點擊「建立專案」
   - 專案名稱輸入：`donnaai-production`
   - 選擇地區：`asia-east1`（台灣）
   - 啟用 Google Analytics（選擇性）

3. **啟用必要服務**（全部都要開啟）
   - ✅ Authentication → 啟用「電子郵件/密碼」登入方式
   - ✅ Firestore Database → 選擇「多地區」→ 選擇 asia-southeast1
   - ✅ Storage → 建立預設儲存桶
   - ✅ **升級到 Blaze 計費方案**（這是必要的，但有免費額度）

4. **新增應用程式**
   - 點擊專案總覽的「新增應用程式」
   - 新增 **Web 應用程式** (</> 圖標)
     - 應用程式暱稱：`DonnaAI Web`
     - ✅ 勾選「為這個應用程式設定 Firebase Hosting」
   - 新增 **iOS 應用程式** (🍎 圖標)
     - iOS 套件 ID：`com.donnaai.app`
     - 應用程式暱稱：`DonnaAI iOS`
   - 新增 **Android 應用程式** (🤖 圖標)
     - Android 套件名稱：`com.donnaai.app`
     - 應用程式暱稱：`DonnaAI Android`

5. **下載並保存配置檔案**
   - 📄 下載 `GoogleService-Info.plist`（從 iOS 應用程式設定）
   - 📄 下載 `google-services.json`（從 Android 應用程式設定）
   - 將這兩個檔案放到專案根目錄

### 需要複製的配置值：
從 Web 應用程式的設定中複製以下值：
```javascript
const firebaseConfig = {
  apiKey: "複製這個值",
  authDomain: "複製這個值",
  projectId: "複製這個值",
  storageBucket: "複製這個值",
  messagingSenderId: "複製這個值",
  appId: "複製這個值"
};
```

---

## 2️⃣ 更新環境配置檔案

### 您需要做什麼：
1. **編輯 `.env.production` 檔案**
   
   將上面複製的值填入對應位置：
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=貼上您的apiKey
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=貼上您的authDomain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=貼上您的projectId
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=貼上您的storageBucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=貼上您的messagingSenderId
   EXPO_PUBLIC_FIREBASE_APP_ID=貼上您的appId
   ```

---

## 3️⃣ 設定 API 金鑰（Cloud Functions）

### 您需要做什麼：
1. **取得 API Keys**
   - OpenAI API Key：https://platform.openai.com/api-keys
   - Claude API Key：https://console.anthropic.com/
   - Gemini API Key：https://makersuite.google.com/app/apikey

2. **設定 Firebase Secrets**
   ```bash
   # 在終端機執行（會要求輸入 API Key）
   firebase functions:secrets:set OPENAI_API_KEY
   firebase functions:secrets:set CLAUDE_API_KEY
   firebase functions:secrets:set GEMINI_API_KEY
   ```

---

## 4️⃣ Apple 開發者帳號（iOS 上架必需）

### 您需要做什麼：
1. **註冊 Apple Developer Program**
   ```
   網址：https://developer.apple.com/programs/
   費用：US$99/年（約 NT$3,000）
   需要：Apple ID、信用卡
   ```

2. **等待審核**
   - 通常需要 24-48 小時
   - 會收到確認 email

3. **帳號啟用後**
   - 登入 https://developer.apple.com/
   - 同意所有條款

---

## 5️⃣ App Store Connect 設定

### 您需要做什麼：
1. **登入 App Store Connect**
   ```
   網址：https://appstoreconnect.apple.com/
   使用您的 Apple ID（需已加入開發者計畫）
   ```

2. **建立新 App**
   - 點擊「我的 App」→「+」→「新 App」
   - 填寫資訊：
     - 平台：iOS
     - 名稱：DonnaAI
     - 主要語言：繁體中文
     - 套件 ID：選擇 com.donnaai.app
     - SKU：donnaai-ios

3. **填寫 App 資訊**
   - 參考檔案：`docs/app-store-metadata.md`
   - 複製貼上所有描述、關鍵字等資訊

---

## 6️⃣ EAS 帳號設定

### 您需要做什麼：
1. **建立 Expo 帳號**（如果還沒有）
   ```
   網址：https://expo.dev/signup
   ```

2. **登入 EAS CLI**
   ```bash
   eas login
   # 輸入您的 Expo 帳號和密碼
   ```

3. **取得並更新 Project ID**
   ```bash
   eas project:info
   # 複製顯示的 Project ID
   ```
   
   更新 `app.config.js`：
   ```javascript
   extra: {
     eas: {
       projectId: "貼上您的-project-id"
     }
   }
   ```

---

## 📝 快速檢查清單

### 今天必須完成：
- [ ] Firebase 專案建立
- [ ] 下載 GoogleService-Info.plist 和 google-services.json
- [ ] 更新 .env.production 的 Firebase 配置
- [ ] 建立 Expo/EAS 帳號

### 需要付費的項目：
- [ ] Firebase Blaze 方案（有免費額度，超過才收費）
- [ ] Apple Developer Program（$99/年，iOS 上架必需）

### 需要申請的 API：
- [ ] OpenAI API Key（如果要用 GPT）
- [ ] Claude API Key（如果要用 Claude）
- [ ] Gemini API Key（如果要用 Gemini）

---

## 🆘 遇到問題？

### Firebase 相關
- 確保選擇正確的地區（asia-east1）
- Blaze 方案有免費額度，不會立即收費
- 配置檔案下載後要放在專案根目錄

### Apple 開發者相關
- 需要信用卡付費
- 審核可能需要 1-2 天
- 公司帳號需要額外文件

### EAS 相關
- 免費方案每月有 30 次建置額度
- 首次建置可能需要較長時間

---

## 📌 重要提醒

1. **保護您的 API Keys**
   - 不要將 API Key 提交到 Git
   - 使用 Firebase Secrets 管理

2. **測試環境 vs 生產環境**
   - 目前的 Firebase 專案（donnaai-5e601）是開發用
   - 新建的 donnaai-production 是生產用
   - 兩者資料不會同步

3. **成本控制**
   - Firebase 設定預算警報
   - 監控 API 使用量
   - iOS 開發者帳號是年費

完成以上步驟後，技術部署就可以由指令完成了！

---

建立時間：2025-07-25
這份文件包含您上架所需的所有個人操作項目。