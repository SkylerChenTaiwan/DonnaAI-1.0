# iOS 建置準備指南

## 📋 建置前檢查清單

### 必要條件
- [ ] Apple Developer 帳號已註冊（$99/年）
- [ ] Firebase 生產專案已建立
- [ ] EAS CLI 已安裝並登入
- [ ] 生產環境配置檔案已準備

### 配置檔案
- [ ] `.env.production` 已填寫完整
- [ ] `GoogleService-Info.plist` 已下載
- [ ] `eas.json` 已配置
- [ ] `app.config.js` 已更新

## 🎨 應用程式資源準備

### App Icon（應用程式圖標）
建立 1024x1024 的主圖標，系統會自動生成各種尺寸：

```bash
# 使用 Expo 優化圖標
npx expo-optimize

# 或手動調整大小
npx @expo/image-utils resize ./assets/icon.png --width 1024 --height 1024
```

### Splash Screen（啟動畫面）
- **尺寸**：1284 x 2778 像素
- **格式**：PNG
- **背景色**：#FFFFFF

```bash
# 優化啟動畫面
npx @expo/image-utils resize ./assets/splash.png --width 1284 --height 2778
```

### 推播通知圖標
建立 `assets/notification-icon.png`：
- **尺寸**：96 x 96 像素
- **格式**：PNG（透明背景）
- **顏色**：單色設計最佳

## 🔧 EAS Build 配置更新

### 更新 eas.json
```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "buildConfiguration": "Release",
        "autoIncrement": true,
        "credentialsSource": "remote"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "NODE_ENV": "production"
      },
      "cache": {
        "key": "production-ios-cache"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id",
        "ascApiKeyPath": "./AuthKey_XXXXX.p8",
        "ascApiKeyId": "XXXXX",
        "ascApiKeyIssuerId": "xxxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

## 🍎 iOS 特定配置

### 更新 Info.plist 權限說明
在 `app.config.js` 中確保所有權限都有說明：

```javascript
ios: {
  infoPlist: {
    NSMicrophoneUsageDescription: "DonnaAI 需要錄音權限來記錄會議內容，協助您進行會議記錄和智能分析。此權限僅在您主動使用錄音功能時才會啟用。",
    NSCameraUsageDescription: "DonnaAI 需要相機權限來拍攝會議相關照片和掃描文件。此權限僅在您選擇使用相機功能時才會啟用。",
    NSPhotoLibraryUsageDescription: "DonnaAI 需要相簿權限來選擇和儲存會議相關圖片。此權限僅在您選擇存取相簿時才會啟用。",
    NSLocationWhenInUseUsageDescription: "DonnaAI 需要位置權限來記錄會議地點資訊。此權限僅在您選擇記錄位置時才會啟用。",
    UIBackgroundModes: ["audio", "fetch", "remote-notification"],
    ITSAppUsesNonExemptEncryption: false
  }
}
```

## 🛠️ 建置步驟

### 1. 設定 iOS 憑證
```bash
# 讓 EAS 自動管理憑證
eas credentials --platform ios

# 選擇選項：
# - Build credentials
# - Let EAS manage your credentials
```

### 2. 驗證配置
```bash
# 檢查 EAS 配置
eas build:configure

# 查看當前配置
eas config --platform ios --profile production
```

### 3. 本地測試建置
```bash
# 先在本地測試（需要 macOS）
eas build --platform ios --profile production --local

# 或使用模擬器建置
eas build --platform ios --profile development --simulator
```

### 4. 雲端建置
```bash
# 提交到 EAS Build 雲端建置
eas build --platform ios --profile production

# 監控建置進度
eas build:list --status=in-progress
```

### 5. 下載建置結果
```bash
# 查看完成的建置
eas build:list --status=finished --platform=ios

# 下載 IPA 檔案
eas build:download --platform=ios
```

## 📱 TestFlight 測試

### 1. 上傳到 TestFlight
```bash
# 自動提交到 TestFlight
eas submit --platform ios --latest

# 或手動指定建置
eas submit --platform ios --id=build-id-here
```

### 2. TestFlight 設定
1. 登入 App Store Connect
2. 選擇「TestFlight」
3. 新增測試群組
4. 邀請內部測試人員
5. 設定測試資訊

### 3. 測試檢查清單
- [ ] 應用程式正常啟動
- [ ] 登入/註冊功能正常
- [ ] 錄音功能正常
- [ ] AI 分析正常回應
- [ ] 資料同步正常
- [ ] 推播通知正常
- [ ] 離線功能正常
- [ ] 深色模式正常

## 🚨 常見問題

### 1. 憑證問題
```bash
# 清除並重新設定憑證
eas credentials --platform ios --clear-credentials
```

### 2. 建置失敗
```bash
# 查看詳細錯誤日誌
eas build:view --platform=ios
```

### 3. 版本號問題
```bash
# 手動更新版本號
eas build:version:set --platform ios
```

## 📋 最終檢查清單

### 技術檢查
- [ ] 所有環境變數已設定
- [ ] Firebase 配置檔案已加入
- [ ] 版本號和建置號正確
- [ ] 所有權限說明完整

### 功能檢查
- [ ] 核心功能測試通過
- [ ] 效能測試通過
- [ ] 安全性測試通過
- [ ] 相容性測試通過

### 合規檢查
- [ ] 隱私政策連結有效
- [ ] 使用條款連結有效
- [ ] 年齡分級正確
- [ ] 出口合規聲明

## 🎯 下一步

1. **完成 TestFlight 測試**
   - 至少 7 天的測試期
   - 收集測試反饋
   - 修復發現的問題

2. **準備正式提交**
   - 完成所有 App Store 資訊
   - 準備審核說明
   - 確認所有連結有效

3. **提交審核**
   - 在 App Store Connect 提交
   - 等待審核結果（通常 24-48 小時）
   - 準備回應審核問題

---

更新時間：2025年7月25日
負責人：[請填寫]