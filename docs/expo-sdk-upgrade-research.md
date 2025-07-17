# Expo SDK 升級研究報告

## 當前狀態
- **當前版本**: Expo SDK 51.0.0
- **最新版本**: Expo SDK 53
- **建議升級路徑**: SDK 51 → SDK 52 → SDK 53（漸進式升級）

## 重要變更摘要

### SDK 52 重大變更（從 SDK 51）

#### 1. 平台版本要求
- **iOS**: 最低支援版本從 13.4 提升至 15.1
- **Android**: 
  - minSdkVersion: 23 → 24
  - compileSdkVersion: 34 → 35

#### 2. 移除的套件
- `expo-sqlite/legacy`: 必須遷移至 `expo-sqlite`
- `expo-barcode-scanner`: 使用 `expo-camera` 的條碼掃描功能替代
- `create-react-native-app`: 改用 `npx create-expo-app`

#### 3. API 變更
- `expo-notifications`: 簡化了日曆觸發器的輸入類型
- `expo-camera`: 如需使用舊版，需將 import 改為 `expo-camera/legacy`
- `expo-av`: Video 元件被 `expo-video` 取代

#### 4. React Navigation
- 更新至 v7（如使用 Expo Router 會自動處理大部分變更）

### SDK 53 重大變更（從 SDK 52）

#### 1. New Architecture 預設啟用
- SDK 53 預設啟用 New Architecture（SDK 52 為選擇性）
- 可透過 app.json 設定退出：
```json
{
  "expo": {
    "android": { "newArchEnabled": false },
    "ios": { "newArchEnabled": false }
  }
}
```

#### 2. Node.js 要求
- 建議使用 Node.js 20 或更新版本（Node 18 已於 2025/4/30 EOL）

#### 3. Metro 設定
- 更嚴格的 package.json exports 執行
- 可能導致第三方套件相容性問題

#### 4. 重要棄用
- `expo-av`: 從 SDK 54 開始不再維護
- Android Expo Go 不再支援推送通知

## 升級步驟

### 1. 前置準備
```bash
# 更新 EAS CLI（如有使用）
npm install -g eas-cli

# 檢查當前專案狀態
npx expo-doctor@latest
```

### 2. 漸進式升級

#### 第一階段：SDK 51 → SDK 52
```bash
# 升級至 SDK 52
npx expo install expo@^52.0.0

# 修復相依性
npx expo install --fix

# 檢查問題
npx expo-doctor@latest

# 清除快取並重建
npx expo prebuild --clean
npx expo start -c
```

#### 第二階段：SDK 52 → SDK 53
```bash
# 升級至 SDK 53
npx expo upgrade 53

# 修復相依性
npx expo install --fix

# 檢查問題
npx expo-doctor@latest

# 重建
npx expo prebuild --clean
```

### 3. 後續處理
- 刪除舊的 android/ 和 ios/ 目錄（如使用 Continuous Native Generation）
- 更新 development builds
- 全面測試應用程式功能

## 常見問題與解決方案

### 1. 相依性衝突
**問題**: 套件版本不相容
**解決方案**:
- 執行 `npx expo install --fix`
- 使用 `npx expo-doctor` 檢查相容性
- 手動更新特定套件至相容版本

### 2. New Architecture 相容性
**問題**: 某些第三方套件不支援 New Architecture
**解決方案**:
- 檢查 React Native Directory 確認套件相容性
- 尋找替代套件
- 暫時退出 New Architecture

### 3. 建置錯誤
**問題**: Metro bundler 無法打包
**解決方案**:
- 清除所有快取：`npx expo start --clear`
- 刪除 node_modules 並重新安裝
- 檢查語法錯誤

### 4. 執行時錯誤
**問題**: 本地執行正常但建置版本崩潰
**解決方案**:
- 使用 production error logs 除錯
- 確認所有環境變數正確設定
- 測試 development build

## 最佳實踐

### 1. 升級前
- 詳讀每個 SDK 版本的 changelog
- 備份專案（git commit）
- 評估第三方套件相容性
- 預留充足時間進行升級

### 2. 升級中
- 漸進式升級（一次一個版本）
- 每個步驟後都進行測試
- 使用 `expo-doctor` 檢查問題
- 保持 git 歷史清晰

### 3. 升級後
- 在實體裝置上測試
- 更新 CI/CD 設定
- 建立新的 development builds
- 監控錯誤報告

## 特定套件注意事項

### Firebase
- SDK 53 可能需要從 Firebase JS SDK 遷移至 React Native Firebase
- 這是架構性的改變，需要重寫相關程式碼

### 影響專案的套件
檢查以下套件的相容性：
- `@sentry/react-native`: 確認支援 New Architecture
- `react-native-reanimated`: 可能需要更新至最新版本
- `react-native-gesture-handler`: 確認與新版 React Native 相容

## 風險評估

### 高風險
1. New Architecture 相容性問題
2. 第三方套件支援不足
3. Firebase 整合需要重構

### 中風險
1. 建置時間增加
2. 開發工具需要更新
3. 測試覆蓋率不足

### 低風險
1. 效能改善
2. 新功能支援
3. 安全性更新

## 建議行動計劃

1. **第一週**: 
   - 建立測試分支
   - 升級至 SDK 52
   - 解決相依性問題

2. **第二週**:
   - 測試所有功能
   - 修復發現的問題
   - 準備升級至 SDK 53

3. **第三週**:
   - 升級至 SDK 53
   - 處理 New Architecture 相關問題
   - 全面測試

4. **第四週**:
   - 生產環境部署準備
   - 監控和除錯
   - 文件更新

## 參考資源

- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53)
- [Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Troubleshooting Guide](https://github.com/expo/fyi/blob/main/troubleshooting-sdk-upgrades.md)
- [React Native Directory](https://reactnative.directory/)

## 結論

從 SDK 51 升級至 SDK 53 涉及重大變更，特別是 New Architecture 的預設啟用和平台版本要求的提升。建議採用漸進式升級策略，並為每個階段預留充足的測試時間。重點關注第三方套件相容性和 Firebase 整合的潛在重構需求。