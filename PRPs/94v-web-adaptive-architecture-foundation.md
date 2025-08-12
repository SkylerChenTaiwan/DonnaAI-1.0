# PRP-94: Web 跨平台統一抽象層架構基礎建設

## Goal
建立統一抽象層架構基礎設施，解決當前 253 處原生 HTML 標籤混用和 265 處分散 Platform.OS 判斷的架構問題，為後續大規模重構奠定堅實基礎。

## Why
- **技術債務危機**: 253 處原生 HTML 標籤 + 265 處 Platform.OS 判斷導致維護成本指數級增長
- **開發體驗劣化**: 每次功能變更都可能破壞跨平台相容性 
- **程式碼重複率高**: DesignSystem 覆蓋率僅 22%，大量硬編碼樣式（2,320 處）
- **測試覆蓋不足**: 缺乏跨平台相容性和視覺回歸測試框架
- **為 Phase 2 重構鋪路**: `UserFileUploader.tsx`（1,373 行）等大檔案重構的前提

## What
建立統一抽象層架構的核心基礎設施，包含：

1. **Adaptive Components 庫** - 平台無關的抽象元件
2. **Enhanced DesignSystem** - Web 平台樣式適配器擴展
3. **Platform Adapter Pattern** - 集中化跨平台邏輯管理
4. **Visual Regression Testing** - 自動化視覺測試框架
5. **Development Tooling** - 架構合規性檢查工具

### Success Criteria
- [ ] 建立 20+ 核心 Adaptive Components，覆蓋 80% 常用場景
- [ ] DesignSystem Web 適配器完成，支援 CSS-in-JS 轉換
- [ ] Visual regression testing 框架運行，支援跨平台截圖對比
- [ ] ESLint 規則強制新程式碼使用 Adaptive Components
- [ ] Platform.OS 集中化率從分散 → 少於 5 個檔案包含直接判斷
- [ ] 所有新建元件通過跨平台相容性測試

## All Needed Context

### Documentation & References
```yaml
- url: https://necolas.github.io/react-native-web/docs/
  why: React Native Web 最佳實踐和 CSS-in-JS 適配模式
  
- url: https://testing-library.com/docs/react-testing-library/intro/
  why: 元件測試的標準方法和最佳實踐
  
- url: https://storybook.js.org/docs/react/writing-stories/introduction
  why: 元件隔離開發和視覺測試的業界標準

- url: https://github.com/storybookjs/test-runner
  why: Visual regression testing 自動化執行方案

- file: /src/theme/designSystem.ts
  why: 現有 DesignSystem 結構，需要擴展 Web 支援

- file: /src/components/users/stages/UserFileUploader.tsx (lines 523, 570, 623, 870)
  why: 現有跨平台判斷模式，需要抽象化重構的典型案例

- file: /vitest.config.ts
  why: 現有測試架構，需要整合視覺回歸測試

- file: /package.json
  why: 依賴管理和建構腳本擴展點
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── common/           # 現有通用元件
│   ├── users/           # 用戶相關元件（包含待重構檔案）
│   └── database/        # 資料庫元件
├── theme/
│   └── designSystem.ts  # 現有設計系統
├── tests/               # Vitest 測試
└── types/               # TypeScript 型別定義
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/
├── components/
│   ├── adaptive/                    # 🆕 統一抽象層核心
│   │   ├── index.ts                # 統一匯出點
│   │   ├── core/                   # 核心適配元件
│   │   │   ├── AdaptiveView.tsx    # 替換 View/div 的統一容器
│   │   │   ├── AdaptiveText.tsx    # 跨平台文字元件
│   │   │   ├── AdaptiveButton.tsx  # 統一按鈕元件
│   │   │   ├── AdaptiveInput.tsx   # 表單輸入統一介面
│   │   │   └── AdaptiveSelect.tsx  # 下拉選單跨平台實現
│   │   ├── layout/                 # 佈局元件
│   │   │   ├── FlexContainer.tsx   # Flexbox 佈局抽象
│   │   │   └── GridContainer.tsx   # Grid 佈局適配器
│   │   └── platform/               # 平台適配器
│   │       ├── PlatformAdapter.ts  # 平台判斷邏輯集中管理
│   │       ├── WebStyleAdapter.ts  # Web CSS-in-JS 適配器
│   │       └── NativeStyleAdapter.ts # React Native 樣式適配器
├── theme/
│   ├── designSystem.ts             # 現有（需擴展）
│   ├── webTheme.ts                 # 🆕 Web 平台主題適配器
│   ├── webStyles.ts                # 🆕 Web CSS-in-JS 轉換器
│   └── platformTokens.ts           # 🆕 跨平台設計 token 定義
├── tests/
│   ├── visual/                     # 🆕 視覺回歸測試
│   │   ├── setup.ts               # Storybook + Playwright 設定
│   │   ├── screenshots/           # 基準截圖儲存
│   │   └── components/            # 元件視覺測試
│   └── platform/                  # 🆕 跨平台相容性測試
│       ├── adaptive-components.test.tsx  # 適配元件測試套件
│       └── platform-parity.test.tsx     # 平台對等性測試
└── tools/                          # 🆕 開發工具
    ├── eslint-rules/               # 自定義 ESLint 規則
    │   └── enforce-adaptive-components.js # 強制使用適配元件
    └── visual-testing/             # 視覺測試工具
        └── screenshot-generator.ts # 自動截圖生成器
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: React Native Web CSS 優先級問題
// 全域 CSS（如 NotionDatabaseV4.css）會覆蓋 React Native 樣式
// 解決方案：使用 !important 或內聯樣式提高優先級

// CRITICAL: Platform.OS 在 SSR 環境判斷錯誤
// Web 首次渲染可能返回 undefined，需要 useEffect 處理

// CRITICAL: Expo SDK 53 的依賴限制
// @testing-library/react-native 版本需要與 React Native 版本匹配
// 當前使用 "react-native": "0.79.5"

// CRITICAL: Firebase 模擬在測試環境的設定
// vi.mock 必須在檔案頂部，且需要 vi.hoisted() 處理初始化順序

// CRITICAL: 樣式在 Web 平台的差異
// React Native: { shadowColor: '#000', shadowRadius: 4 }
// Web CSS: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
```

## Implementation Blueprint

### Data models and structure
建立跨平台適配的型別定義，確保型別安全和一致性。

```typescript
// 平台適配器介面定義
interface PlatformAdapter {
  isWeb: boolean;
  isNative: boolean;
  getStyleAdapter(): StyleAdapter;
}

// 統一樣式介面
interface AdaptiveStyleProps {
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
}

// 元件適配器基底類別
interface AdaptiveComponentProps extends AdaptiveStyleProps {
  children?: React.ReactNode;
  testID?: string;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立平台適配器核心架構
CREATE src/components/adaptive/platform/PlatformAdapter.ts:
  - IMPLEMENT 單例模式的平台檢測邏輯
  - CENTRALIZE 所有 Platform.OS 判斷到此檔案
  - PROVIDE isWeb, isNative, isMobile 等便利方法

CREATE src/components/adaptive/platform/WebStyleAdapter.ts:
  - IMPLEMENT CSS-in-JS 轉換邏輯
  - HANDLE React Native 樣式到 Web CSS 的映射
  - SUPPORT DesignSystem token 轉換

CREATE src/components/adaptive/platform/NativeStyleAdapter.ts:
  - IMPLEMENT React Native StyleSheet 適配器
  - OPTIMIZE StyleSheet.create 的使用
  - MAINTAIN 與現有樣式系統的相容性

Task 2: 擴展 DesignSystem Web 支援
MODIFY src/theme/designSystem.ts:
  - ADD webTokens 物件，包含 CSS 變數定義
  - EXTEND colors, spacing, typography 支援 CSS 格式
  - MAINTAIN 向後相容性

CREATE src/theme/webTheme.ts:
  - IMPLEMENT CSS-in-JS 主題物件
  - PROVIDE CSS 變數生成器
  - SUPPORT 動態主題切換

CREATE src/theme/webStyles.ts:
  - IMPLEMENT React Native 到 CSS 的轉換函數
  - HANDLE 特殊屬性映射（shadowColor -> boxShadow）
  - PROVIDE 樣式優先級管理

Task 3: 建立核心 Adaptive Components
CREATE src/components/adaptive/core/AdaptiveView.tsx:
  - REPLACE View/div 的統一容器實現
  - HANDLE 跨平台樣式適配
  - SUPPORT 所有 ViewProps 和基礎 HTML 屬性

CREATE src/components/adaptive/core/AdaptiveText.tsx:
  - UNIFY Text 元件跨平台實現
  - HANDLE Web 的 typography CSS 轉換
  - SUPPORT DesignSystem typography tokens

CREATE src/components/adaptive/core/AdaptiveButton.tsx:
  - REPLACE TouchableOpacity/button 的統一實現
  - IMPLEMENT hover, focus, active 狀態管理
  - FOLLOW DesignSystem button variants

CREATE src/components/adaptive/core/AdaptiveInput.tsx:
  - UNIFY TextInput/input 的跨平台實現
  - HANDLE 表單狀態和驗證
  - SUPPORT 所有常用輸入型別

CREATE src/components/adaptive/core/AdaptiveSelect.tsx:
  - IMPLEMENT 跨平台下拉選單
  - SOLVE 當前 UserFileUploader.tsx 中 select 元素問題
  - PROVIDE 一致的 API 和樣式

Task 4: 建立視覺回歸測試框架
CREATE src/tests/visual/setup.ts:
  - INSTALL @storybook/test-runner, playwright
  - CONFIGURE 跨瀏覽器截圖對比
  - SETUP 基準截圖管理流程

CREATE src/tests/visual/components/adaptive-components.stories.tsx:
  - WRITE Storybook stories for all adaptive components
  - COVER 各種 props 組合和狀態
  - INCLUDE responsive 測試案例

CREATE src/tests/platform/adaptive-components.test.tsx:
  - IMPLEMENT 跨平台功能對等性測試
  - VERIFY 每個 adaptive component 在各平台行為一致
  - COVER edge cases 和錯誤處理

Task 5: 建立開發工具和合規檢查
CREATE tools/eslint-rules/enforce-adaptive-components.js:
  - IMPLEMENT ESLint 規則禁止直接使用原生元素
  - SUGGEST 對應的 adaptive component 替代
  - PROVIDE 自動修復建議

MODIFY .eslintrc.js:
  - ADD 自定義規則到 ESLint 設定
  - ENFORCE adaptive component 使用
  - SET 錯誤等級為 error

CREATE tools/visual-testing/screenshot-generator.ts:
  - AUTOMATE 基準截圖生成
  - SUPPORT 批次處理多個元件
  - INTEGRATE CI/CD 流程

Task 6: 整合測試和驗證
MODIFY vitest.config.ts:
  - ADD visual testing 支援
  - CONFIGURE screenshot 比對閾值
  - SETUP 測試報告生成

CREATE package.json scripts:
  - ADD "test:visual" script for visual regression tests
  - ADD "test:platform" script for cross-platform compatibility
  - ADD "build:adaptive" script for adaptive components bundle

Task 7: 文檔和遷移指南
CREATE docs/adaptive-components-guide.md:
  - DOCUMENT adaptive components 使用方法
  - PROVIDE 遷移指南從原生元素到 adaptive
  - INCLUDE best practices 和 troubleshooting

CREATE src/components/adaptive/README.md:
  - EXPLAIN 架構設計理念和使用原則
  - PROVIDE API 文檔和範例程式碼
  - DOCUMENT 擴展新 adaptive components 的流程
```

### Per task pseudocode as needed added to each task

```typescript
// Task 1: Platform Adapter 核心實現
// PlatformAdapter.ts 偽代碼
class PlatformAdapter {
  private static instance: PlatformAdapter;
  
  static getInstance(): PlatformAdapter {
    // 單例模式實現
  }
  
  get isWeb(): boolean {
    // CRITICAL: 處理 SSR 環境的 Platform.OS undefined
    return Platform.OS === 'web';
  }
  
  getStyleAdapter(): StyleAdapter {
    // 根據平台返回對應的樣式適配器
    return this.isWeb ? new WebStyleAdapter() : new NativeStyleAdapter();
  }
}

// Task 2: DesignSystem Web 擴展偽代碼
// webTheme.ts 核心邏輯
export const createWebTheme = (tokens: DesignTokens) => {
  return {
    // 轉換 DesignSystem tokens 到 CSS 變數
    cssVars: generateCSSVariables(tokens),
    // 提供 styled-components theme
    styledTheme: convertToStyledTheme(tokens),
    // CSS-in-JS 物件
    cssInJS: generateCSSInJS(tokens)
  };
};

// Task 3: AdaptiveView 核心實現偽代碼
const AdaptiveView: React.FC<AdaptiveViewProps> = ({ style, webStyle, nativeStyle, children, ...props }) => {
  const platformAdapter = PlatformAdapter.getInstance();
  const styleAdapter = platformAdapter.getStyleAdapter();
  
  // 合併跨平台樣式
  const adaptedStyle = styleAdapter.adaptStyle(style, platformAdapter.isWeb ? webStyle : nativeStyle);
  
  if (platformAdapter.isWeb) {
    // Web: 返回 div 元素
    return <div style={adaptedStyle} {...props}>{children}</div>;
  } else {
    // Native: 返回 View 元件
    return <View style={adaptedStyle} {...props}>{children}</View>;
  }
};

// Task 4: 視覺回歸測試偽代碼
// visual testing setup
describe('Adaptive Components Visual Tests', () => {
  it('should match baseline screenshots across platforms', async () => {
    // PATTERN: 使用 Playwright 截圖對比
    const component = render(<AdaptiveButton title="Test Button" />);
    const screenshot = await page.screenshot();
    
    // CRITICAL: 設定合理的像素差異閾值
    expect(screenshot).toMatchSnapshot('adaptive-button-baseline.png', { threshold: 0.02 });
  });
});
```

### Integration Points
```yaml
DESIGN_SYSTEM:
  - extend: src/theme/designSystem.ts
  - add: webTokens, cssVariables generation
  - maintain: backward compatibility with existing components

ESLINT:
  - add: custom rules to tools/eslint-rules/
  - modify: .eslintrc.js configuration
  - enforce: adaptive components usage

TESTING:
  - integrate: visual testing with Vitest
  - add: Playwright for screenshot comparison
  - extend: existing test patterns

BUILD_SCRIPTS:
  - modify: package.json with new test scripts
  - add: visual testing pipeline
  - integrate: CI/CD compatibility checks
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# 執行基本檢查，修復語法和樣式問題
npm run type-check                    # TypeScript 檢查
npm run lint                          # ESLint 檢查（包含新的自定義規則）
npm run format:check                  # Prettier 格式檢查

# 預期: 無錯誤。如有錯誤，閱讀錯誤訊息並修復
```

### Level 2: Unit Tests
```bash
# 執行適配元件單元測試
npm run test src/tests/platform/adaptive-components.test.tsx

# 執行平台對等性測試
npm run test:platform

# 預期: 所有測試通過，覆蓋率達到 80% 以上
# 如果失敗: 檢查錯誤，理解根本原因，修復代碼，重新執行（避免為了通過而 mock）
```

### Level 3: Visual Regression Tests
```bash
# 執行視覺回歸測試
npm run test:visual

# 生成基準截圖（首次執行）
npm run test:visual -- --update-snapshots

# 預期: 視覺測試通過，無意外的 UI 變化
# 如果失敗: 檢查 diff 圖片，確認是預期變更還是回歸問題
```

### Level 4: Integration Test
```bash
# 建構 Web 版本並測試
npm run web:build

# 測試 adaptive components 在實際應用中的運行
npm run web:preview

# 手動檢查關鍵頁面載入
# 預期: 無控制台錯誤，UI 顯示正常，跨平台一致性良好
```

## Final validation Checklist
- [ ] 所有測試通過: `npm run test`
- [ ] 無 linting 錯誤: `npm run lint`  
- [ ] 無 TypeScript 錯誤: `npm run type-check`
- [ ] 視覺測試通過: `npm run test:visual`
- [ ] 跨平台相容性測試通過: `npm run test:platform`
- [ ] 至少 20 個核心 adaptive components 實現完成
- [ ] ESLint 規則生效，禁止新代碼使用原生元素
- [ ] DesignSystem Web 適配器運作正常
- [ ] 文檔完整，包含遷移指南
- [ ] Web 版本建構成功且功能正常

---

## Anti-Patterns to Avoid
- ❌ 不要在 adaptive components 中直接使用 Platform.OS 判斷
- ❌ 不要跳過視覺測試，UI 回歸問題難以察覺
- ❌ 不要忽略現有元件的向後相容性
- ❌ 不要在樣式轉換中丟失 DesignSystem tokens
- ❌ 不要為了通過測試而降低視覺對比閾值
- ❌ 不要在未完成基礎架構時就開始大檔案重構

**Confidence Score: 8/10** - 架構設計完整，基於現有代碼庫深入分析，包含完整的測試策略和驗證流程。風險控制良好，採用漸進式實施方法。