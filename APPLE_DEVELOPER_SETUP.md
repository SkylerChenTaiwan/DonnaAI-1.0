# Apple 開發者帳號設定指南

## 🍎 步驟一：註冊 Apple 開發者帳號

### 1.1 前往 Apple Developer
訪問：https://developer.apple.com/programs/enroll/

### 1.2 登入或建立 Apple ID
- 如果已有 Apple ID，直接登入
- 如果沒有，點擊「建立您的 Apple ID」

### 1.3 選擇帳號類型
- **個人**：以個人名義發布應用程式
- **組織**：以公司名義發布（需要 D-U-N-S® 編號）

### 1.4 支付年費
- 費用：$99 美元/年
- 支付方式：信用卡或 Apple Pay

### 1.5 等待審核
- 個人帳號：通常立即生效
- 組織帳號：可能需要 1-2 個工作日

## 🔑 步驟二：取得必要資訊

### 2.1 Apple ID
您用來註冊開發者帳號的 email

### 2.2 Apple Team ID
1. 登入 https://developer.apple.com/account
2. 在側邊欄選擇「Membership Details」
3. 找到「Team ID」（格式：XXXXXXXXXX）

### 2.3 建立 App ID
1. 前往 https://developer.apple.com/account/resources/identifiers/list
2. 點擊「+」建立新的 App ID
3. 選擇「App IDs」→「Continue」
4. 選擇「App」→「Continue」
5. 填寫資訊：
   - Description: DonnaAI
   - Bundle ID: com.donnaai.app（必須與 app.config.js 一致）
   - 勾選所需的 Capabilities（如 Push Notifications）
6. 點擊「Register」

## 📱 步驟三：在 App Store Connect 建立應用程式

### 3.1 前往 App Store Connect
訪問：https://appstoreconnect.apple.com/

### 3.2 建立新 App
1. 點擊「My Apps」
2. 點擊「+」→「New App」
3. 填寫資訊：
   - Platform: iOS
   - Name: DonnaAI
   - Primary Language: 繁體中文
   - Bundle ID: 選擇剛才建立的 com.donnaai.app
   - SKU: donnaai-001（可自訂）

### 3.3 記錄 App Store Connect App ID
建立後會顯示 App ID（數字格式）

## 🔧 步驟四：更新專案配置

### 4.1 更新 eas.json
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "您的Apple ID email",
        "ascAppId": "從App Store Connect取得的數字ID",
        "appleTeamId": "您的Team ID"
      }
    }
  }
}
```

### 4.2 範例
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234EF"
      }
    }
  }
}
```

## ✅ 驗證清單

- [ ] Apple 開發者帳號已付費並啟用
- [ ] 已取得 Team ID
- [ ] 已建立 App ID（Bundle ID: com.donnaai.app）
- [ ] 已在 App Store Connect 建立應用程式
- [ ] 已更新 eas.json 的 submit 配置

## 🚀 完成後

當您完成以上步驟後，執行：
```bash
eas build --platform ios --profile production
```

當提示 "Do you want to log in to your Apple account?" 時，選擇 **Y** 並輸入您的 Apple ID 和密碼。

## ⚠️ 注意事項

1. **雙重認證**：Apple 要求開啟雙重認證，請確保您的手機在身邊
2. **App 專用密碼**：如果啟用了雙重認證，可能需要建立 App 專用密碼
   - 前往 https://appleid.apple.com/account/manage
   - 在「安全性」區塊建立 App 專用密碼

3. **首次提交**：第一次提交可能需要額外的資訊，如：
   - 出口合規資訊
   - 年齡分級
   - 隱私政策連結

---

需要協助嗎？告訴我您在哪一步遇到問題！