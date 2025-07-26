# EAS 設定命令

請在終端機中依序執行以下命令：

## 1. 登入 EAS
```bash
eas login
# 輸入您的 Expo 帳號 email 和密碼
```

## 2. 確認登入狀態
```bash
eas whoami
```

## 3. 獲取專案資訊
```bash
eas project:info
```

## 4. 如果尚未初始化專案
```bash
eas build:configure
# 選擇 iOS 平台
# 確認 bundle identifier: com.donnaai.app
```

## 5. 記錄專案 ID
當您執行 `eas project:info` 後，會看到類似這樣的輸出：
```
Project ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

請複製這個 ID，我們需要更新到 app.config.js 中。

## 6. 更新 Apple 憑證資訊
請準備以下資訊：
- Apple ID (您的開發者帳號 email)
- App Store Connect App ID (從 App Store Connect 取得)
- Apple Team ID (從 Apple Developer 帳號取得)

這些資訊會用來更新 eas.json 的 submit 部分。