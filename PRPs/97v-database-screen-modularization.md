# PRP-97: 資料庫介面元件模組化重構

## Goal
重構 `DatabaseScreen.tsx`（1,674 行）為高效能、可擴展、跨平台一致的資料庫管理介面，運用前三個 PRP 建立的架構基礎，實現 Notion 風格的現代化資料庫操作體驗。

## Why
- **巨型元件難維護**: 1,674 行單一檔案，包含表格渲染、編輯、搜尋、篩選等複雜功能
- **效能問題嚴重**: 大量資料渲染導致 UI 卡頓，缺乏虛擬化和最佳化
- **跨平台體驗不一致**: Web 和 Mobile 介面差異大，用戶學習成本高
- **全域 CSS 衝突**: 5,967 行 NotionDatabase CSS 與 React Native 樣式衝突
- **使用者核心功能**: 資料庫是用戶最常使用的功能，體驗影響產品成功
- **技術債務累積**: 多次修補導致程式碼結構混亂，新功能開發困難

## What
建立現代化、高效能、跨平台一致的資料庫介面系統：

1. **表格虛擬化系統** - 支援大量資料的高效能渲染
2. **Notion-style 互動體驗** - 內聯編輯、拖拽排序、快捷鍵支援
3. **響應式設計系統** - 統一的 Mobile-first 到 Desktop 的適配
4. **模組化元件架構** - 可組合、可測試、可擴展的元件設計
5. **狀態管理最佳化** - 使用 Context + Reducer 管理複雜狀態
6. **完整的無障礙支援** - 鍵盤導航、螢幕閱讀器相容

### Success Criteria
- [ ] 主元件行數從 1,674 行 → <400 行
- [ ] 拆分為 15-20 個職責清晰的子元件
- [ ] 虛擬化支援 10,000+ 資料列的流暢滾動
- [ ] 跨平台 UI 一致性 >95%（視覺回歸測試）
- [ ] 載入效能提升 50%，記憶體使用減少 40%
- [ ] 測試覆蓋率 >95%，包含複雜的使用者互動情境
- [ ] 完整移除全域 CSS 依賴，使用統一樣式系統

## All Needed Context

### Documentation & References
```yaml
- url: https://tanstack.com/table/v8/docs/guide/introduction
  why: TanStack Table 最佳實踐，強大的表格狀態管理和虛擬化
  
- url: https://react-window.vercel.app/
  why: React Window 虛擬化實現，大量資料的效能優化
  
- url: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role
  why: 資料網格的無障礙標準實現
  
- url: https://www.notion.so/
  why: Notion 資料庫 UX 參考，現代資料庫介面的最佳實踐

- file: /src/screens/database/DatabaseScreen.tsx
  why: 當前實現，1,674 行巨型元件，核心重構對象
  critical: 表格渲染邏輯、編輯功能、狀態管理、樣式定義
  
- file: /src/components/database/notion/NotionTable.tsx (1,295 lines)
  why: 現有 Notion 風格表格實現，需要整合和優化
  
- file: /src/components/database/web/styles/NotionDatabaseV2.css
  why: 5,967 行全域 CSS，需要遷移到 CSS-in-JS
  
- file: /src/components/adaptive/ (PRP-94)
  why: 跨平台統一介面，替代 Platform.OS 判斷
  
- file: /src/theme/styled/StyledComponentFactory.ts (PRP-95)
  why: 統一樣式系統，替代硬編碼樣式和全域 CSS

- file: /src/tests/services/import/AssignmentEngine.test.ts
  why: 測試模式參考，複雜邏輯的測試覆蓋方法
```

### Current Codebase tree
```bash
src/
├── screens/database/
│   ├── DatabaseScreen.tsx              # 1,674 行巨型元件（主要重構目標）
│   └── DatabaseScreen.backup.tsx      # 1,344 行備份檔案
├── components/database/
│   ├── notion/
│   │   ├── NotionTable.tsx            # 1,295 行表格元件（需要整合）
│   │   └── TableHeader.tsx            # 7 處 Platform.OS 判斷
│   └── web/styles/
│       ├── NotionDatabaseV2.css       # 5,967 行全域 CSS（需要遷移）
│       └── NotionTableV2.css          # 額外樣式檔案
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/screens/database/
├── DatabaseScreen.tsx                  # 🔄 主要協調元件 (<400 行)
└── components/                         # 🆕 資料庫相關元件
    ├── index.ts                       # 統一匯出點
    ├── layout/                        # 🆕 佈局元件
    │   ├── DatabaseLayout.tsx         # 主要佈局容器
    │   ├── Toolbar.tsx               # 工具列（搜尋、篩選、新增）
    │   ├── ViewSelector.tsx          # 檢視切換器（表格、看板等）
    │   └── BulkActions.tsx           # 批量操作列
    ├── table/                         # 🆕 表格核心元件
    │   ├── VirtualizedTable.tsx      # 虛擬化表格容器
    │   ├── TableHeader.tsx           # 表格標題列
    │   ├── TableRow.tsx              # 資料列元件
    │   ├── TableCell.tsx             # 單元格元件
    │   └── ColumnResizer.tsx         # 欄位寬度調整器
    ├── editing/                       # 🆕 編輯功能元件
    │   ├── InlineEditor.tsx          # 內聯編輯器
    │   ├── CellEditor.tsx            # 單元格編輯器
    │   ├── FieldTypeEditor.tsx       # 欄位類型編輯器
    │   └── BulkEditor.tsx            # 批量編輯器
    ├── filters/                       # 🆕 篩選和搜尋元件
    │   ├── FilterPanel.tsx           # 篩選面板
    │   ├── SearchBar.tsx             # 搜尋列
    │   ├── SortControls.tsx          # 排序控制器
    │   └── FilterChips.tsx           # 篩選標籤顯示
    ├── modals/                        # 🆕 模態對話框元件
    │   ├── RecordModal.tsx           # 記錄詳細檢視
    │   ├── AddRecordModal.tsx        # 新增記錄對話框
    │   ├── ColumnConfigModal.tsx     # 欄位設定對話框
    │   └── ExportModal.tsx           # 匯出對話框
    ├── hooks/                         # 🆕 自定義 Hooks
    │   ├── useDatabaseData.ts        # 資料載入和快取
    │   ├── useTableVirtualization.ts # 虛擬化邏輯
    │   ├── useInlineEditing.ts       # 內聯編輯狀態管理
    │   ├── useColumnResize.ts        # 欄位寬度管理
    │   ├── useFiltersAndSort.ts      # 篩選和排序邏輯
    │   └── useKeyboardNavigation.ts  # 鍵盤導航
    ├── context/                       # 🆕 Context Providers
    │   ├── DatabaseContext.tsx       # 資料庫狀態管理
    │   ├── TableContext.tsx          # 表格配置管理
    │   └── EditingContext.tsx        # 編輯狀態管理
    ├── utils/                         # 🆕 工具函數
    │   ├── dataProcessing.ts         # 資料處理工具
    │   ├── tableCalculations.ts      # 表格計算邏輯
    │   ├── exportHelpers.ts          # 匯出功能
    │   ├── keyboardShortcuts.ts      # 快捷鍵處理
    │   └── accessibility.ts          # 無障礙工具
    ├── types/                         # 🆕 型別定義
    │   ├── database.ts               # 資料庫相關型別
    │   ├── table.ts                  # 表格相關型別
    │   ├── editing.ts                # 編輯相關型別
    │   └── filters.ts                # 篩選相關型別
    ├── styles/                        # 🆕 樣式系統
    │   ├── DatabaseStyles.ts         # 主要樣式（取代 CSS 檔案）
    │   ├── TableStyles.ts            # 表格樣式
    │   └── animations.ts             # 動畫效果
    └── __tests__/                     # 🆕 測試檔案
        ├── DatabaseScreen.test.tsx   # 整合測試
        ├── table/                    # 表格元件測試
        ├── editing/                  # 編輯功能測試
        ├── hooks/                    # Hook 測試
        └── utils/                    # 工具函數測試
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: TanStack Table 虛擬化在 React Native Web 的限制
// 需要自定義 virtualizer，Web 和 Native 實現不同
// Web: 使用 react-window，Native: 使用 FlatList

// CRITICAL: 大量資料的狀態管理效能問題
// 避免在每次 re-render 時重新計算所有資料
// 使用 useMemo、useCallback 和 React.memo 最佳化

// CRITICAL: 內聯編輯的焦點管理複雜性
// Web: 需要處理 Tab 順序和 focus trap
// Native: TextInput 焦點管理與虛擬化的衝突

// CRITICAL: NotionDatabase CSS 的深層選擇器問題
// 全域 CSS 使用 !important 和深層巢狀選擇器
// 遷移到 CSS-in-JS 時需要保持視覺一致性

// CRITICAL: Firebase Firestore 的即時更新處理
// 大量資料的即時同步可能導致效能問題
// 需要實現智能的增量更新和樂觀更新

// CRITICAL: 響應式設計的斷點管理
// 不同螢幕尺寸下表格的行為差異很大
// Mobile: 卡片式檢視，Tablet: 簡化表格，Desktop: 完整表格
```

## Implementation Blueprint

### Data models and structure
建立完整的資料庫管理型別系統，支援複雜的表格操作。

```typescript
// 資料庫狀態管理型別
interface DatabaseState {
  data: DatabaseRecord[];
  schema: TableSchema;
  view: ViewConfig;
  editing: EditingState;
  filters: FilterState;
  selection: SelectionState;
  ui: UIState;
}

// 表格配置型別
interface TableConfig {
  columns: ColumnDefinition[];
  virtualization: VirtualizationConfig;
  editing: EditingConfig;
  accessibility: AccessibilityConfig;
}

// Hook 返回值型別
interface UseDatabaseReturn {
  state: DatabaseState;
  actions: DatabaseActions;
  computed: ComputedValues;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立新的元件結構和型別系統
CREATE src/screens/database/components/ directory structure:
  - SETUP 完整的目錄結構
  - PREPARE TypeScript 配置和匯出

CREATE src/screens/database/components/types/:
  - DEFINE database.ts 核心資料庫型別
  - DEFINE table.ts 表格相關型別
  - DEFINE editing.ts 編輯狀態型別
  - DEFINE filters.ts 篩選和搜尋型別
  - ENSURE 與現有型別系統的相容性

CREATE src/screens/database/components/index.ts:
  - EXPORT 所有公共元件和 hooks
  - MAINTAIN API 相容性

Task 2: 建立核心 Context 和狀態管理
CREATE src/screens/database/components/context/DatabaseContext.tsx:
  - IMPLEMENT 使用 useReducer 的複雜狀態管理
  - HANDLE 資料載入、快取、同步
  - PROVIDE 最佳化的 Context 分割避免不必要重渲染

CREATE src/screens/database/components/context/TableContext.tsx:
  - MANAGE 表格配置、欄位設定、檢視狀態
  - HANDLE 虛擬化參數和效能設定
  - SUPPORT 多種檢視模式（表格、卡片、看板）

CREATE src/screens/database/components/context/EditingContext.tsx:
  - MANAGE 編輯狀態、驗證、錯誤處理
  - IMPLEMENT 樂觀更新和衝突解決
  - SUPPORT 批量編輯和 undo/redo

Task 3: 建立核心 Hooks
CREATE src/screens/database/components/hooks/useDatabaseData.ts:
  - IMPLEMENT 資料載入、分頁、快取策略
  - HANDLE Firebase 即時同步和離線支援
  - OPTIMIZE 大量資料的載入效能

CREATE src/screens/database/components/hooks/useTableVirtualization.ts:
  - IMPLEMENT 跨平台虛擬化邏輯
  - HANDLE Web (react-window) 和 Native (FlatList) 差異
  - OPTIMIZE 大量資料的渲染效能

CREATE src/screens/database/components/hooks/useInlineEditing.ts:
  - MANAGE 內聯編輯狀態和驗證
  - HANDLE 編輯模式切換和焦點管理
  - IMPLEMENT 自動儲存和錯誤恢復

CREATE src/screens/database/components/hooks/useFiltersAndSort.ts:
  - IMPLEMENT 複雜的篩選邏輯和排序算法
  - HANDLE 多欄位排序和自定義篩選器
  - OPTIMIZE 大量資料的篩選效能

CREATE src/screens/database/components/hooks/useKeyboardNavigation.ts:
  - IMPLEMENT 完整的鍵盤導航支援
  - HANDLE Tab 順序、快捷鍵、無障礙支援
  - SUPPORT 表格內的方向鍵導航

Task 4: 建立核心表格元件（使用 Adaptive Components）
CREATE src/screens/database/components/table/VirtualizedTable.tsx:
  - USE AdaptiveView 替代 div/View 判斷
  - IMPLEMENT 高效能虛擬化渲染
  - HANDLE 動態列高和複雜佈局
  - ADD 滾動優化和記憶體管理

CREATE src/screens/database/components/table/TableHeader.tsx:
  - USE Adaptive Components 統一跨平台實現
  - IMPLEMENT 欄位排序、調整大小、重新排序
  - ADD 欄位篩選和設定功能
  - SUPPORT 黏性標題和響應式調整

CREATE src/screens/database/components/table/TableRow.tsx:
  - IMPLEMENT 行級別的狀態管理和優化
  - HANDLE 選取、編輯、拖拽功能
  - ADD hover 效果和視覺回饋
  - SUPPORT 無障礙的行導航

CREATE src/screens/database/components/table/TableCell.tsx:
  - IMPLEMENT 多種資料類型的顯示和編輯
  - USE Adaptive Components 處理平台差異
  - ADD 內聯編輯和驗證功能
  - SUPPORT 自定義渲染器

Task 5: 建立編輯功能元件
CREATE src/screens/database/components/editing/InlineEditor.tsx:
  - IMPLEMENT 無縫的內聯編輯體驗
  - HANDLE 不同資料類型的編輯器
  - ADD 驗證、錯誤顯示、自動完成
  - OPTIMIZE 編輯效能和響應性

CREATE src/screens/database/components/editing/CellEditor.tsx:
  - PROVIDE 多種欄位類型的專用編輯器
  - HANDLE 日期、數字、選項、文字等類型
  - ADD 格式化和驗證功能
  - SUPPORT 自定義編輯器擴展

CREATE src/screens/database/components/editing/BulkEditor.tsx:
  - IMPLEMENT 批量編輯功能
  - HANDLE 多行選取和批量操作
  - ADD 進度追蹤和錯誤處理
  - SUPPORT 復原和重做操作

Task 6: 建立樣式系統（遷移 CSS 到 styled-components）
CREATE src/screens/database/components/styles/DatabaseStyles.ts:
  - MIGRATE NotionDatabaseV2.css 到 styled-components
  - USE StyledComponentFactory 和 DesignSystem tokens
  - ELIMINATE 全域 CSS 依賴和 !important 規則
  - ADD 響應式設計和主題支援

CREATE src/screens/database/components/styles/TableStyles.ts:
  - MIGRATE 表格相關 CSS 到 CSS-in-JS
  - IMPLEMENT 虛擬化元件的樣式優化
  - ADD 動畫和過渡效果
  - OPTIMIZE 渲染效能

CREATE src/screens/database/components/styles/animations.ts:
  - DEFINE 表格互動動畫
  - IMPLEMENT 平滑的排序、篩選、編輯過渡
  - ADD 載入狀態和進度指示器
  - OPTIMIZE 動畫效能

Task 7: 建立篩選和搜尋系統
CREATE src/screens/database/components/filters/FilterPanel.tsx:
  - IMPLEMENT 進階篩選介面
  - SUPPORT 多種篩選條件和邏輯運算子
  - ADD 儲存和載入篩選器預設
  - OPTIMIZE 大量資料的篩選效能

CREATE src/screens/database/components/filters/SearchBar.tsx:
  - IMPLEMENT 全文搜尋和即時搜尋
  - ADD 搜尋建議和自動完成
  - SUPPORT 欄位特定搜尋
  - OPTIMIZE 搜尋效能和使用者體驗

Task 8: 重構主要協調元件
REFACTOR src/screens/database/DatabaseScreen.tsx:
  - REDUCE 主元件到 <400 行
  - USE 新建立的 Context Providers 和元件
  - ELIMINATE 所有直接的資料處理邏輯
  - MAINTAIN 現有 API 和路由相容性

IMPLEMENT responsive layout strategy:
  - DEFINE 斷點和佈局規則
  - HANDLE Mobile/Tablet/Desktop 的不同檢視模式
  - OPTIMIZE 跨裝置的使用者體驗

Task 9: 建立完整測試覆蓋
CREATE comprehensive test suites:
  - TEST 所有 Context Providers 和狀態管理
  - TEST 虛擬化和效能關鍵路徑
  - TEST 內聯編輯和複雜使用者互動
  - INCLUDE 無障礙功能測試

CREATE integration tests:
  - TEST 完整的資料庫操作流程
  - VERIFY Firebase 同步和衝突解決
  - TEST 跨元件的資料流和狀態管理
  - INCLUDE 效能基準測試

CREATE visual regression tests:
  - TEST 表格渲染的視覺一致性
  - VERIFY 響應式佈局在不同裝置上的顯示
  - TEST 動畫和過渡效果
  - INCLUDE 主題切換的視覺測試

Task 10: 效能優化和最終整合
IMPLEMENT performance optimizations:
  - ADD React.memo 到所有效能關鍵元件
  - OPTIMIZE Context 使用避免不必要重渲染
  - IMPLEMENT 智能的資料分頁和延遲載入
  - ADD bundle splitting 和 code lazy loading

INTEGRATE with existing systems:
  - VERIFY 與其他頁面和元件的整合
  - TEST 資料匯入/匯出功能相容性
  - ENSURE 權限系統和多租戶支援

PERFORMANCE benchmarking:
  - MEASURE 載入時間、記憶體使用、渲染效能
  - COMPARE 重構前後的效能指標
  - VERIFY 大量資料的處理能力
  - OPTIMIZE 基於實際效能數據
```

### Per task pseudocode as needed added to each task

```typescript
// Task 2: DatabaseContext 核心邏輯偽代碼
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(databaseReducer, initialState);
  
  // PATTERN: 分割 Context 避免不必要的重渲染
  const dataContext = useMemo(() => ({
    data: state.data,
    loading: state.loading,
    error: state.error
  }), [state.data, state.loading, state.error]);
  
  const actionsContext = useMemo(() => ({
    loadData: (params: LoadParams) => dispatch({ type: 'LOAD_DATA', params }),
    updateRecord: (id: string, changes: Partial<Record>) => {
      // CRITICAL: 樂觀更新 + Firebase 同步
      dispatch({ type: 'UPDATE_RECORD_OPTIMISTIC', id, changes });
      return syncToFirebase(id, changes);
    },
    // ... 其他 actions
  }), []);
  
  return (
    <DatabaseDataContext.Provider value={dataContext}>
      <DatabaseActionsContext.Provider value={actionsContext}>
        {children}
      </DatabaseActionsContext.Provider>
    </DatabaseDataContext.Provider>
  );
};

// Task 3: useTableVirtualization Hook 偽代碼
export const useTableVirtualization = (data: Record[], config: VirtualizationConfig) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    // Web: 使用 react-window
    return useWebVirtualization(data, config);
  } else {
    // Native: 使用優化的 FlatList
    return useNativeVirtualization(data, config);
  }
};

const useWebVirtualization = (data: Record[], config: VirtualizationConfig) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.estimatedRowHeight,
    // CRITICAL: 最佳化虛擬化參數
    overscan: 5,
    measureElement: config.dynamicHeight ? measureElement : undefined,
  });
  
  return { parentRef, rowVirtualizer, virtualItems: rowVirtualizer.getVirtualItems() };
};

// Task 4: TableCell 適配元件偽代碼
const TableCell: React.FC<TableCellProps> = ({ 
  value, 
  column, 
  editing, 
  onChange 
}) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  return (
    <AdaptiveView style={cellStyles.container}>
      {editing ? (
        // PATTERN: 根據欄位類型選擇編輯器
        <CellEditor 
          type={column.type} 
          value={value} 
          onChange={onChange}
          // 平台自適應配置
          config={platformAdapter.isWeb ? webEditorConfig : nativeEditorConfig}
        />
      ) : (
        <CellDisplay value={value} type={column.type} />
      )}
    </AdaptiveView>
  );
};

// Task 6: 樣式遷移偽代碼
// DatabaseStyles.ts - 取代 NotionDatabaseV2.css
export const TableContainer = createStyledComponent('div', ({ theme }) => `
  width: 100%;
  height: 100%;
  background-color: ${theme.colors.background.primary};
  font-family: ${theme.typography.fontFamily};
  
  /* CRITICAL: 高特異性覆蓋全域 CSS */
  && {
    .table-header {
      background-color: ${theme.colors.background.surface};
      border-bottom: 1px solid ${theme.colors.border.light};
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .table-row {
      border-bottom: 1px solid ${theme.colors.border.light};
      transition: background-color ${theme.transitions.fast}ms ease;
      
      &:hover {
        background-color: ${theme.colors.background.hover};
      }
    }
  }
`);
```

### Integration Points
```yaml
ADAPTIVE_COMPONENTS:
  - use: 所有 PRP-94 建立的跨平台元件
  - replace: 現有的 Platform.OS 判斷和原生 HTML 元素
  - maintain: 一致的跨平台體驗

STYLED_COMPONENTS:
  - migrate: 5,967 行 CSS 到 CSS-in-JS
  - use: PRP-95 的 StyledComponentFactory 和 design tokens
  - eliminate: 全域 CSS 依賴和樣式衝突

EXISTING_COMPONENTS:
  - integrate: 現有 NotionTable.tsx 的功能
  - maintain: API 相容性避免破壞其他使用者
  - enhance: 效能和跨平台一致性

FIREBASE_INTEGRATION:
  - optimize: 即時資料同步效能
  - implement: 衝突解決和離線支援
  - maintain: 現有權限和安全規則
```

## Validation Loop

### Level 1: Architecture and Performance Validation
```bash
# 驗證型別系統和架構完整性
npm run type-check

# 檢查新的樣式系統（無硬編碼顏色、CSS 衝突）
npm run lint -- --rule no-hardcoded-colors
npm run lint -- --rule require-design-system

# 效能基準測試（與重構前比較）
npm run test:performance -- --component DatabaseScreen --baseline

# 預期: 無 TypeScript 錯誤，效能提升 50%，記憶體減少 40%
```

### Level 2: Component and Integration Tests  
```bash
# 執行所有新元件的單元測試
npm run test src/screens/database/components/__tests__/

# 執行 Context 和 Hook 測試
npm run test src/screens/database/components/__tests__/hooks/
npm run test src/screens/database/components/__tests__/context/

# 執行整合測試
npm run test src/screens/database/components/__tests__/DatabaseScreen.test.tsx

# 預期: 測試覆蓋率 >95%，所有複雜互動情境通過
```

### Level 3: Visual Regression and Cross-platform Testing
```bash
# 執行視覺回歸測試
npm run test:visual -- --update-snapshots --component DatabaseScreen

# 執行跨平台一致性測試
npm run test:platform -- --component DatabaseScreen

# 執行無障礙功能測試
npm run test:a11y -- --component DatabaseScreen

# 預期: 視覺一致性 >95%，無障礙標準符合 WCAG 2.1
```

### Level 4: End-to-End User Experience Testing
```bash
# 建構並啟動測試環境
npm run web:build
npm run web:preview

# 手動測試關鍵使用者流程:
# - 大量資料載入和虛擬化滾動
# - 內聯編輯和批量操作
# - 篩選、排序、搜尋功能
# - 響應式佈局在不同裝置的表現
# - 鍵盤導航和快捷鍵

# 效能監控
npm run analyze:bundle -- --component DatabaseScreen

# 預期: 所有功能流暢運作，無效能瓶頸，bundle size 最佳化
```

## Final validation Checklist
- [ ] 主元件行數從 1,674 → <400 行，拆分為 15-20 個子元件
- [ ] 虛擬化支援 10,000+ 資料列的流暢滾動
- [ ] 載入效能提升 50%，記憶體使用減少 40%
- [ ] 完全移除 5,967 行全域 CSS，使用統一樣式系統
- [ ] 跨平台 UI 一致性 >95%（視覺回歸測試驗證）
- [ ] 測試覆蓋率 >95%，包含複雜使用者互動情境
- [ ] 完整的無障礙支援，符合 WCAG 2.1 標準
- [ ] 鍵盤導航和快捷鍵完全運作
- [ ] Firebase 即時同步效能最佳化，衝突解決機制完善
- [ ] 響應式設計在 Mobile/Tablet/Desktop 完美適配

---

## Anti-Patterns to Avoid
- ❌ 不要一次性替換所有表格功能，採用漸進式遷移策略
- ❌ 不要忽略虛擬化的複雜性，大量資料渲染需要精心設計
- ❌ 不要破壞現有的 Firebase 查詢和同步邏輯
- ❌ 不要忽略無障礙功能，資料表格需要完整的鍵盤支援
- ❌ 不要跳過效能測試，資料庫介面的效能直接影響使用者體驗
- ❌ 不要忽略邊界情況，如網路錯誤、衝突解決、資料驗證

**Confidence Score: 7/10** - 這是最複雜的重構任務，涉及大量效能優化和跨平台適配。基於前三個 PRP 的基礎設施，有信心完成，但需要仔細的階段性實施和測試驗證。