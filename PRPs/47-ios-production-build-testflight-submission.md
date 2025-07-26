# PRP-47: iOS 生產版本建置與 TestFlight 提交

## 📋 專案概覽

### 目標
完成 iOS 生產版本的建置、測試帳號準備，並提交到 TestFlight 進行測試。這是 App Store 上架前的最後準備步驟。

### 預期成果
1. iOS 生產版本成功建置
2. 測試帳號和資料準備完成
3. 應用程式成功上傳到 TestFlight
4. 內部測試團隊可以開始測試

### 時程估計
- 預計完成時間：4-6 小時
- 建置時間：30-45 分鐘
- TestFlight 處理：1-2 小時

## 🚀 實作計畫

### 階段一：環境準備與驗證

#### 1.1 檢查環境變數
確保 `.env.production` 已正確設定：
```bash
# 驗證環境變數
cat .env.production | grep EXPO_PUBLIC_

# 應該包含：
# EXPO_PUBLIC_ENV=production
# EXPO_PUBLIC_FIREBASE_API_KEY=實際值
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=donnaai-production.firebaseapp.com
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=donnaai-production
# ... 其他 Firebase 配置
```

#### 1.2 更新 EAS 專案 ID
```bash
# 獲取 EAS 專案 ID
eas whoami
eas project:info

# 更新 app.config.js 中的 projectId
# extra.eas.projectId = "取得的實際 ID"
```

#### 1.3 更新 EAS Submit 配置
編輯 `eas.json`，填入實際的 Apple 憑證：
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "您的 Apple ID",
        "ascAppId": "從 App Store Connect 取得的 App ID",
        "appleTeamId": "您的 Team ID"
      }
    }
  }
}
```

### 階段二：建置前準備

#### 2.1 清理和安裝依賴
```bash
# 清理快取
npx expo prebuild --clean
rm -rf node_modules
npm install

# 確保 iOS 原生依賴正確安裝
cd ios && pod install && cd ..
```

#### 2.2 檢查資源檔案
```bash
# 確認必要檔案存在
ls -la GoogleService-Info.plist
ls -la assets/icon.png
ls -la assets/splash.png
ls -la assets/notification-icon.png

# 優化圖片資源
npx expo-optimize
```

#### 2.3 版本號更新
在 `app.config.js` 中更新版本號：
```javascript
{
  version: "1.0.0",  // 如果需要更新
  ios: {
    buildNumber: "1.0.0"  // EAS 會自動遞增
  }
}
```

### 階段三：執行測試帳號腳本

#### 3.1 設定環境變數
```bash
# 載入生產環境變數
export $(cat .env.production | grep -v '^#' | xargs)
```

#### 3.2 執行腳本
```bash
# 安裝腳本依賴
npm install -D ts-node @types/node

# 執行測試帳號建立腳本
npx ts-node scripts/prepare-review-account.ts
```

預期輸出：
```
🚀 開始準備 App Store 審核測試帳號...
📧 建立測試帳號...
✅ 測試帳號建立成功: [uid]
👤 建立用戶資料...
🏢 建立組織資料...
👥 建立範例客戶...
✅ 建立了 5 個範例客戶
📝 建立範例會議記錄...
✅ 建立了 3 個範例會議記錄
✅ 建立範例任務...
✅ 建立了 3 個範例任務
📊 建立 AI 分析報告...
✅ 建立了 2 個 AI 分析報告
🎉 測試帳號準備完成！
```

### 階段四：建置 iOS 生產版本

#### 4.1 開始建置
```bash
# 使用生產環境變數建置
eas build --platform ios --profile production
```

#### 4.2 建置過程中的提示
- **Apple ID**：輸入您的 Apple Developer 帳號
- **Bundle Identifier**：確認為 `com.donnaai.app`
- **Provisioning Profile**：選擇 App Store 發布
- **證書**：使用現有的或建立新的發布證書

#### 4.3 等待建置完成
- 建置將在 EAS 雲端進行
- 可以在 https://expo.dev/accounts/[您的帳號]/projects/donnaai/builds 查看進度
- 預計時間：30-45 分鐘

### 階段五：提交到 TestFlight

#### 5.1 自動提交（推薦）
```bash
# 提交最新的建置到 TestFlight
eas submit --platform ios --latest
```

#### 5.2 手動提交（如果自動提交失敗）
1. 從 EAS 下載 `.ipa` 檔案
2. 使用 Transporter 應用程式上傳：
   - 從 Mac App Store 下載 Transporter
   - 登入您的 Apple ID
   - 拖放 `.ipa` 檔案
   - 點擊「傳送」

#### 5.3 App Store Connect 設定
1. 登入 [App Store Connect](https://appstoreconnect.apple.com/)
2. 選擇您的應用程式
3. 前往 TestFlight 標籤
4. 等待建置處理完成（通常 10-30 分鐘）
5. 填寫測試資訊：
   - 測試內容描述
   - 聯絡資訊
   - 測試群組

### 階段六：驗證和測試

#### 6.1 TestFlight 內部測試
1. 邀請內部測試人員（最多 100 人）
2. 測試人員會收到 TestFlight 邀請郵件
3. 安裝 TestFlight 應用程式
4. 接受邀請並下載應用程式

#### 6.2 功能驗證清單
- [ ] 登入功能（使用 reviewer@donnaai.app）
- [ ] 錄音功能
- [ ] 離線模式
- [ ] 網路重連
- [ ] 推播通知
- [ ] 所有主要功能

## 🔍 驗證步驟

### 建置驗證
```bash
# 檢查建置狀態
eas build:list --platform ios --limit 5

# 檢查建置詳情
eas build:view [建置ID]
```

### TestFlight 驗證
```bash
# 檢查提交狀態
eas submit:list --platform ios
```

### 功能驗證腳本
```bash
# 驗證 Firebase 連線
curl -X POST https://us-central1-donnaai-production.cloudfunctions.net/aiProcessingAPI \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "content": "Hello"}'
```

## 🐛 常見問題與解決方案

### 問題 1：EAS 建置失敗
**錯誤**：`No provisioning profile found`
**解決**：
```bash
# 清除憑證快取
eas credentials --platform ios --clear-cache
# 重新配置
eas build:configure
```

### 問題 2：Firebase 配置錯誤
**錯誤**：`GoogleService-Info.plist not found`
**解決**：
1. 確保檔案在專案根目錄
2. 檢查 `.gitignore` 沒有排除此檔案
3. 重新下載並放置檔案

### 問題 3：TestFlight 處理失敗
**錯誤**：`Invalid Info.plist`
**解決**：
1. 檢查 `app.config.js` 中的所有必要欄位
2. 確保版本號格式正確（x.x.x）
3. 驗證 Bundle ID 正確

### 問題 4：測試帳號腳本失敗
**錯誤**：`Firebase config not found`
**解決**：
```bash
# 確保環境變數已載入
source .env.production
# 或使用 dotenv
npm install dotenv
# 在腳本開頭加入
require('dotenv').config({ path: '.env.production' })
```

## 📚 參考資源

### 官方文檔
- [EAS Build 文檔](https://docs.expo.dev/build/introduction/)
- [EAS Submit 文檔](https://docs.expo.dev/submit/introduction/)
- [TestFlight 指南](https://developer.apple.com/testflight/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

### 相關檔案
- `/eas.json` - EAS 配置
- `/app.config.js` - 應用程式配置
- `/scripts/prepare-review-account.ts` - 測試帳號腳本
- `/docs/ios-build-preparation.md` - iOS 建置準備指南
- `/docs/app-store-metadata.md` - App Store 資訊

## ✅ 完成標準

1. **建置成功**
   - iOS 生產版本建置完成
   - 無錯誤或警告

2. **測試資料準備**
   - reviewer@donnaai.app 帳號建立成功
   - 包含 5 個客戶、3 個會議記錄、3 個任務

3. **TestFlight 上線**
   - 應用程式成功上傳
   - TestFlight 狀態為「可供測試」
   - 內部測試人員可以下載

4. **功能驗證**
   - 所有核心功能正常運作
   - 無崩潰或嚴重錯誤

## 🎯 下一步行動

完成 TestFlight 提交後：
1. 進行完整的內部測試（2-3 天）
2. 收集測試反饋並修復問題
3. 準備外部測試（如需要）
4. 最終提交 App Store 審核

---

**信心評分：9/10**
- 所有步驟都有詳細說明
- 包含完整的錯誤處理
- 有明確的驗證方法
- 參考資源完整

**執行優先級：高**
- 這是上架前的關鍵步驟
- 依賴項都已準備完成
- 可立即執行