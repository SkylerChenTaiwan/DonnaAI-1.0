# Web 平台問題報告

## 問題描述
在 Expo SDK 53 環境下，Web 版本無法正常運行，出現 Metro bundler 無限重載的問題。

## 環境資訊
- Expo SDK: 53.0.0
- React Native: 0.79.5
- React: 19.0.0
- Metro bundler: 使用 Expo 內建版本

## 問題分析

### 1. 無限重載問題
**症狀**：
- Web 版本啟動後，Metro bundler 會不斷重新編譯 index.ts
- 每次編譯只需要 60-100ms，但會無限循環
- 瀏覽器頁面無法正常載入，一直處於載入狀態

**原因**：
- 在模組頂層執行的 console.log 語句會導致 Metro 在 Web 環境下重新載入
- Expo SDK 53 不再支援 Webpack，只能使用 Metro bundler
- Metro bundler 在 Web 平台的 HMR (Hot Module Replacement) 機制可能有問題

### 2. 已嘗試的解決方案

#### 方案一：移除所有模組層級的 console.log
**執行步驟**：
1. 修改 `src/config/environment.ts`，將所有 console.log 加上 `Platform.OS !== 'web'` 條件
2. 註解掉 `app.config.js` 中的 console.log
3. 註解掉 `metro.config.js` 中的 console.log
4. 移除 `src/screens/dashboard/EnhancedDashboardV2.tsx` 中的調試用 console.log

**結果**：問題仍然存在，無限重載繼續發生

#### 方案二：安裝必要的 Web 相依套件
**執行步驟**：
```bash
npx expo install react-native-web @expo/metro-runtime
```

**結果**：套件安裝成功，但無限重載問題仍未解決

## 目前狀態
- 原生平台（iOS/Android）運行正常
- Web 平台因為 Metro bundler 無限重載問題無法使用
- 已標記穩定版本標籤：`stable-native-app-v1.0`

## 建議的解決方向

### 短期方案
1. **暫時停用 Web 支援**：在 `app.config.js` 中移除 Web 平台配置
2. **專注於原生平台**：確保 iOS 和 Android 版本的穩定性和功能完整性

### 長期方案
1. **等待 Expo SDK 更新**：等待 Expo 團隊修復 Metro bundler 在 Web 平台的問題
2. **考慮獨立的 Web 版本**：使用純 React + Vite 建立獨立的 Web 版本，共享業務邏輯
3. **降級到 Expo SDK 52**：如果需要 Web 支援，可以考慮降級到支援 Webpack 的版本

## 相關資源
- [Expo SDK 53 Release Notes](https://blog.expo.dev/expo-sdk-53/)
- [Metro bundler Documentation](https://metrobundler.dev/)
- [React Native Web Documentation](https://necolas.github.io/react-native-web/)

## 更新記錄
- 2025-01-23：初次記錄問題，嘗試多種解決方案但未成功