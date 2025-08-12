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

### 階段零：視覺測試基礎建設（必須先完成）

#### Task 0.1: 建立截圖測試框架
```typescript
// CREATE src/tests/visual/screenshotTestFramework.ts
import { Page } from 'puppeteer';

export class VisualTestFramework {
  private browser: Browser;
  private page: Page;
  
  async captureScreenshot(name: string, selector?: string) {
    // 擷取整頁或特定元素
    const path = `tests/screenshots/${name}-${Date.now()}.png`;
    if (selector) {
      const element = await this.page.$(selector);
      await element?.screenshot({ path });
    } else {
      await this.page.screenshot({ path, fullPage: true });
    }
    
    // 自動開啟截圖供人工檢視
    if (process.env.OPEN_SCREENSHOTS === 'true') {
      await exec(`open ${path}`); // macOS
    }
    
    return path;
  }
  
  async compareWithBaseline(name: string) {
    // 使用 pixelmatch 比對基準截圖
    const baseline = `tests/screenshots/baseline/${name}.png`;
    const current = await this.captureScreenshot(name);
    
    // 產生差異報告
    const diff = await pixelmatch(baseline, current);
    if (diff > threshold) {
      // 產生視覺差異報告
      await this.generateDiffReport(name, baseline, current);
    }
  }
  
  async interactAndCapture(actions: InteractionScript[]) {
    // 執行互動腳本並擷取每個步驟
    for (const action of actions) {
      await this.executeAction(action);
      await this.captureScreenshot(`${action.name}-after`);
      await this.wait(500); // 等待動畫完成
    }
  }
}
```

#### Task 0.2: 建立互動測試腳本
```typescript
// CREATE src/tests/visual/importWizard.visual.ts
export const importWizardVisualTest = {
  name: 'Import Wizard Visual Test',
  baseUrl: 'http://localhost:3002/admin/organization/[orgId]',
  
  steps: [
    {
      name: 'initial-load',
      action: 'navigate',
      verify: {
        screenshot: true,
        elements: [
          { selector: '.import-wizard', exists: true },
          { selector: '.stage-1', visible: true }
        ],
        contrast: [
          { selector: '.wizard-title', minRatio: 4.5 },
          { selector: '.stage-label', minRatio: 4.5 }
        ]
      }
    },
    {
      name: 'database-selector',
      action: 'click',
      target: '.database-card:first-child',
      verify: {
        screenshot: true,
        visualChanges: [
          { selector: '.database-card', hasClass: 'selected' },
          { selector: '.next-button', isEnabled: true }
        ]
      }
    },
    {
      name: 'file-upload',
      action: 'click',
      target: '.next-button',
      verify: {
        screenshot: true,
        elements: [
          { selector: '.stage-2', visible: true },
          { selector: '.file-upload-area', exists: true }
        ]
      }
    },
    {
      name: 'dropdown-interaction',
      action: 'click',
      target: '.field-mapper select',
      verify: {
        screenshot: true,
        interaction: {
          dropdownOpens: true,
          optionsVisible: true,
          optionsClickable: true
        }
      }
    }
  ]
};
```

#### Task 0.3: 建立視覺驗證報告生成器
```typescript
// CREATE src/tests/visual/reportGenerator.ts
export class VisualTestReporter {
  async generateHTMLReport(testResults: VisualTestResult[]) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>視覺測試報告 - ${new Date().toLocaleString()}</title>
        <style>
          .test-case {
            border: 1px solid #ddd;
            margin: 20px;
            padding: 20px;
          }
          .screenshot {
            max-width: 100%;
            border: 2px solid #ccc;
          }
          .failed { border-color: red; }
          .passed { border-color: green; }
          .contrast-info {
            background: #f0f0f0;
            padding: 10px;
            margin: 10px 0;
          }
          .side-by-side {
            display: flex;
            gap: 20px;
          }
          .interaction-log {
            background: #f9f9f9;
            padding: 10px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>資料匯入精靈 - 視覺測試報告</h1>
        ${this.renderTestCases(testResults)}
      </body>
      </html>
    `;
    
    // 儲存報告
    const reportPath = `tests/reports/visual-test-${Date.now()}.html`;
    await writeFile(reportPath, html);
    
    // 自動開啟報告
    await exec(`open ${reportPath}`);
    
    return reportPath;
  }
  
  renderTestCases(results) {
    return results.map(result => `
      <div class="test-case ${result.passed ? 'passed' : 'failed'}">
        <h2>${result.name}</h2>
        <div class="side-by-side">
          <div>
            <h3>實際畫面</h3>
            <img src="${result.screenshot}" class="screenshot" />
          </div>
          ${result.baseline ? `
            <div>
              <h3>預期畫面</h3>
              <img src="${result.baseline}" class="screenshot" />
            </div>
          ` : ''}
        </div>
        
        <div class="contrast-info">
          <h3>對比度檢測</h3>
          ${this.renderContrastResults(result.contrastTests)}
        </div>
        
        <div class="interaction-log">
          <h3>互動測試紀錄</h3>
          <pre>${JSON.stringify(result.interactions, null, 2)}</pre>
        </div>
        
        <div class="issues">
          <h3>發現的問題</h3>
          <ul>
            ${result.issues.map(issue => `
              <li style="color: ${issue.severity === 'high' ? 'red' : 'orange'}">
                ${issue.description}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `).join('');
  }
}
```

#### Task 0.4: 建立 Playwright 端到端視覺測試
```typescript
// CREATE tests/e2e/importWizard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('資料匯入精靈視覺與功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設定視窗大小確保一致性
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin/organization/test-org');
  });
  
  test('階段一：資料庫選擇器視覺測試', async ({ page }) => {
    // 擷取初始狀態
    await page.screenshot({ 
      path: 'tests/screenshots/stage1-initial.png',
      fullPage: true 
    });
    
    // 測試對比度
    const titleColor = await page.evaluate(() => {
      const title = document.querySelector('.wizard-title');
      return window.getComputedStyle(title).color;
    });
    
    const bgColor = await page.evaluate(() => {
      const bg = document.querySelector('.wizard-container');
      return window.getComputedStyle(bg).backgroundColor;
    });
    
    // 驗證對比度
    const contrast = calculateContrast(titleColor, bgColor);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    
    // 測試懸停效果
    await page.hover('.database-card:first-child');
    await page.screenshot({ 
      path: 'tests/screenshots/stage1-hover.png' 
    });
    
    // 測試選中狀態
    await page.click('.database-card:first-child');
    await page.screenshot({ 
      path: 'tests/screenshots/stage1-selected.png' 
    });
    
    // 驗證下一步按鈕啟用
    const nextButton = page.locator('.next-button');
    await expect(nextButton).toBeEnabled();
    await expect(nextButton).toHaveCSS('background-color', 'rgb(44, 44, 44)');
  });
  
  test('階段二：檔案上傳視覺測試', async ({ page }) => {
    // 進入第二階段
    await page.click('.database-card:first-child');
    await page.click('.next-button');
    
    // 等待轉場動畫
    await page.waitForTimeout(500);
    
    // 擷取檔案上傳區域
    await page.screenshot({ 
      path: 'tests/screenshots/stage2-upload.png',
      fullPage: true 
    });
    
    // 測試拖放區域視覺回饋
    const uploadArea = page.locator('.file-upload-area');
    await uploadArea.dispatchEvent('dragenter');
    await page.screenshot({ 
      path: 'tests/screenshots/stage2-dragover.png' 
    });
  });
  
  test('階段三：欄位映射下拉選單測試', async ({ page }) => {
    // 快速進入第三階段
    await setupStage3(page);
    
    // 擷取初始狀態
    await page.screenshot({ 
      path: 'tests/screenshots/stage3-initial.png' 
    });
    
    // 測試下拉選單
    const dropdown = page.locator('.field-mapper select').first();
    
    // 點擊前擷取
    await page.screenshot({ 
      path: 'tests/screenshots/stage3-dropdown-before.png' 
    });
    
    // 點擊下拉選單
    await dropdown.click();
    await page.waitForTimeout(200); // 等待下拉選單動畫
    
    // 擷取展開狀態
    await page.screenshot({ 
      path: 'tests/screenshots/stage3-dropdown-open.png' 
    });
    
    // 驗證選項可見性和對比度
    const options = page.locator('.field-mapper option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    
    // 選擇一個選項
    await dropdown.selectOption({ index: 1 });
    await page.screenshot({ 
      path: 'tests/screenshots/stage3-dropdown-selected.png' 
    });
  });
  
  test('完整流程視覺記錄', async ({ page }) => {
    const screenshots = [];
    
    // 記錄每個步驟
    for (let stage = 1; stage <= 4; stage++) {
      await navigateToStage(page, stage);
      
      const screenshot = await page.screenshot({ 
        path: `tests/screenshots/flow-stage${stage}.png`,
        fullPage: true 
      });
      
      screenshots.push({
        stage,
        path: screenshot,
        timestamp: Date.now()
      });
      
      // 測試該階段的所有互動元素
      await testStageInteractions(page, stage);
    }
    
    // 產生流程報告
    await generateFlowReport(screenshots);
  });
});

// 輔助函數
async function testStageInteractions(page, stage) {
  const interactions = {
    1: ['click:.database-card', 'hover:.info-icon'],
    2: ['click:.upload-button', 'drag:.csv-file'],
    3: ['click:select', 'type:input[type="text"]'],
    4: ['click:.user-checkbox', 'change:.assignment-strategy']
  };
  
  for (const action of interactions[stage] || []) {
    const [verb, selector] = action.split(':');
    await page.screenshot({ 
      path: `tests/screenshots/stage${stage}-before-${verb}.png` 
    });
    
    switch(verb) {
      case 'click':
        await page.click(selector);
        break;
      case 'hover':
        await page.hover(selector);
        break;
      case 'type':
        await page.fill(selector, 'Test Input');
        break;
    }
    
    await page.screenshot({ 
      path: `tests/screenshots/stage${stage}-after-${verb}.png` 
    });
  }
}
```

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

## 視覺驗證命令列工具

### 建立 CLI 工具來執行視覺測試
```bash
# CREATE package.json scripts
"scripts": {
  "test:visual": "npm run test:visual:capture && npm run test:visual:compare",
  "test:visual:capture": "playwright test tests/e2e/importWizard.spec.ts --project=chromium",
  "test:visual:compare": "node scripts/compareScreenshots.js",
  "test:visual:report": "node scripts/generateVisualReport.js && open tests/reports/latest.html",
  "test:visual:update-baseline": "npm run test:visual:capture && npm run test:visual:approve",
  "test:visual:approve": "cp tests/screenshots/*.png tests/screenshots/baseline/",
  "test:visual:clean": "rm -rf tests/screenshots/*.png tests/reports/*.html"
}
```

### 截圖驗證腳本
```javascript
// CREATE scripts/visualTestRunner.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualTestRunner {
  async runTest() {
    const browser = await puppeteer.launch({
      headless: false, // 設為 false 以便查看實際操作
      devtools: true,
      slowMo: 100 // 放慢操作以便觀察
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 建立截圖目錄
    const screenshotDir = path.join(__dirname, '../tests/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const results = [];
    
    // 測試每個階段
    for (let stage = 1; stage <= 4; stage++) {
      console.log(`📸 測試階段 ${stage}...`);
      
      // 導航到頁面
      await page.goto('http://localhost:3002/admin/organization/test');
      
      // 等待頁面載入
      await page.waitForSelector('.import-wizard', { timeout: 5000 });
      
      // 擷取截圖
      const screenshotPath = path.join(screenshotDir, `stage${stage}-${Date.now()}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      // 測試互動元素
      const interactionResults = await this.testInteractions(page, stage);
      
      // 檢查對比度
      const contrastResults = await this.checkContrast(page);
      
      results.push({
        stage,
        screenshot: screenshotPath,
        interactions: interactionResults,
        contrast: contrastResults,
        timestamp: new Date().toISOString()
      });
      
      // 顯示即時結果
      console.log(`✅ 階段 ${stage} 測試完成`);
      console.log(`   截圖: ${screenshotPath}`);
      console.log(`   對比度: ${contrastResults.passed ? '✅ 通過' : '❌ 失敗'}`);
      console.log(`   互動: ${interactionResults.passed ? '✅ 正常' : '❌ 有問題'}`);
    }
    
    // 產生報告
    await this.generateReport(results);
    
    // 詢問是否繼續
    console.log('\n📋 測試完成！按 Enter 關閉瀏覽器...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    await browser.close();
  }
  
  async testInteractions(page, stage) {
    const results = { passed: true, details: [] };
    
    try {
      if (stage === 3) {
        // 特別測試下拉選單
        const selects = await page.$$('select');
        for (let i = 0; i < selects.length; i++) {
          const select = selects[i];
          
          // 擷取點擊前
          await page.screenshot({ 
            path: `tests/screenshots/select-${i}-before.png` 
          });
          
          // 點擊下拉選單
          await select.click();
          await page.waitForTimeout(200);
          
          // 擷取展開狀態
          await page.screenshot({ 
            path: `tests/screenshots/select-${i}-open.png` 
          });
          
          // 檢查選項
          const options = await select.$$('option');
          if (options.length === 0) {
            results.passed = false;
            results.details.push(`下拉選單 ${i} 沒有選項`);
          }
        }
      }
    } catch (error) {
      results.passed = false;
      results.details.push(error.message);
    }
    
    return results;
  }
  
  async checkContrast(page) {
    const results = await page.evaluate(() => {
      // 在瀏覽器中執行對比度檢查
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      function getContrast(rgb1, rgb2) {
        const l1 = getLuminance(...rgb1);
        const l2 = getLuminance(...rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }
      
      // 檢查所有文字元素
      const elements = document.querySelectorAll('*');
      const issues = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          // 解析顏色
          const colorMatch = color.match(/\d+/g);
          const bgMatch = bgColor.match(/\d+/g);
          
          if (colorMatch && bgMatch) {
            const ratio = getContrast(
              colorMatch.slice(0, 3).map(Number),
              bgMatch.slice(0, 3).map(Number)
            );
            
            if (ratio < 4.5) {
              issues.push({
                element: el.tagName + (el.className ? `.${el.className}` : ''),
                color,
                bgColor,
                ratio: ratio.toFixed(2)
              });
            }
          }
        }
      });
      
      return {
        passed: issues.length === 0,
        issues
      };
    });
    
    return results;
  }
  
  async generateReport(results) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>視覺測試報告 - ${new Date().toLocaleString('zh-TW')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .header { background: #2C2C2C; color: white; padding: 20px; }
    .stage { margin: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .stage-header { background: #f5f5f5; padding: 15px; font-size: 18px; font-weight: bold; }
    .screenshot { max-width: 100%; margin: 20px; border: 1px solid #ddd; }
    .issues { background: #fff3cd; padding: 15px; margin: 20px; border-radius: 4px; }
    .issue { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #ff9800; }
    .passed { background: #d4edda; color: #155724; }
    .failed { background: #f8d7da; color: #721c24; }
    .contrast-table { width: 100%; border-collapse: collapse; margin: 20px; }
    .contrast-table th, .contrast-table td { padding: 10px; border: 1px solid #ddd; }
    .low-contrast { background: #ffebee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 資料匯入精靈 - 視覺測試報告</h1>
    <p>測試時間: ${new Date().toLocaleString('zh-TW')}</p>
  </div>
  
  ${results.map(r => `
    <div class="stage">
      <div class="stage-header">階段 ${r.stage}</div>
      <img src="${r.screenshot}" class="screenshot" />
      
      <div class="${r.contrast.passed ? 'passed' : 'failed'}">
        對比度測試: ${r.contrast.passed ? '✅ 通過' : `❌ 失敗 (${r.contrast.issues.length} 個問題)`}
      </div>
      
      ${r.contrast.issues.length > 0 ? `
        <div class="issues">
          <h3>對比度問題：</h3>
          <table class="contrast-table">
            <tr>
              <th>元素</th>
              <th>文字顏色</th>
              <th>背景顏色</th>
              <th>對比度</th>
              <th>最低要求</th>
            </tr>
            ${r.contrast.issues.map(issue => `
              <tr class="low-contrast">
                <td>${issue.element}</td>
                <td style="color: ${issue.color}">${issue.color}</td>
                <td style="background: ${issue.bgColor}">${issue.bgColor}</td>
                <td>${issue.ratio}</td>
                <td>4.5:1</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}
      
      <div class="${r.interactions.passed ? 'passed' : 'failed'}">
        互動測試: ${r.interactions.passed ? '✅ 正常' : '❌ 有問題'}
        ${r.interactions.details.length > 0 ? `
          <ul>
            ${r.interactions.details.map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `).join('')}
</body>
</html>
    `;
    
    const reportPath = path.join(__dirname, '../tests/reports/visual-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📊 報告已產生: ${reportPath}`);
    
    // 自動開啟報告
    const { exec } = require('child_process');
    exec(`open ${reportPath}`);
  }
}

// 執行測試
if (require.main === module) {
  const runner = new VisualTestRunner();
  runner.runTest().catch(console.error);
}

module.exports = VisualTestRunner;
```

## Validation Loop

### Level 0: 視覺驗證（必須先執行）
```bash
# 啟動開發伺服器
npm run web:dev

# 在另一個終端執行視覺測試
npm run test:visual

# 測試會：
# 1. 開啟瀏覽器（你可以看到操作過程）
# 2. 擷取每個階段的截圖
# 3. 測試互動元素（特別是下拉選單）
# 4. 檢查對比度
# 5. 產生 HTML 報告並自動開啟

# 查看截圖
ls -la tests/screenshots/

# 查看報告
open tests/reports/visual-report.html
```

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

## AI 視覺驗證流程

### 使用 Read 工具查看截圖並分析
```typescript
// CREATE scripts/aiVisualAnalyzer.js
const fs = require('fs');
const path = require('path');

class AIVisualAnalyzer {
  async analyzeScreenshots() {
    const screenshotDir = 'tests/screenshots';
    const screenshots = fs.readdirSync(screenshotDir)
      .filter(f => f.endsWith('.png'))
      .sort();
    
    console.log('🤖 AI 視覺分析開始...\n');
    console.log('找到以下截圖檔案：');
    screenshots.forEach(s => console.log(`  - ${s}`));
    
    // 產生分析指令給 AI
    const analysisPrompt = `
請使用 Read 工具查看以下截圖並分析：

${screenshots.map(s => `Read: tests/screenshots/${s}`).join('\n')}

分析重點：
1. 文字是否清晰可見？
2. 背景和文字的對比度是否足夠？
3. 下拉選單是否正常顯示？
4. 按鈕是否有明確的視覺狀態？
5. 是否有任何 UI 元素重疊或錯位？

請提供每張截圖的問題清單。
    `;
    
    console.log('\n📋 分析指令：');
    console.log(analysisPrompt);
    
    // 儲存分析請求
    fs.writeFileSync('tests/screenshots/analysis-request.txt', analysisPrompt);
    console.log('\n✅ 分析請求已儲存至: tests/screenshots/analysis-request.txt');
    console.log('請在 Claude 中執行上述 Read 指令來查看截圖');
  }
  
  async compareBeforeAfter() {
    // 比對修改前後的截圖
    const pairs = [
      ['stage1-before-fix.png', 'stage1-after-fix.png'],
      ['dropdown-before.png', 'dropdown-after.png'],
      ['contrast-before.png', 'contrast-after.png']
    ];
    
    const comparisonReport = [];
    
    for (const [before, after] of pairs) {
      if (fs.existsSync(`tests/screenshots/${before}`) && 
          fs.existsSync(`tests/screenshots/${after}`)) {
        comparisonReport.push({
          before,
          after,
          prompt: `
比較這兩張截圖的差異：
1. Read: tests/screenshots/${before}
2. Read: tests/screenshots/${after}

請指出：
- 對比度改善
- 可讀性提升
- 互動元素的變化
- 任何視覺問題的修復
          `
        });
      }
    }
    
    return comparisonReport;
  }
}

module.exports = AIVisualAnalyzer;
```

### 截圖自動標記系統
```javascript
// CREATE scripts/screenshotAnnotator.js
const sharp = require('sharp');
const fs = require('fs');

class ScreenshotAnnotator {
  async annotateIssues(screenshotPath, issues) {
    // 在截圖上標記問題區域
    const image = sharp(screenshotPath);
    const metadata = await image.metadata();
    
    // 建立 SVG 標記
    const annotations = issues.map((issue, index) => {
      const { x, y, width, height, description } = issue;
      return `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="none" stroke="red" stroke-width="3" />
        <text x="${x}" y="${y - 5}" font-size="16" fill="red">
          ${index + 1}. ${description}
        </text>
      `;
    }).join('');
    
    const svg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        ${annotations}
      </svg>
    `;
    
    // 合併標記到截圖
    const annotatedPath = screenshotPath.replace('.png', '-annotated.png');
    await image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0
      }])
      .toFile(annotatedPath);
    
    console.log(`✅ 已標記截圖: ${annotatedPath}`);
    return annotatedPath;
  }
}
```

### 視覺測試執行檢查表
```markdown
# CREATE tests/visual-checklist.md

## 📸 視覺測試檢查表

### 測試前準備
- [ ] 啟動開發伺服器 `npm run web:dev`
- [ ] 確認可以訪問 http://localhost:3002
- [ ] 建立測試組織和用戶資料

### 階段 1：資料庫選擇器
- [ ] 擷取初始載入截圖
- [ ] 檢查標題文字對比度（應 >= 4.5:1）
- [ ] 檢查卡片背景色（不應為深灰色）
- [ ] 測試懸停效果截圖
- [ ] 測試選中狀態截圖
- [ ] 驗證圖標顯示正常（不是方框）

### 階段 2：檔案上傳
- [ ] 擷取上傳區域截圖
- [ ] 測試拖放視覺回饋
- [ ] 檢查按鈕對比度
- [ ] 驗證文字說明清晰

### 階段 3：欄位映射（重點測試）
- [ ] 擷取下拉選單關閉狀態
- [ ] 點擊下拉選單
- [ ] 擷取下拉選單展開狀態
- [ ] 驗證選項可見且可點擊
- [ ] 測試選擇選項後的狀態
- [ ] 檢查所有下拉選單（至少 3 個）

### 階段 4：資料分配
- [ ] 擷取用戶列表
- [ ] 測試核取方塊
- [ ] 檢查分配策略選擇器
- [ ] 驗證預覽區域

### 問題記錄
請在每個問題旁標記嚴重程度：
- 🔴 嚴重：功能無法使用
- 🟡 中等：可用但體驗差
- 🟢 輕微：美觀問題

| 階段 | 問題描述 | 嚴重度 | 截圖檔名 |
|------|----------|--------|----------|
| 1 | 標題文字太淺 | 🟡 | stage1-title.png |
| 3 | 下拉選單無法點擊 | 🔴 | stage3-dropdown-broken.png |
```

### 測試報告模板
```html
<!-- CREATE tests/reports/template.html -->
<!DOCTYPE html>
<html>
<head>
  <title>資料匯入精靈 - 視覺測試報告</title>
  <style>
    .comparison { display: flex; gap: 20px; margin: 20px 0; }
    .before-after { flex: 1; }
    .before-after img { width: 100%; border: 2px solid #ddd; }
    .before { border-color: #f44336; }
    .after { border-color: #4caf50; }
    .issue-marker { 
      position: absolute; 
      border: 3px solid red; 
      background: rgba(255,0,0,0.1);
    }
    .improvement { background: #e8f5e9; padding: 10px; margin: 10px 0; }
    .remaining-issue { background: #ffebee; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>視覺測試報告</h1>
  
  <section class="summary">
    <h2>測試摘要</h2>
    <ul>
      <li>✅ 修復問題: <span id="fixed-count">0</span></li>
      <li>⚠️ 待修復: <span id="remaining-count">0</span></li>
      <li>📸 截圖總數: <span id="screenshot-count">0</span></li>
    </ul>
  </section>
  
  <section class="comparisons">
    <!-- 動態插入比對結果 -->
  </section>
  
  <section class="ai-analysis">
    <h2>AI 視覺分析結果</h2>
    <div id="ai-feedback">
      <!-- AI 分析結果將插入這裡 -->
    </div>
  </section>
</body>
</html>
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