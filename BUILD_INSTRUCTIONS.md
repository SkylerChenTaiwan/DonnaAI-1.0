# 🚀 iOS 建置指令

## 立即執行

在終端機執行以下命令：

```bash
eas build --platform ios --profile production
```

## 建置過程中的選項

### 1. Apple 帳號登入
當看到：`Do you want to log in to your Apple account?`
- 選擇 **N** (No)
- 原因：您的帳號還在認證中

### 2. 使用 Expo 管理的憑證
系統會自動：
- 建立開發憑證
- 設定 Provisioning Profile
- 準備建置環境

### 3. GoogleService-Info.plist 警告
- 可以忽略這個警告
- 檔案會在建置時被包含

## 建置完成後

### 查看建置狀態
```bash
# 列出最近的建置
eas build:list --platform ios --limit 5

# 查看特定建置詳情
eas build:view [建置ID]
```

### 下載建置檔案
建置完成後會提供下載連結，您可以：
1. 下載 .ipa 檔案
2. 使用 Apple Configurator 2 或 Xcode 安裝到測試設備

## 關於 TestFlight

由於您的 Apple 開發者帳號還在認證中：
- **現在**：可以建置和在實體設備測試
- **認證後**：可以提交到 TestFlight 和 App Store

## 預計時間
- 建置時間：30-45 分鐘
- 建置完成後會收到通知

## 常見問題

### Q: 建置失敗怎麼辦？
A: 執行 `eas build:view [建置ID]` 查看詳細錯誤日誌

### Q: 可以在模擬器測試嗎？
A: 可以建置模擬器版本：
```bash
eas build --platform ios --profile development --simulator
```

---

**立即在終端機執行建置命令開始！**