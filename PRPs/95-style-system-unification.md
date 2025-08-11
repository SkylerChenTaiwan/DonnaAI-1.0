# PRP-95: 樣式系統統一化改造

## Goal
統一和標準化整個專案的樣式系統，將 DesignSystem 覆蓋率從 22% 提升至 90%+，消除 2,320 處硬編碼顏色值，建立自動化遷移工具和 CSS 衝突解決機制。

## Why
- **樣式系統碎片化嚴重**: 三套樣式系統並存（StyleSheet、內聯樣式、全域 CSS）
- **維護成本高**: 2,320 處硬編碼顏色值導致主題變更需要手動修改數百個檔案
- **一致性問題**: DesignSystem 僅 22% 覆蓋率，大量元件使用不一致的樣式
- **Web 平台樣式衝突**: 5,967 行全域 CSS 會覆蓋 React Native 樣式，優先級難以控制
- **為 PRP-96/97/98 鋪路**: 元件重構前必須建立穩固的樣式基礎

## What
建立統一、可維護、高效的樣式系統，包含：

1. **自動化樣式遷移工具** - 批量轉換硬編碼樣式到 DesignSystem
2. **CSS 衝突解決機制** - Web 平台樣式優先級管理和隔離
3. **Enhanced DesignSystem** - 完整的設計 token 系統和主題支援
4. **Styled Component Factory** - 統一的樣式元件生成器
5. **樣式 Linting 規則** - 防止新的硬編碼樣式引入

### Success Criteria
- [ ] DesignSystem 覆蓋率從 22% → 90%+（使用 DesignSystem 的檔案數量）
- [ ] 硬編碼顏色值從 2,320 處 → <50 處（保留必要的品牌色等）
- [ ] 建立 CSS 優先級管理系統，解決 Web 平台樣式衝突
- [ ] 實現自動化遷移工具，能處理 80%+ 常見樣式模式
- [ ] 建立完整的設計 token 系統，支援主題切換
- [ ] 所有新程式碼強制使用 DesignSystem，ESLint 規則生效

## All Needed Context

### Documentation & References
```yaml
- url: https://styled-system.com/guides/
  why: CSS-in-JS 最佳實踐和設計系統整合方法
  
- url: https://theme-ui.com/getting-started/
  why: 設計 token 系統和主題切換的業界標準實現
  
- url: https://necolas.github.io/react-native-web/docs/styling/
  why: React Native Web 樣式系統深入理解和最佳實踐

- url: https://github.com/callstack/react-native-paper/tree/main/src/styles
  why: React Native 設計系統的成熟實現參考

- file: /src/theme/designSystem.ts
  why: 現有設計系統結構，需要大幅擴展和完善
  
- file: /src/components/database/web/styles/NotionDatabaseV2.css
  why: 全域 CSS 樣式，需要遷移到 CSS-in-JS 或隔離處理
  
- file: /src/components/users/stages/UserFileUploader.tsx (lines 1200-1373)
  why: 大型元件的樣式定義模式，遷移工具的測試案例
  
- file: /vitest.config.ts
  why: 測試設定，需要加入樣式相關測試
```

### Current Codebase tree
```bash
src/
├── theme/
│   └── designSystem.ts         # 現有設計系統（需大幅擴展）
├── components/
│   ├── database/web/styles/    # 全域 CSS 檔案（需遷移）
│   └── **/*.tsx               # 415 個元件檔案（大部分含硬編碼樣式）
└── types/                     # 型別定義（需新增樣式相關型別）
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/
├── theme/
│   ├── designSystem.ts               # 現有（需擴展）
│   ├── tokens/                       # 🆕 設計 token 定義
│   │   ├── colors.ts                # 完整色彩系統定義
│   │   ├── typography.ts            # 字體系統定義  
│   │   ├── spacing.ts               # 間距系統定義
│   │   ├── shadows.ts               # 陰影系統定義
│   │   ├── borders.ts               # 邊框系統定義
│   │   └── motion.ts                # 動畫/過渡系統定義
│   ├── themes/                       # 🆕 主題系統
│   │   ├── light.ts                 # 淺色主題
│   │   ├── dark.ts                  # 深色主題
│   │   └── index.ts                 # 主題管理器
│   ├── styled/                       # 🆕 樣式元件工廠
│   │   ├── StyledComponentFactory.ts # 統一樣式元件生成器
│   │   ├── GlobalStyles.ts          # 全域樣式管理
│   │   └── CSSPriorityManager.ts    # CSS 優先級管理器
│   └── utils/                        # 🆕 樣式工具
│       ├── styleHelpers.ts          # 樣式輔助函數
│       ├── responsiveUtils.ts       # 響應式工具
│       └── colorUtils.ts            # 顏色處理工具
├── tools/
│   ├── style-migration/              # 🆕 樣式遷移工具
│   │   ├── hardcoded-color-scanner.ts # 硬編碼顏色掃描器
│   │   ├── style-converter.ts        # 自動樣式轉換器
│   │   ├── migration-reporter.ts     # 遷移進度報告器
│   │   └── batch-processor.ts        # 批量處理器
│   └── eslint-rules/
│       ├── no-hardcoded-colors.js    # 🆕 禁止硬編碼顏色
│       ├── require-design-system.js  # 🆕 強制使用 DesignSystem
│       └── css-in-js-conventions.js  # 🆕 CSS-in-JS 規範檢查
├── types/
│   ├── theme.ts                      # 🆕 主題相關型別定義
│   ├── styled.ts                     # 🆕 樣式相關型別定義
│   └── tokens.ts                     # 🆕 設計 token 型別定義
└── tests/
    ├── theme/                        # 🆕 主題系統測試
    │   ├── tokens.test.ts           # Token 系統測試
    │   ├── themes.test.ts           # 主題切換測試
    │   └── responsive.test.ts       # 響應式測試
    └── tools/
        └── style-migration.test.ts   # 🆕 遷移工具測試
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: 全域 CSS 優先級問題
// NotionDatabaseV2.css 等全域樣式會覆蓋 React Native 樣式
// 解決方案：CSS-in-JS 使用高特異性或 !important

// CRITICAL: React Native Web 樣式轉換限制
// 某些 RN 樣式屬性在 Web 上不支援或行為不同
// 例如：elevation (Android) 需要轉換為 boxShadow (Web)

// CRITICAL: 動態主題切換的效能考量
// 大量樣式重新計算可能導致效能問題
// 使用 CSS 變數和 React.memo 優化

// CRITICAL: TypeScript 樣式型別檢查
// styled-components 需要正確的 TypeScript 配置
// DefaultTheme interface 需要擴展以支援我們的設計系統

// CRITICAL: Expo Web 的 CSS 載入順序
// 確保 styled-components 樣式載入在全域 CSS 之後
```

## Implementation Blueprint

### Data models and structure
建立完整的設計系統型別定義，確保型別安全和 IDE 支援。

```typescript
// 設計 token 基礎型別
interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  motion: MotionTokens;
}

// 主題系統型別
interface Theme extends DesignTokens {
  name: string;
  mode: 'light' | 'dark';
  cssVariables: Record<string, string>;
}

// 樣式元件 Props 型別
interface StyledProps {
  theme: Theme;
  variant?: string;
  size?: 'small' | 'medium' | 'large';
  responsive?: ResponsiveValue<any>;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立完整的設計 Token 系統
CREATE src/theme/tokens/colors.ts:
  - DEFINE 完整的色彩系統（primary, secondary, semantic colors）
  - INCLUDE 每種顏色的明暗變化 (50-900)
  - EXPORT 統一的顏色介面

CREATE src/theme/tokens/typography.ts:
  - DEFINE 字體大小、行高、字重系統
  - INCLUDE responsive typography scales
  - SUPPORT Web fonts 和 Native fonts 差異

CREATE src/theme/tokens/spacing.ts:
  - DEFINE 基於 8px 的間距系統
  - INCLUDE component-specific spacing
  - SUPPORT responsive spacing values

CREATE src/theme/tokens/shadows.ts:
  - DEFINE elevation 系統
  - CONVERT React Native shadows 到 Web CSS
  - SUPPORT platform-specific shadow rendering

CREATE src/theme/tokens/borders.ts:
  - DEFINE 邊框寬度、樣式、圓角系統
  - INCLUDE component-specific border tokens
  - SUPPORT platform differences

Task 2: 建立主題系統和切換機制
CREATE src/theme/themes/light.ts:
  - IMPLEMENT 淺色主題配置
  - USE 設計 tokens 組合
  - GENERATE CSS 變數對應

CREATE src/theme/themes/dark.ts:
  - IMPLEMENT 深色主題配置
  - MAINTAIN 與淺色主題的對等性
  - OPTIMIZE 深色模式下的可讀性

CREATE src/theme/themes/index.ts:
  - IMPLEMENT 主題管理器
  - PROVIDE 主題切換邏輯
  - HANDLE 主題持久化

CREATE src/hooks/useTheme.ts:
  - IMPLEMENT React hook 供元件使用主題
  - SUPPORT 主題切換 context
  - OPTIMIZE re-render 效能

Task 3: 建立樣式元件工廠和 CSS 管理
CREATE src/theme/styled/StyledComponentFactory.ts:
  - IMPLEMENT 統一的 styled-components 生成器
  - SUPPORT variant 系統 (primary, secondary 等)
  - INTEGRATE 響應式設計

CREATE src/theme/styled/GlobalStyles.ts:
  - IMPLEMENT 全域樣式管理器
  - REPLACE 現有 CSS 檔案功能
  - HANDLE CSS reset 和基礎樣式

CREATE src/theme/styled/CSSPriorityManager.ts:
  - IMPLEMENT CSS 優先級管理機制
  - RESOLVE 全域 CSS 衝突
  - PROVIDE 樣式隔離工具

Task 4: 開發自動化樣式遷移工具
CREATE tools/style-migration/hardcoded-color-scanner.ts:
  - SCAN 整個 codebase 尋找硬編碼顏色值
  - GENERATE 遷移報告
  - SUGGEST 對應的 DesignSystem token

CREATE tools/style-migration/style-converter.ts:
  - IMPLEMENT AST-based 程式碼轉換
  - CONVERT 硬編碼樣式到 DesignSystem 引用
  - HANDLE 複雜的樣式物件轉換

CREATE tools/style-migration/migration-reporter.ts:
  - TRACK 遷移進度
  - GENERATE 詳細報告
  - IDENTIFY 無法自動轉換的案例

CREATE tools/style-migration/batch-processor.ts:
  - BATCH 處理多個檔案
  - SUPPORT rollback 機制
  - INTEGRATE Git workflow

Task 5: 建立樣式相關 ESLint 規則
CREATE tools/eslint-rules/no-hardcoded-colors.js:
  - DETECT 硬編碼顏色值使用
  - SUGGEST DesignSystem 替代方案
  - PROVIDE auto-fix 功能

CREATE tools/eslint-rules/require-design-system.js:
  - ENFORCE DesignSystem 使用
  - DETECT 直接 StyleSheet.create 使用
  - RECOMMEND styled-components 替代

CREATE tools/eslint-rules/css-in-js-conventions.js:
  - ENFORCE CSS-in-JS 最佳實踐
  - CHECK naming conventions
  - VALIDATE theme token 使用

MODIFY .eslintrc.js:
  - ADD 新的樣式相關規則
  - SET 適當的錯誤等級
  - CONFIGURE 忽略模式

Task 6: 遷移關鍵檔案作為示範
MIGRATE src/theme/designSystem.ts:
  - REFACTOR 使用新的 token 系統
  - MAINTAIN 向後相容性
  - ADD 新的 Web 支援功能

MIGRATE src/components/database/web/styles/NotionDatabaseV2.css:
  - CONVERT CSS 到 styled-components
  - ELIMINATE 全域樣式衝突
  - USE 設計 tokens

MIGRATE 5-10 high-impact components:
  - SELECT 使用頻率最高的元件
  - APPLY 自動遷移工具
  - VERIFY 功能和視覺一致性

Task 7: 建立測試和驗證系統
CREATE src/tests/theme/tokens.test.ts:
  - TEST 所有 design tokens 完整性
  - VERIFY color contrast ratios
  - VALIDATE responsive values

CREATE src/tests/theme/themes.test.ts:
  - TEST 主題切換功能
  - VERIFY CSS variables 生成
  - CHECK 主題持久化

CREATE src/tests/tools/style-migration.test.ts:
  - TEST 自動遷移工具準確性
  - VERIFY 複雜案例處理
  - CHECK rollback 功能

MODIFY vitest.config.ts:
  - ADD styled-components 測試支援
  - CONFIGURE theme provider wrapper
  - SETUP visual regression for themes
```

### Per task pseudocode as needed added to each task

```typescript
// Task 1: Colors Token 系統偽代碼
// src/theme/tokens/colors.ts
export const colorTokens = {
  primary: {
    50: '#f0f9ff',   // 最淺
    500: '#3b82f6',  // 標準藍
    900: '#1e3a8a',  // 最深
  },
  semantic: {
    success: { light: '#10b981', dark: '#059669' },
    warning: { light: '#f59e0b', dark: '#d97706' },
    error: { light: '#ef4444', dark: '#dc2626' },
  },
  // CRITICAL: 維持與現有 DesignSystem.colors 的相容性
  gray: { /* 從現有 DesignSystem 擴展 */ },
};

// Task 2: 主題系統偽代碼
// src/theme/themes/index.ts
export class ThemeManager {
  private currentTheme: Theme = lightTheme;
  
  switchTheme(themeName: string): void {
    // PATTERN: 使用 React Context 廣播主題變更
    this.currentTheme = this.getTheme(themeName);
    this.notifyListeners();
    // CRITICAL: 更新 CSS 變數到 document.documentElement
    this.updateCSSVariables();
  }
  
  private updateCSSVariables(): void {
    // 更新全域 CSS 變數以支援 styled-components
    Object.entries(this.currentTheme.cssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }
}

// Task 3: Styled Component Factory 偽代碼
// src/theme/styled/StyledComponentFactory.ts
export const createStyledComponent = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
  baseStyles: StyleFunction,
  variants?: VariantConfig
) => {
  return styled(tag)<StyledProps>`
    // PATTERN: 基礎樣式注入
    ${baseStyles}
    
    // PATTERN: variant 系統
    ${props => variants?.[props.variant || 'default']?.(props)}
    
    // PATTERN: 響應式支援
    ${props => handleResponsiveProps(props)}
    
    // CRITICAL: 高優先級確保覆蓋全域 CSS
    && { /* 提高 CSS 特異性 */ }
  `;
};

// Task 4: 自動遷移工具偽代碼
// tools/style-migration/style-converter.ts
export class StyleConverter {
  async convertFile(filePath: string): Promise<ConversionResult> {
    const sourceCode = await readFile(filePath, 'utf8');
    const ast = parse(sourceCode, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    
    // PATTERN: AST 遍歷和轉換
    traverse(ast, {
      ObjectProperty(path) {
        if (this.isColorProperty(path)) {
          // CRITICAL: 硬編碼顏色轉換為 DesignSystem 引用
          const designSystemRef = this.findMatchingToken(path.node.value);
          if (designSystemRef) {
            path.node.value = t.identifier(designSystemRef);
          }
        }
      }
    });
    
    return {
      transformedCode: generate(ast).code,
      changes: this.changes,
      warnings: this.warnings
    };
  }
}
```

### Integration Points
```yaml
DESIGN_SYSTEM:
  - migrate: existing DesignSystem.ts to use new token system
  - extend: add Web-specific tokens and utilities
  - maintain: backward compatibility for existing components

STYLED_COMPONENTS:
  - integrate: theme provider at app root level
  - configure: TypeScript support for theme typing
  - optimize: bundle size and runtime performance

ESLINT:
  - add: style-related rules to existing configuration
  - integrate: with existing lint workflow
  - configure: auto-fix capabilities where possible

BUILD_SYSTEM:
  - modify: build process to handle CSS-in-JS
  - optimize: style extraction and bundling
  - support: hot reloading for theme changes

TESTING:
  - extend: existing test setup with theme providers
  - add: visual regression testing for themes
  - integrate: style linting into CI pipeline
```

## Validation Loop

### Level 1: Token System Validation
```bash
# 驗證設計 token 系統完整性
npm run test src/tests/theme/tokens.test.ts

# 檢查 TypeScript 型別檢查
npm run type-check

# 驗證 ESLint 規則運作
npm run lint

# 預期: 所有 tokens 定義完整，型別檢查通過，無 linting 錯誤
```

### Level 2: 遷移工具驗證
```bash
# 執行硬編碼顏色掃描
node tools/style-migration/hardcoded-color-scanner.ts

# 測試自動轉換工具
npm run test tools/style-migration/style-converter.test.ts

# 執行批量遷移（小範圍測試）
node tools/style-migration/batch-processor.ts --dry-run --limit 5

# 預期: 工具能正確識別和轉換常見樣式模式
```

### Level 3: 主題系統測試
```bash
# 測試主題切換功能
npm run test src/tests/theme/themes.test.ts

# 建構並測試 Web 版本
npm run web:build

# 手動測試主題切換
npm run web:preview

# 預期: 主題切換順暢，CSS 變數正確更新，無視覺錯誤
```

### Level 4: 整合測試
```bash
# 執行完整測試套件
npm run test

# 檢查樣式 linting 規則效果
npm run lint -- --fix

# 建構生產版本
npm run web:build

# 預期: 所有測試通過，新的 linting 規則生效，建構成功
```

## Final validation Checklist
- [ ] 所有 design tokens 定義完整且型別安全
- [ ] 主題切換系統運作正常，支援持久化
- [ ] 自動遷移工具能處理 80%+ 常見樣式模式
- [ ] ESLint 規則生效，防止新的硬編碼樣式
- [ ] DesignSystem 覆蓋率達到 90%+ 
- [ ] 硬編碼顏色值減少到 <50 處
- [ ] CSS 優先級管理系統解決全域樣式衝突
- [ ] 至少 10 個關鍵元件完成遷移並功能正常
- [ ] 所有測試通過，包含主題和樣式相關測試
- [ ] 文檔完整，包含遷移指南和最佳實踐

---

## Anti-Patterns to Avoid
- ❌ 不要一次性遷移所有元件，採用漸進式方法
- ❌ 不要破壞現有 DesignSystem 的向後相容性
- ❌ 不要忽略效能影響，大量動態樣式可能導致卡頓
- ❌ 不要跳過 TypeScript 型別定義，會失去開發時的智能提示
- ❌ 不要忽略 accessibility，確保色彩對比度符合標準
- ❌ 不要在主題切換時重新載入整個應用，影響用戶體驗

**Confidence Score: 9/10** - 基於深入的現有程式碼分析，包含完整的自動化工具和測試策略。採用漸進式遷移方法，風險可控，預期能顯著改善開發體驗和維護性。