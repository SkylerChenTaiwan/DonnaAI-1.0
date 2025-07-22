# Firebase "Browser Mode" 深入分析報告

生成日期：2025-01-22
報告者：Claude Code

## 問題描述

Firebase SDK 持續報錯：`An API Key must be set when running in a browser`，即使我們已經：
1. 修復了環境變數載入
2. 確保使用 app.config.js
3. 添加了 global.navigator.product = 'ReactNative'

## 深入分析

### Firebase SDK 環境檢測機制

Firebase Web SDK 使用以下邏輯判斷執行環境：
```javascript
// Firebase 內部可能的檢測邏輯
if (typeof window !== 'undefined' && window.document) {
  // Browser environment
} else if (typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative') {
  // React Native environment
} else {
  // Node.js or other environment
}
```

### 可能的原因

1. **Metro Bundler 環境變數處理**
   - Metro 可能在打包時改變了環境檢測的行為
   - process.env 在 React Native 中可能不會正確替換

2. **Firebase SDK 版本問題**
   - Firebase Web SDK v9+ 對 React Native 的支援可能有問題
   - 特別是在 React Native 0.79.5 這個較新版本上

3. **Expo SDK 相容性**
   - Expo SDK 52 可能與 Firebase Web SDK 有相容性問題
   - Expo 的 JS 引擎（Hermes）可能影響環境檢測

## 建議的解決方案

### 方案 1：使用 React Native Firebase（推薦）
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```
優點：專為 React Native 設計，不會有環境檢測問題
缺點：需要較大的重構

### 方案 2：降級 Firebase SDK
```json
{
  "firebase": "^9.6.0"  // 較舊但更穩定的版本
}
```

### 方案 3：Polyfill 環境
在 App.tsx 或 index.js 最頂部添加：
```javascript
// 完整的環境 polyfill
if (typeof global !== 'undefined') {
  global.self = global;
  global.window = global;
  global.navigator = {
    userAgent: 'ReactNative',
    product: 'ReactNative',
    platform: 'ReactNative'
  };
}
```

### 方案 4：使用 Firebase Admin SDK（伺服器端）
將 Firebase 操作移到 Cloud Functions，客戶端只調用 API

## 緊急修復建議

由於這個問題阻塞了整個應用程式，建議：
1. 先嘗試方案 3（最快）
2. 如果無效，嘗試方案 2
3. 長期考慮遷移到方案 1 或 4

## 相關資源
- [Firebase JS SDK React Native Issues](https://github.com/firebase/firebase-js-sdk/issues?q=react+native)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)