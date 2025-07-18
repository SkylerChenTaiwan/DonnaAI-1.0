name: "Expo SDK 53 升級計劃 - 維持 React 18 相容性"
description: |

## Purpose
完成 Expo SDK 53 升級，同時解決 Firebase 相容性問題並維持 React 18.3.1（避免 React 19 的不穩定性）

## Core Principles
1. **Context is King**: 包含所有已知的相容性問題和解決方案
2. **Validation Loops**: 提供可執行的測試來驗證每個步驟
3. **Information Dense**: 使用專案中的實際檔案路徑和程式碼模式
4. **Progressive Success**: 先解決核心問題，驗證後再處理其他問題
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
將專案從 Expo SDK 52 升級到 SDK 53，同時：
- 解決 Firebase JS SDK 與 Metro bundler 的相容性問題
- 保持使用 React 18.3.1（不升級到 React 19）
- 確保所有功能正常運作，特別是 Firebase 認證
- 與模擬器上的 Expo Go SDK 53 版本相符

## Why
- **版本對齊**：目前 Expo Go 是 SDK 53，專案是 SDK 52，造成版本不匹配
- **功能更新**：獲得 SDK 53 的新功能和效能改進
- **未來準備**：為未來升級做準備，同時保持穩定性

## What
升級 Expo SDK 並解決所有相容性問題，確保：
- Metro bundler 正常啟動
- Firebase 服務正常初始化
- Expo Go 可以連接並執行應用程式
- 所有測試通過

### Success Criteria
- [ ] Metro bundler 啟動無錯誤
- [ ] Firebase Auth 正常初始化（無 "Component has not been registered yet" 錯誤）
- [ ] Expo Go 成功連接並載入應用程式
- [ ] 所有現有功能測試通過
- [ ] 構建過程無警告或錯誤

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://github.com/expo/expo/issues/36588
  why: Firebase JS SDK 與 Metro package.json:exports 相容性問題的官方討論
  
- url: https://docs.expo.dev/guides/using-firebase/
  why: Expo 官方的 Firebase 整合指南，包含 metro.config.js 修改建議
  
- url: https://expo.dev/changelog/sdk-53
  why: SDK 53 的完整變更日誌，了解所有破壞性變更

- file: /Users/skyler/coding/DonnaAI-1.0/docs/error-reports/2025-07-18-react-19-firebase-auth-error.md
  why: 詳細記錄了 Firebase Auth 錯誤和解決方案
  
- file: /Users/skyler/coding/DonnaAI-1.0/docs/error-reports/2025-07-18-jest-expo-react-version-conflict.md
  why: 測試環境的 React 版本衝突解決方案

- file: /Users/skyler/coding/DonnaAI-1.0/metro.config.js
  why: 當前的 Metro 配置，已包含 Firebase 修復

- file: /Users/skyler/coding/DonnaAI-1.0/src/services/firebase/config.ts
  why: Firebase 延遲初始化模式的實作參考
```

### Current Codebase Structure
```bash
# 關鍵配置檔案
/Users/skyler/coding/DonnaAI-1.0/
├── metro.config.js          # Metro bundler 配置（已優化）
├── package.json             # 套件依賴（SDK 52）
├── app.json                 # Expo 應用程式配置
├── tsconfig.json            # TypeScript 配置
├── jest.config.js           # Jest 測試配置
├── .nvmrc                   # Node.js 版本鎖定（20.18.0）
└── src/
    └── services/firebase/   # Firebase 服務（7個檔案）
        ├── config.ts        # 延遲初始化配置
        ├── auth.ts          # 認證服務
        ├── customers.ts     # 客戶管理
        ├── records.ts       # 記錄管理
        ├── tasks.ts         # 任務管理
        ├── permissions.ts   # 權限管理
        └── ai-confirmations.ts # AI 確認
```

### Known Gotchas & Library Quirks
```javascript
// CRITICAL: Expo SDK 53 預設啟用 Metro 的 package.json:exports
// 這與 Firebase JS SDK 不相容，必須在 metro.config.js 中禁用
config.resolver.unstable_enablePackageExports = false;

// CRITICAL: SDK 53 預設使用 React 19，但我們要保持 React 18
// 必須使用 package.json 的 overrides 功能強制版本

// CRITICAL: Node.js 必須是 v20.x（不是 v24.x）
// Metro bundler 在 Node.js v24 有相容性問題

// CRITICAL: Firebase 必須使用延遲初始化模式
// 避免在 React Native 完全初始化前載入 Firebase
```

## Implementation Blueprint

### 需要修改的檔案結構
```bash
/Users/skyler/coding/DonnaAI-1.0/
├── metro.config.js          # ✓ 已修改（保持現有配置）
├── package.json             # 需要更新依賴和添加 overrides
├── node_modules/            # 需要完全重新安裝
└── package-lock.json        # 需要刪除並重新生成
```

### List of Tasks

```yaml
Task 1 - 備份當前狀態:
  - 執行 git status 確認工作目錄狀態
  - 創建新分支: git checkout -b sdk-53-upgrade-attempt-2
  - 提交任何未保存的更改

Task 2 - 更新 package.json:
MODIFY package.json:
  - FIND: "expo": "~52.0.0"
  - REPLACE: "expo": "~53.0.0"
  - KEEP: "react": "18.3.1" (不要升級到 19)
  - ADD overrides section:
    {
      "overrides": {
        "react": "18.3.1",
        "react-dom": "18.3.1",
        "react-test-renderer": "18.3.1"
      }
    }

Task 3 - 檢查 Metro 配置:
VERIFY metro.config.js:
  - ENSURE: config.resolver.unstable_enablePackageExports = false
  - ENSURE: config.resolver.sourceExts.push('cjs')
  - 如果缺少，添加這些配置

Task 4 - 清理並重新安裝依賴:
  - rm -rf node_modules package-lock.json
  - npm install --legacy-peer-deps
  - 處理任何安裝錯誤

Task 5 - 執行 Expo Doctor:
  - npx expo-doctor
  - 記錄並解決任何問題

Task 6 - 修復依賴版本:
  - npx expo install --fix
  - 這會自動更新相容的依賴版本

Task 7 - 更新測試庫（如果需要）:
  - 檢查 jest-expo 版本
  - 如果有衝突，考慮移除或更新

Task 8 - 驗證 Firebase 服務:
  - 檢查所有 Firebase import
  - 確保使用 'firebase/' 而不是 '@firebase/'
  - 驗證延遲初始化模式正常運作

Task 9 - 啟動 Metro bundler:
  - npx expo start --clear
  - 驗證無錯誤啟動
  - 檢查是否監聽 8081 端口

Task 10 - 測試 Expo Go 連接:
  - 在模擬器中開啟 Expo Go
  - 掃描 QR code 或手動輸入 URL
  - 驗證應用程式正常載入

Task 11 - 執行功能測試:
  - 測試登入功能
  - 測試 Firebase 資料讀寫
  - 測試音訊錄製
  - 測試推送通知

Task 12 - 執行自動化測試:
  - npm test
  - 修復任何測試失敗

Task 13 - 最終驗證和提交:
  - git add -A
  - git commit -m "升級: 成功升級到 Expo SDK 53 並解決 Firebase 相容性問題"
```

### Per Task Implementation Details

```javascript
// Task 2 - package.json 修改範例
{
  "dependencies": {
    "expo": "~53.0.0",  // 從 52.0.0 升級
    "react": "18.3.1",  // 保持不變，不升級到 19
    "react-native": "0.76.3",  // SDK 53 對應版本
    // 其他依賴由 expo install --fix 處理
  },
  "overrides": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-test-renderer": "18.3.1"
  }
}

// Task 3 - Metro 配置驗證
// metro.config.js 應該包含：
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;  // 關鍵！
module.exports = config;

// Task 8 - Firebase 服務驗證點
// 檢查 src/services/firebase/config.ts
// 確保使用 getter 函數模式：
export const getFirebaseApp = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};
```

## Validation Loop

### Level 1: 依賴安裝驗證
```bash
# 檢查是否有安裝錯誤
npm ls | grep -E "(missing|invalid|extraneous)"

# 預期：無輸出（表示沒有問題）
# 如果有錯誤：讀取錯誤訊息並修復
```

### Level 2: Expo Doctor 檢查
```bash
# 執行 Expo 診斷工具
npx expo-doctor

# 預期輸出：
# ✔ Check package.json for common issues
# ✔ Validate global prerequisites versions
# ✔ Validate Expo Config
# 如果有警告或錯誤，根據提示修復
```

### Level 3: Metro Bundler 啟動測試
```bash
# 清除快取並啟動
npx expo start --clear

# 預期行為：
# 1. Metro bundler 成功啟動
# 2. 顯示 QR code
# 3. 顯示 "Metro waiting on exp://[IP]:8081"
# 4. 無 Firebase 相關錯誤
```

### Level 4: Firebase 初始化測試
```javascript
// 創建測試檔案 test-firebase.js
import { getFirebaseApp } from './src/services/firebase/config';
import { getAuth } from 'firebase/auth';

try {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  console.log('✅ Firebase 初始化成功');
} catch (error) {
  console.error('❌ Firebase 初始化失敗:', error);
}

// 執行：node test-firebase.js
// 預期：看到成功訊息
```

### Level 5: Expo Go 實機測試
```bash
# 在模擬器中測試
# 1. 開啟 Expo Go
# 2. 連接到開發伺服器
# 3. 等待應用程式載入

# 檢查點：
# - 無 "Component auth has not been registered yet" 錯誤
# - 無 "SDK version mismatch" 錯誤
# - 登入畫面正常顯示
```

## Final Validation Checklist
- [ ] Metro bundler 無錯誤啟動
- [ ] 無 npm 依賴警告：`npm ls`
- [ ] Expo Doctor 所有檢查通過
- [ ] Firebase 服務正常初始化
- [ ] Expo Go 成功連接並載入應用
- [ ] 登入功能正常運作
- [ ] 基本 CRUD 操作測試通過
- [ ] Git 提交完成

## Anti-Patterns to Avoid
- ❌ 不要升級到 React 19 - 保持 18.3.1
- ❌ 不要移除 metro.config.js 的 Firebase 修復
- ❌ 不要使用 Node.js v24 - 保持 v20.18.0
- ❌ 不要忽略 expo-doctor 的警告
- ❌ 不要跳過清除 node_modules 的步驟
- ❌ 不要在未測試的情況下提交

## Recovery Plan
如果升級失敗：
1. `git checkout .` 恢復所有更改
2. `git checkout main` 回到主分支
3. `rm -rf node_modules package-lock.json`
4. `npm install` 重新安裝原始依賴
5. 分析錯誤日誌，調整策略

---

**信心評分**: 8/10
- 已有明確的 Firebase 解決方案（metro.config.js）
- React 版本控制策略清晰（overrides）
- 有完整的驗證步驟
- 風險：可能還有未知的第三方庫相容性問題