# PRP-115: 修復 AdaptiveButton 崩潰和 CSS 破版問題

## 目標
修復 Web 平台因 AdaptiveButton 錯誤導致的頁面崩潰，以及 NotionDatabaseV4.css 造成的全域樣式破版問題。

## 為什麼
- **業務影響**：Web 平台完全無法使用，使用者無法訪問任何功能
- **整合影響**：PRP-114 的大規模元件遷移（88 個檔案）使得所有按鈕都崩潰
- **解決問題**：恢復 Web 平台的可用性，確保 Adaptive 元件系統正常運作

## 什麼
修復兩個關鍵問題：
1. AdaptiveButton 錯誤呼叫 `DesignSystem.getButtonStyle()` 函數
2. NotionDatabaseV4.css 的 `!important` 規則破壞全域佈局

### 成功標準
- [ ] Web 平台能正常載入，無 JavaScript 錯誤
- [ ] 按鈕顯示正確顏色（非黑字黑底）
- [ ] 左側導航正常顯示，不被推出視窗
- [ ] 所有 Adaptive 元件正常運作
- [ ] CSS 樣式不互相衝突

## 所需上下文

### 文件與參考
```yaml
# 必讀檔案
- file: src/components/adaptive/core/AdaptiveButton.tsx
  why: 包含錯誤的 getButtonStyle 呼叫（第 85 行）
  
- file: src/theme/designSystem.ts
  why: 包含正確的 getButtonStyle 函數匯出（第 191 行）
  
- file: src/components/database/web/styles/NotionDatabaseV4.css
  why: 造成破版的 CSS 檔案，使用大量 !important
  
- file: src/components/common/Button/Button.web.tsx
  why: 參考正確的 Web 按鈕實作模式

- doc: CLAUDE.md
  why: 包含 Adaptive 元件開發規範和顏色系統規範
```

### 現有問題分析
```javascript
// 錯誤的呼叫方式（AdaptiveButton.tsx 第 85 行）
const baseStyle = DesignSystem.getButtonStyle(variant, size);
// TypeError: _designSystem.DesignSystem.getButtonStyle is not a function

// 正確的呼叫方式
import { DesignSystem, getButtonStyle } from '../../../theme/designSystem';
const baseStyle = getButtonStyle(variant, size);
```

### CSS 破版問題
```css
/* NotionDatabaseV4.css 造成的問題 */
.notion-database-wrapper {
    padding: 0 96px !important;  /* 強制左右 96px，推走導航 */
    display: flex !important;
    flex-direction: column !important;
    overflow: auto !important;
}
```

## 實作藍圖

### 任務清單

```yaml
Task 1: 修正 AdaptiveButton 的 getButtonStyle 呼叫
MODIFY src/components/adaptive/core/AdaptiveButton.tsx:
  - 第 10 行：修改匯入語句，加入 getButtonStyle
  - 第 85 行：改為直接呼叫 getButtonStyle(variant, size)
  - 確保不影響其他功能

Task 2: 隔離 NotionDatabaseV4.css 的影響範圍
CREATE src/styles/cssIsolation.css:
  - 創建覆蓋規則，保護主要佈局元件
  - 使用更高優先級的選擇器
  - 針對性修復破版問題

Task 3: 修改 CSS 載入順序
MODIFY src/components/database/notion/NotionTable.tsx 等:
  - 確保 cssIsolation.css 在 NotionDatabaseV4.css 之後載入
  - 或考慮使用 CSS Modules 隔離樣式

Task 4: 驗證所有 Adaptive 元件
CHECK 以下元件是否正常：
  - AdaptiveButton: 顏色、點擊、載入狀態
  - AdaptiveSwitch: 軌道顏色、切換功能
  - AdaptiveModal: 顯示、關閉、遮罩
  - AdaptiveInput: 邊框、焦點、輸入
```

### Task 1 詳細修改
```typescript
// src/components/adaptive/core/AdaptiveButton.tsx
// 修改前（第 10 行）：
import { DesignSystem } from '../../../theme/designSystem';

// 修改後：
import { DesignSystem, getButtonStyle } from '../../../theme/designSystem';

// 修改前（第 85 行）：
const baseStyle = DesignSystem.getButtonStyle(variant, size);

// 修改後：
const baseStyle = getButtonStyle(variant, size);
```

### Task 2 CSS 隔離策略
```css
/* src/styles/cssIsolation.css */
/* 保護主要佈局容器 */
#root > div:first-child {
  padding: 0 !important;  /* 覆蓋 notion-database-wrapper */
  display: flex !important;
  flex-direction: row !important;  /* 確保橫向佈局 */
}

/* 保護導航側邊欄 */
.navigation-sidebar {
  position: sticky !important;
  left: 0 !important;
  width: 240px !important;
  flex-shrink: 0 !important;
}

/* 限制 Notion 樣式只在其容器內生效 */
.notion-table-container .notion-database-wrapper {
  /* 允許 Notion 樣式 */
}

/* 確保按鈕不被影響 */
button:not(.notion-button) {
  /* 保護非 Notion 按鈕 */
  color: inherit !important;
  background-color: inherit !important;
}
```

## 驗證循環

### Level 1: 語法檢查
```bash
# TypeScript 編譯檢查
npm run tsc

# ESLint 檢查
npm run lint

# 預期：無錯誤
```

### Level 2: 建置測試
```bash
# 清理快取
rm -rf .expo node_modules/.cache dist-web

# 重新建置 Web
npm run web:build

# 預期：建置成功，無錯誤
```

### Level 3: 本地測試
```bash
# 啟動本地開發伺服器
npm run web

# 測試項目：
# 1. 頁面能載入（無白屏）
# 2. 控制台無錯誤
# 3. 按鈕顯示正確顏色
# 4. 左側導航正常顯示
# 5. 點擊按鈕有反應
```

### Level 4: 部署測試
```bash
# 部署到 Firebase
firebase deploy --only hosting

# 訪問 https://donnaai-5e601.web.app
# 重複 Level 3 的測試項目
```

## 最終驗證清單
- [ ] AdaptiveButton 不再報錯 `getButtonStyle is not a function`
- [ ] 頁面能正常載入，無崩潰
- [ ] 按鈕顯示正確顏色（主按鈕藍色、次按鈕灰色等）
- [ ] 左側導航欄正常顯示，未被推出視窗
- [ ] 內容區域佈局正常，無錯位
- [ ] 所有 Adaptive 元件功能正常
- [ ] CSS 樣式隔離成功，無衝突

## 反模式避免
- ❌ 不要直接修改 NotionDatabaseV4.css（會被覆蓋）
- ❌ 不要使用過多 !important（造成維護困難）
- ❌ 不要跳過測試直接部署
- ❌ 不要忽略 TypeScript 錯誤
- ❌ 不要破壞現有功能

## 已知陷阱
```yaml
關鍵注意事項:
  - AdaptiveButton 被 88 個檔案使用，修改要特別小心
  - CSS 優先級：內聯樣式 > !important > 普通樣式
  - React Native Web 的 StyleSheet.create 可能被覆蓋
  - 快取問題：修改後需清理 .expo 和 node_modules/.cache
  - Platform.OS === 'web' 的判斷要確保正確
```

## 根本原因分析
1. **AdaptiveButton 錯誤**：最初實作時假設 getButtonStyle 是 DesignSystem 的方法，但實際是獨立匯出的函數
2. **CSS 破版**：NotionDatabaseV4.css 使用過多 !important 且作用域過大，影響全域樣式
3. **問題擴大**：PRP-114 批量替換 88 個檔案，讓錯誤從局部變成全域

## 信心評分
**8/10** - 問題原因明確，解決方案清晰，但需要仔細測試確保不引入新問題。

---
執行優先級：**緊急** - Web 平台完全無法使用，必須立即修復