# React 19 + Firebase Auth "Component has not been registered yet" 錯誤分析

## 錯誤摘要
- **錯誤訊息**: "Component auth has not been registered yet"
- **發生時間**: 升級到 React 19 + Expo SDK 53 後
- **環境**: React Native with Expo SDK 53, React 19.1, Firebase Auth
- **嚴重程度**: 關鍵 - 阻止應用程式啟動

## 根本原因分析

### 主要原因
Expo SDK 53 預設啟用了 Metro 的 `package.json:exports` 功能，這與 Firebase JS SDK 的 Auth 模組不相容。React Native 0.79（Expo SDK 53 使用）開始預設啟用了 package.json 的 exports 和 imports 功能，導致 Firebase 模組載入失敗。

### 技術細節
1. **Metro bundler 的新功能衝突**：
   - Expo SDK 53 使用的 Metro 版本啟用了 `unstable_enablePackageExports`
   - Firebase SDK 的打包方式與此功能不相容
   - 導致 Firebase Auth 模組無法正確註冊

2. **React 19 的破壞性變更**：
   - React 19 對模組載入機制有變更
   - 某些第三方庫（如 @testing-library/react）需要更新到相容版本

3. **模組載入順序問題**：
   - Firebase 初始化時機可能過早
   - 在 React Native 完全初始化前就嘗試載入 Firebase

## 解決方案

### 方案 A：修改 Metro 配置（推薦）
**步驟**：
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
// 關鍵設定：禁用不穩定的 package exports 功能
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
```

**優點**：
- 最簡單直接的解決方案
- 保持使用官方 Firebase SDK
- 不需要修改現有程式碼

**缺點**：
- 禁用了 Metro 的新功能
- 可能影響其他依賴的效能優化

### 方案 B：更改 Firebase 導入路徑
**步驟**：
將所有 Firebase 導入從：
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
```

改為：
```javascript
import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
```

**優點**：
- 避開 package.json exports 問題
- 保持 Metro 新功能啟用

**缺點**：
- 需要修改所有 Firebase 相關程式碼
- 使用非官方推薦的導入路徑
- 可能在未來版本中不被支援

### 方案 C：降級到 React 18
**步驟**：
```bash
npm install react@18.3.1 react-dom@18.3.1 --save-exact
npm install @testing-library/react@^14.0.0 --save-dev
```

**優點**：
- 完全避開 React 19 相容性問題
- 更穩定的生態系統支援

**缺點**：
- 無法使用 React 19 新功能
- 未來仍需要升級

### 方案 D：使用 react-native-firebase
**步驟**：
移除 Firebase Web SDK，改用專為 React Native 設計的 react-native-firebase

**優點**：
- 專為 React Native 優化
- 更好的效能和原生整合

**缺點**：
- 需要重寫所有 Firebase 相關程式碼
- 需要額外的原生配置

## 影響評估

- **開發影響**：完全阻止開發和測試
- **時間成本**：
  - 方案 A：5 分鐘
  - 方案 B：30-60 分鐘（取決於程式碼量）
  - 方案 C：15 分鐘 + 測試時間
  - 方案 D：2-4 小時
- **風險等級**：中等 - 影響核心認證功能

## 建議執行順序

1. **立即執行方案 A**（修改 Metro 配置）以恢復開發
2. 測試應用程式的所有功能
3. 監控 Firebase 和 Expo 的更新，等待官方修復
4. 長期考慮是否需要遷移到 react-native-firebase

## 預防措施

1. 在升級主要依賴前，先在分支上測試
2. 檢查所有關鍵依賴的相容性矩陣
3. 建立自動化測試以快速發現此類問題
4. 追蹤 Expo 和 Firebase 的 GitHub issues

## 相關資源

- [Expo SDK 53 Firebase 相容性問題 #36588](https://github.com/expo/expo/issues/36588)
- [Firebase Auth 註冊錯誤 #36496](https://github.com/expo/expo/issues/36496)
- [Stack Overflow 討論](https://stackoverflow.com/questions/79602687/react-native-expo-firebase-auth-component-auth-has-not-been-registered-yet)

## 更新記錄
- 2025-07-18：初始分析和解決方案