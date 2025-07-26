# iOS 建置命令

## 選項 1：使用 EAS 管理憑證（推薦）
```bash
eas build --platform ios --profile production
```
當提示時：
- "Do you want to log in to your Apple account?" → 輸入 **N**（如果沒有 Apple 開發者帳號）
- EAS 會建立開發憑證，但無法提交到 App Store

## 選項 2：建置開發版本測試
```bash
eas build --platform ios --profile preview
```

## 選項 3：建置模擬器版本
```bash
eas build --platform ios --profile development --simulator
```

## 關於 GoogleService-Info.plist
這個警告可以忽略。檔案會在建置時被包含進去。

## 下一步
1. 如果您沒有 Apple 開發者帳號，可以：
   - 先建置開發版本測試
   - 稍後再申請 Apple 開發者帳號（$99/年）
   
2. 如果您有 Apple 開發者帳號但還沒認證：
   - 前往 https://developer.apple.com/
   - 完成帳號認證
   - 在 eas.json 中更新您的 Apple ID 資訊

## 建置狀態查看
```bash
# 查看建置進度
eas build:list --platform ios --limit 5

# 查看特定建置
eas build:view [建置ID]
```