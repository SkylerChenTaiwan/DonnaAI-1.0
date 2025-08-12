name: "資料匯入精靈 UI/UX 測試與修復 v1.0"
description: |
  全面測試並修復資料匯入精靈的 UI 顯示問題和功能性問題，確保在 Web 平台上正常運作。
  主要解決深灰色背景搭配黑色字體的對比度問題，以及下拉選單和輸入欄位無法使用的問題。

---

## Goal
修復資料匯入精靈在 Web 平台的所有 UI/UX 問題，確保：
1. 所有文字和元素都有足夠的對比度，清晰可見
2. 所有下拉選單、輸入欄位和互動元件都能正常使用
3. 統一跨平台的使用體驗
4. 建立完整的測試覆蓋

## Why
- **業務影響**: 資料匯入是組織管理的核心功能，目前無法正常使用嚴重影響用戶體驗
- **用戶痛點**: 管理員無法看清介面內容，無法操作下拉選單，導致無法完成資料匯入
- **技術債務**: 缺乏測試覆蓋，導致問題未被及時發現
- **品質提升**: 建立測試框架，預防未來類似問題

## What
### 用戶可見的改善
- 所有文字清晰可見，對比度符合 WCAG AA 標準（至少 4.5:1）
- 所有下拉選單可以正常點擊和選擇
- 所有輸入欄位可以正常輸入和編輯
- 統一的視覺風格，符合 Notion 風格設計系統

### 技術需求
- 修復 Web 平台的樣式衝突問題
- 實作 Platform-specific 元件
- 建立完整的測試套件
- 優化元件架構

### Success Criteria
- [ ] 所有文字對比度 >= 4.5:1（WCAG AA 標準）
- [ ] 所有下拉選單在 Web 平台可正常操作
- [ ] 所有輸入欄位在 Web 平台可正常輸入
- [ ] 通過所有單元測試和整合測試
- [ ] 在 Chrome、Safari、Firefox 測試通過
- [ ] 無控制台錯誤或警告

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/components/import/ImportWizard.tsx
  why: 主要元件，管理整個匯入流程
  
- file: src/components/import/stages/DatabaseSelector.tsx
  why: 第一階段元件，包含選擇器和卡片樣式
  
- file: src/components/import/stages/FileUploadMerger.tsx
  why: 第二階段元件，處理檔案上傳
  
- file: src/components/import/stages/FieldMapper.tsx
  why: 第三階段元件，欄位映射包含多個下拉選單
  
- file: src/components/import/stages/DataAssignmentStep.tsx
  why: 第四階段元件，資料分配

- file: docs/WEB-STYLE-SYSTEM.md
  why: Web 平台樣式系統指南，說明樣式衝突問題和解決方案
  
- file: src/theme/designSystem.ts
  why: 設計系統定義，包含所有顏色和樣式常量

- url: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
  why: WCAG 對比度標準，確保可訪問性

- url: https://necolas.github.io/react-native-web/docs/
  why: React Native Web 文件，了解平台差異
```

### Current Codebase Structure
```bash
src/
├── components/
│   ├── import/
│   │   ├── ImportWizard.tsx            # 主精靈元件
│   │   ├── stages/                     # 各階段元件
│   │   │   ├── DatabaseSelector.tsx    # 資料庫選擇
│   │   │   ├── FileUploadMerger.tsx    # 檔案上傳
│   │   │   ├── FieldMapper.tsx         # 欄位映射
│   │   │   └── DataAssignmentStep.tsx  # 資料分配
│   │   ├── assignment/                 # 分配相關元件
│   │   │   ├── UserSelector.tsx        # 用戶選擇器
│   │   │   └── AssignmentStrategySelector.tsx
│   │   └── styles/                     # 樣式檔案
│   │       └── IntelligentFieldMapperStyles.ts
│   └── common/
│       ├── FormInput/                  # 輸入元件（需要參考）
│       └── Dropdown/                   # 下拉選單元件（可能需要建立）
├── theme/
│   ├── designSystem.ts                 # 設計系統
│   └── platformTokens.ts               # 平台特定設計標記
└── tests/
    └── components/
        └── import/                     # 測試檔案（需要建立）
```

### Desired Codebase Structure
```bash
src/
├── components/
│   ├── import/
│   │   ├── ImportWizard.tsx            # 主精靈元件（優化後）
│   │   ├── ImportWizard.web.tsx        # Web 平台特定實作
│   │   ├── stages/
│   │   │   ├── [stage-name]/
│   │   │   │   ├── index.tsx           # 導出邏輯
│   │   │   │   ├── [StageComponent].tsx # Native 實作
│   │   │   │   ├── [StageComponent].web.tsx # Web 實作
│   │   │   │   └── styles.ts           # 共用樣式
│   │   └── components/                 # 共用元件
│   │       ├── WebDropdown.tsx         # Web 專用下拉選單
│   │       ├── WebInput.tsx            # Web 專用輸入欄位
│   │       └── ColorAdjuster.tsx       # 對比度調整工具
│   └── common/
│       └── Dropdown/
│           ├── index.tsx
│           ├── Dropdown.tsx            # Native 實作
│           └── Dropdown.web.tsx        # Web 實作
└── tests/
    └── components/
        └── import/
            ├── ImportWizard.test.tsx
            ├── stages/
            │   ├── DatabaseSelector.test.tsx
            │   ├── FileUploadMerger.test.tsx
            │   ├── FieldMapper.test.tsx
            │   └── DataAssignmentStep.test.tsx
            └── utils/
                └── colorContrast.test.ts
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Native Web 樣式優先級問題
// 問題：全域 CSS (NotionDatabaseV4.css) 會覆蓋 React Native Web 生成的樣式
// 解決：Web 平台使用內聯樣式或原生 HTML 元素

// CRITICAL: @react-native-picker/picker 在 Web 的問題
// 問題：Picker 元件在 Web 平台可能無法正常渲染或樣式異常
// 解決：Web 平台使用原生 <select> 元素並套用內聯樣式

// CRITICAL: Platform.OS === 'web' 檢查
// 必須在所有需要平台特定處理的地方加入檢查
// 優先使用 .web.tsx 檔案分離，而非條件判斷

// CRITICAL: 顏色對比度計算
// 使用 WCAG 標準計算對比度
// 文字對比度至少 4.5:1，大文字（18pt+）至少 3:1

// CRITICAL: 測試環境設定
// Jest 需要設定 transformIgnorePatterns 來處理 React Native 模組
// 需要 mock Platform.OS 來測試不同平台
```

## Implementation Blueprint

### 階段一：問題診斷與度量（2小時）

#### Task 1: 建立對比度檢測工具
```typescript
// CREATE src/utils/colorContrast.ts
export function calculateContrast(color1: string, color2: string): number {
  // 實作 WCAG 對比度計算公式
  // 參考：https://www.w3.org/TR/WCAG20-TECHS/G17.html
}

export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrast(foreground, background) >= 4.5;
}

export function suggestColor(original: string, background: string, targetRatio: number = 4.5): string {
  // 建議符合對比度的替代顏色
}
```

#### Task 2: 掃描現有元件的對比度問題
```typescript
// CREATE src/scripts/auditContrast.ts
// 掃描所有元件檔案，找出潛在的對比度問題
// 輸出報告：docs/audit-reports/contrast-audit.md
```

### 階段二：設計系統更新（2小時）

#### Task 3: 更新設計系統顏色
```typescript
// MODIFY src/theme/designSystem.ts
// 調整顏色以符合 WCAG AA 標準
// 原則：
// - 保持 Notion 風格的同時提升對比度
// - 深化文字顏色：#37352F -> #1A1A1A
// - 淺化背景色：#F7F6F3 -> #FAFAFA
// - 加強邊框色：#E3E1DC -> #D1D5DB
```

#### Task 4: 建立 Web 專用樣式覆寫
```typescript
// CREATE src/theme/webOverrides.ts
export const webColorOverrides = {
  // Web 平台的顏色調整
  text: {
    primary: '#000000',    // 更深的文字
    secondary: '#4A4A4A',  // 調整次要文字
  },
  background: {
    surface: '#FFFFFF',    // 純白背景
    input: '#F8F8F8',      // 更淺的輸入框背景
  }
};
```

### 階段三：元件重構（4小時）

#### Task 5: 建立通用 Web Dropdown 元件
```typescript
// CREATE src/components/common/Dropdown/Dropdown.web.tsx
export const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, ...props }) => {
  const webSelectStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    cursor: 'pointer',
    outline: 'none',
    // 確保下拉箭頭可見
    appearance: 'auto',
    WebkitAppearance: 'auto',
  };

  return (
    <select
      style={webSelectStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
```

#### Task 6: 建立通用 Web Input 元件
```typescript
// CREATE src/components/common/FormInput/FormInput.web.tsx
export const FormInput: React.FC<FormInputProps> = ({ ...props }) => {
  const webInputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    outline: 'none',
    boxSizing: 'border-box' as const,
    '::placeholder': {
      color: '#9CA3AF',
    }
  };

  return (
    <input
      type="text"
      style={webInputStyle}
      {...props}
    />
  );
};
```

#### Task 7-10: 重構各階段元件
```yaml
Task 7 - DatabaseSelector:
  MODIFY src/components/import/stages/DatabaseSelector.tsx:
    - 分離 Web 和 Native 實作
    - 調整卡片背景和文字顏色
    - 確保選中狀態明顯

Task 8 - FileUploadMerger:
  MODIFY src/components/import/stages/FileUploadMerger.tsx:
    - 修復檔案選擇按鈕樣式
    - 改善表格顯示對比度
    - 修復 Web 平台的下拉選單

Task 9 - FieldMapper:
  MODIFY src/components/import/stages/FieldMapper.tsx:
    - 使用新的 Dropdown 元件
    - 改善映射表格的對比度
    - 修復欄位選擇器

Task 10 - DataAssignmentStep:
  MODIFY src/components/import/stages/DataAssignmentStep.tsx:
    - 修復用戶選擇器
    - 改善策略選擇器樣式
    - 確保分配預覽清晰
```

### 階段四：測試實作（3小時）

#### Task 11: 建立單元測試
```typescript
// CREATE tests/components/import/ImportWizard.test.tsx
describe('ImportWizard', () => {
  describe('Contrast Tests', () => {
    test('所有文字符合 WCAG AA 標準', () => {
      // 測試各種文字和背景組合
    });
  });
  
  describe('Functionality Tests', () => {
    test('階段導航正常運作', () => {
      // 測試前進/後退按鈕
    });
    
    test('資料流正確傳遞', () => {
      // 測試各階段資料傳遞
    });
  });
  
  describe('Platform Tests', () => {
    test('Web 平台渲染正確', () => {
      Platform.OS = 'web';
      // 測試 Web 特定元件
    });
    
    test('Native 平台渲染正確', () => {
      Platform.OS = 'ios';
      // 測試 Native 元件
    });
  });
});
```

#### Task 12: 建立整合測試
```typescript
// CREATE tests/integration/dataImport.test.tsx
describe('Data Import E2E', () => {
  test('完整匯入流程', async () => {
    // 1. 選擇資料庫
    // 2. 上傳檔案
    // 3. 映射欄位
    // 4. 分配資料
    // 5. 執行匯入
  });
});
```

#### Task 13: 建立視覺回歸測試
```typescript
// CREATE tests/visual/importWizard.visual.test.tsx
// 使用 @storybook/test-runner 或類似工具
// 擷取各階段的螢幕截圖並比對
```

### 階段五：效能優化（1小時）

#### Task 14: 優化大檔案處理
```typescript
// MODIFY src/components/import/stages/FileUploadMerger.tsx
// 實作串流處理和虛擬滾動
// 使用 Web Worker 處理 CSV 解析（Web 平台）
```

#### Task 15: 優化渲染效能
```typescript
// 使用 React.memo 和 useMemo 優化重複渲染
// 分離靜態和動態內容
// 實作懶加載策略
```

## Validation Loop

### Level 1: 靜態分析與樣式檢查
```bash
# 執行 TypeScript 檢查
npm run type-check

# 執行 ESLint
npm run lint

# 執行對比度審計
npm run audit:contrast

# Expected: 無錯誤，所有對比度 >= 4.5:1
```

### Level 2: 單元測試
```bash
# 執行所有測試
npm run test

# 執行覆蓋率報告
npm run test:coverage

# Expected: 
# - 所有測試通過
# - 覆蓋率 > 80%
```

### Level 3: 跨瀏覽器測試
```bash
# 啟動 Web 開發伺服器
npm run web:dev

# 手動測試檢查清單：
# Chrome:
# - [ ] 所有文字清晰可見
# - [ ] 下拉選單可正常操作
# - [ ] 輸入欄位可正常輸入
# - [ ] 四個階段都能正常切換

# Safari:
# - [ ] 同上測試項目

# Firefox:
# - [ ] 同上測試項目

# Edge:
# - [ ] 同上測試項目
```

### Level 4: 行動裝置測試
```bash
# iOS 模擬器
npm run ios

# Android 模擬器
npm run android

# Expected: Native 元件正常運作，樣式一致
```

### Level 5: 可訪問性測試
```bash
# 使用 axe-core 或 lighthouse
npm run audit:a11y

# Expected:
# - 無可訪問性違規
# - 對比度分數 100
# - 表單元素都有正確的標籤
```

## Final Validation Checklist
- [ ] 所有文字對比度符合 WCAG AA 標準（4.5:1）
- [ ] Web 平台所有下拉選單可正常使用
- [ ] Web 平台所有輸入欄位可正常輸入
- [ ] 四個匯入階段都能順利完成
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] 單元測試覆蓋率 > 80%
- [ ] 跨瀏覽器測試通過（Chrome、Safari、Firefox、Edge）
- [ ] 行動平台測試通過（iOS、Android）
- [ ] 可訪問性審計通過
- [ ] 效能指標符合要求（FCP < 1.5s, TTI < 3.5s）
- [ ] 文件更新完成

## Anti-Patterns to Avoid
- ❌ 不要使用固定的顏色值，應該從 DesignSystem 引用
- ❌ 不要在元件內部混合 Platform 邏輯，使用 .web.tsx 分離
- ❌ 不要忽略對比度警告，每個顏色組合都要測試
- ❌ 不要使用第三方 UI 庫的下拉選單（在 Web 平台）
- ❌ 不要忽略錯誤邊界，要有優雅的錯誤處理
- ❌ 不要跳過測試，每個修改都要有對應的測試

## 風險評估與緩解策略

### 風險 1：破壞現有功能
**緩解策略**：
- 建立完整的測試套件再開始修改
- 使用 feature flag 逐步推出變更
- 保留原始檔案備份

### 風險 2：樣式衝突擴散
**緩解策略**：
- 使用 CSS Modules 或 styled-components 隔離樣式
- 優先使用內聯樣式（Web 平台）
- 建立樣式隔離邊界

### 風險 3：效能下降
**緩解策略**：
- 使用 React DevTools Profiler 監控效能
- 實作虛擬滾動處理大量資料
- 優化重新渲染邏輯

## 實作優先順序
1. **P0 - 立即修復**：對比度問題、下拉選單無法使用
2. **P1 - 本週完成**：建立測試框架、元件重構
3. **P2 - 下週完成**：效能優化、視覺回歸測試

## 預估時間
- 階段一：問題診斷（2小時）
- 階段二：設計系統更新（2小時）
- 階段三：元件重構（4小時）
- 階段四：測試實作（3小時）
- 階段五：效能優化（1小時）
- **總計：12小時**

## 成功指標
- 用戶滿意度：資料匯入成功率從 60% 提升到 95%
- 技術指標：0 個對比度違規，0 個功能性 bug
- 測試覆蓋：單元測試覆蓋率 > 80%
- 效能指標：匯入 10000 筆資料 < 5 秒

---
*PRP 信心評分：8/10*
*原因：有完整的問題分析和解決方案，但需要大量測試驗證*