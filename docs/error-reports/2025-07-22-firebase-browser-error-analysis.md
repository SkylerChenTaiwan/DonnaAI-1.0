# Firebase "An API Key must be set when running in a browser" 錯誤分析

## 問題總結
當使用 `app.config.js` 替代 `app.json` 並加入 `dotenv` 時，Firebase 初始化失敗，錯誤訊息為 "An API Key must be set when running in a browser"。

## 環境資訊
- React Native: 0.79.5
- React: 19.0.0
- Firebase: 10.12.2
- Expo SDK: 53.0.0
- Platform: iOS (Hermes JS engine)

## 分析發現

### 1. 環境變數載入正常
- 從調試輸出可見，所有 Firebase 環境變數都正確載入
- `Constants.expoConfig?.extra` 包含所有必要的配置

### 2. Firebase SDK 環境檢測問題
錯誤訊息 "when running in a browser" 表示 Firebase SDK 誤認為它在瀏覽器環境中運行。

### 3. 可能的原因

#### 原因 A: dotenv 改變了全域環境
當在 `app.config.js` 中使用 `require('dotenv').config()` 時，可能改變了某些全域變數，導致 Firebase SDK 的環境檢測邏輯出錯。

#### 原因 B: Metro bundler 的模組解析順序
使用 `app.config.js` 可能改變了模組的載入順序，導致 Firebase 在某些必要的 React Native polyfill 載入之前就被初始化。

#### 原因 C: React Native 0.79 的 Breaking Changes
React Native 0.79 引入了新的 package.json exports 功能，這與 Firebase SDK 不相容。雖然我們在 `metro.config.js` 中設定了 `unstable_enablePackageExports = false`，但可能還有其他相關問題。

## 解決方案

### 方案 1: 使用靜態 app.json（目前採用）
保持使用靜態的 `app.json`，環境變數透過 Expo 的機制自動載入。

### 方案 2: 延遲 Firebase 初始化
確保 Firebase 只在應用程式完全初始化後才被調用。

### 方案 3: 使用 Firebase React Native SDK
考慮使用 `@react-native-firebase/app` 而非 Web SDK。

### 方案 4: 修改 app.config.js 載入方式
不使用 `dotenv`，改用其他方式載入環境變數：
```javascript
// 使用 Expo 的環境變數機制
const expoConstants = require('expo-constants');
```

## 建議
1. 暫時保持使用 `app.json`
2. 如需動態配置，考慮使用 `app.config.js` 但不載入 `dotenv`
3. 監控 Firebase SDK 對 React Native 0.79 的支援更新