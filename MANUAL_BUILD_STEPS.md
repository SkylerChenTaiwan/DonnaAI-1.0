# 🚀 手動執行 iOS 建置步驟

## 請在終端機執行以下命令：

### 1. 開始建置
```bash
eas build --platform ios --profile production
```

### 2. 回答建置提示

#### 問題 1：Apple 帳號登入
```
Do you want to log in to your Apple account?
```
**回答：N**（因為您的帳號還在認證中）

#### 問題 2：Bundle Identifier
```
What would you like your iOS bundle identifier to be?
```
**回答：com.donnaai.app**（應該會自動填入）

#### 問題 3：使用 Expo 憑證
系統會提示使用 Expo 管理的憑證，選擇 **Yes**

### 3. 等待建置

建置會在 EAS 雲端進行，您會看到：
- 建置 ID
- 建置進度連結
- 預計完成時間（30-45 分鐘）

### 4. 監控建置進度

#### 方法 1：網頁查看
點擊終端機中顯示的連結，例如：
```
https://expo.dev/accounts/skylerchent/projects/donnaai/builds/[建置ID]
```

#### 方法 2：命令列查看
```bash
# 查看建置列表
eas build:list --platform ios --limit 5

# 查看特定建置
eas build:view [建置ID]
```

### 5. 建置完成後

當建置完成，您會：
1. 收到通知（如果有設定）
2. 看到下載連結
3. 可以下載 .ipa 檔案

### 6. 測試應用程式

#### 在實體設備測試
1. 下載 .ipa 檔案
2. 使用以下工具之一安裝：
   - Apple Configurator 2（Mac App Store 免費）
   - Xcode（開發者工具）
   - iTunes（舊版本）

#### 建置模擬器版本（可選）
如果想在模擬器測試：
```bash
eas build --platform ios --profile development --simulator
```

## ⚠️ 注意事項

1. **GoogleService-Info.plist 警告**：可以安全忽略，檔案會被包含在建置中
2. **版本號遞增**：每次建置會自動遞增 buildNumber
3. **首次建置**：可能需要額外時間設定憑證

## 🎯 立即行動

**現在就在終端機執行第一個命令開始建置！**

```bash
eas build --platform ios --profile production
```

---

建置過程中有任何問題，請告訴我！