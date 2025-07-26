# 📱 Firebase 生產配置指南

## 取得 Firebase 配置步驟

### 1. 前往 Firebase Console
訪問：https://console.firebase.google.com/project/donnaai-production/settings/general

### 2. 找到 Web 應用程式配置
在「您的應用程式」區塊，找到 Web 應用程式的配置

### 3. 複製以下值
您會看到類似這樣的配置：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // 複製這個
  authDomain: "donnaai-production.firebaseapp.com",
  projectId: "donnaai-production",
  storageBucket: "donnaai-production.firebasestorage.app",
  messagingSenderId: "123456789",   // 複製這個
  appId: "1:123456789:web:..."      // 複製這個
};
```

### 4. 更新 .env.production
編輯 `.env.production` 檔案，替換以下值：
- `EXPO_PUBLIC_FIREBASE_API_KEY=` 貼上 apiKey
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=` 貼上 messagingSenderId
- `EXPO_PUBLIC_FIREBASE_APP_ID=` 貼上 appId

## Apple 開發者資訊

### 從 Apple Developer 取得
1. **Apple Team ID**：
   - 登入 https://developer.apple.com/account
   - 在 Membership 頁面找到 Team ID

2. **Apple ID**：
   - 您的 Apple 開發者帳號 email

### 從 App Store Connect 取得
1. **App Store Connect App ID**：
   - 登入 https://appstoreconnect.apple.com
   - 如果還沒建立應用程式，可以稍後再填

## 更新 eas.json
找到 submit 區塊，更新：
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "您的Apple ID",
      "ascAppId": "App Store Connect App ID（可選）",
      "appleTeamId": "您的Team ID"
    }
  }
}
```

---

完成這些配置後，就可以開始建置了！