# PRP-75: 實作 Notion 資料庫缺失的核心功能

## 執行摘要
根據開源 Notion 克隆專案的研究，實作我們目前缺少的核心資料庫功能：過濾、排序、分組和搜尋。

## 背景與動機
### 現況問題
- 功能按鈕（過濾、排序、群組、搜尋）只有 UI，沒有實際功能
- 相比開源專案如 NocoDB、Teable、AppFlowy，我們缺少許多基礎功能
- 使用者無法有效管理和查看大量資料

### 目標
- 實作完整的過濾、排序、分組功能
- 讓搜尋功能真正可用
- 為未來的進階功能（關聯、匯總、公式）打下基礎

## 功能對比分析

### 開源專案功能對比
| 功能 | 我們的實作 | NocoDB | Teable | AppFlowy | duongdev/notion-table |
|------|-----------|---------|---------|----------|---------------------|
| 過濾 | ❌ 只有按鈕 | ✅ 完整 | ✅ 完整 | 🟡 基礎 | ✅ 複合過濾 |
| 排序 | ❌ 只有按鈕 | ✅ 多層 | ✅ 多層 | ✅ 基礎 | ✅ 基礎 |
| 分組 | ❌ 只有按鈕 | ✅ 支援 | ✅ 支援 | 🟡 開發中 | ❌ 無 |
| 搜尋 | ❌ 只有按鈕 | ✅ 全文 | ✅ 全文 | ✅ 基礎 | ❌ 無 |
| 關聯 | ❌ 無 | ✅ 完整 | ✅ 完整 | 🟡 開發中 | ❌ 無 |
| 匯總 | ❌ 無 | ✅ 完整 | ✅ 完整 | ❌ 無 | ❌ 無 |
| 公式 | ❌ 無 | ✅ 完整 | ✅ 完整 | 🟡 開發中 | ❌ 無 |
| 聚合 | ❌ 無 | ✅ 完整 | ✅ PostgreSQL | 🟡 基礎 | ❌ 無 |
| 分頁 | ❌ 無 | ✅ 支援 | ✅ 支援 | ✅ 支援 | ❌ 無 |
| 多視圖 | ❌ 只有表格 | ✅ 多種 | ✅ 多種 | ✅ 表格/看板 | ❌ 只有表格 |

## 所需上下文

### 文檔和參考資料
```yaml
# 必讀 - 在上下文窗口中包含這些
- url: https://github.com/duongdev/notion-table
  why: 複合過濾器實作參考，支援多層嵌套過濾
  
- url: https://github.com/nocodb/nocodb
  why: 完整的資料庫功能實作，包括過濾、排序、聚合
  
- url: https://tanstack.com/table/latest/docs/guide/filtering
  why: TanStack Table 過濾功能文檔
  
- url: https://tanstack.com/table/latest/docs/guide/sorting
  why: TanStack Table 排序功能文檔

- url: https://tanstack.com/table/latest/docs/guide/grouping
  why: TanStack Table 分組功能文檔

- file: /Users/skyler/coding/DonnaAI-1.0/src/components/database/notion/NotionTable.tsx
  why: 現有表格元件，需要整合新功能
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/services/firebase/
  why: Firebase 查詢模式，了解資料獲取方式
```

### 當前程式碼結構
```bash
src/components/database/notion/
├── NotionTable.tsx              # 主表格元件
├── managers/
│   └── KeyboardNavigationManager.tsx
├── editors/                     # 各種編輯器
├── hooks/
│   └── useCellStateMachine.ts
└── types.ts                     # 類型定義
```

### 期望的程式碼結構（新增檔案）
```bash
src/components/database/notion/
├── NotionTable.tsx              # 更新：整合過濾/排序/分組
├── managers/
│   ├── KeyboardNavigationManager.tsx
│   ├── FilterManager.tsx        # 新增：過濾邏輯管理
│   ├── SortManager.tsx          # 新增：排序邏輯管理
│   └── GroupManager.tsx         # 新增：分組邏輯管理
├── components/
│   ├── FilterPanel.tsx          # 新增：過濾面板 UI
│   ├── SortPanel.tsx            # 新增：排序面板 UI
│   ├── GroupPanel.tsx           # 新增：分組面板 UI
│   └── SearchBar.tsx            # 新增：搜尋欄 UI
├── hooks/
│   ├── useCellStateMachine.ts
│   ├── useFilter.ts             # 新增：過濾 Hook
│   ├── useSort.ts               # 新增：排序 Hook
│   └── useGroup.ts              # 新增：分組 Hook
└── types.ts                     # 更新：新增相關類型
```

### 已知注意事項
```typescript
// 關鍵：Firebase 查詢限制
// - Firestore 複合查詢有限制，需要建立索引
// - 排序和過濾可能需要在客戶端執行
// - 大量資料需要考慮分頁

// 關鍵：React Native Web 相容性
// - 某些 UI 元件需要跨平台相容
// - 使用 Platform.OS 檢查平台

// 關鍵：效能考量
// - 過濾/排序大量資料時需要 useMemo
// - 虛擬滾動需要維持
```

## 實作藍圖

### 資料模型和結構

```typescript
// 過濾器類型定義
interface Filter {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: any;
  isActive: boolean;
}

type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'date_is' | 'date_before' | 'date_after';

interface FilterGroup {
  id: string;
  operator: 'and' | 'or';
  filters: (Filter | FilterGroup)[];
}

// 排序類型定義
interface Sort {
  columnKey: string;
  direction: 'asc' | 'desc';
  priority: number; // 支援多層排序
}

// 分組類型定義
interface Group {
  columnKey: string;
  collapsed: Set<string>; // 收合的組別 ID
}

// 搜尋類型定義
interface SearchConfig {
  query: string;
  columns: string[]; // 要搜尋的欄位
  caseSensitive: boolean;
}
```

### 實作任務列表（按順序）

```yaml
Task 1: 建立類型定義
MODIFY src/components/database/notion/types.ts:
  - ADD Filter, FilterOperator, FilterGroup types
  - ADD Sort, Group, SearchConfig types
  - ADD FilterPanelProps, SortPanelProps interfaces

Task 2: 實作 FilterManager
CREATE src/components/database/notion/managers/FilterManager.tsx:
  - IMPLEMENT applyFilters function
  - SUPPORT nested filter groups (AND/OR logic)
  - HANDLE different data types (text, number, date, select)
  - OPTIMIZE with memoization

Task 3: 實作 FilterPanel UI
CREATE src/components/database/notion/components/FilterPanel.tsx:
  - BUILD filter builder interface
  - SUPPORT adding/removing filters
  - IMPLEMENT operator selection per column type
  - ADD filter group nesting (up to 2 levels)

Task 4: 實作 SortManager
CREATE src/components/database/notion/managers/SortManager.tsx:
  - IMPLEMENT multi-level sorting
  - PRESERVE stable sort order
  - HANDLE null/undefined values

Task 5: 實作 SortPanel UI
CREATE src/components/database/notion/components/SortPanel.tsx:
  - BUILD sort configuration interface
  - SUPPORT drag-and-drop for priority
  - ADD ascending/descending toggle

Task 6: 實作 GroupManager
CREATE src/components/database/notion/managers/GroupManager.tsx:
  - IMPLEMENT data grouping logic
  - CALCULATE group aggregations (count, sum, etc.)
  - HANDLE group expand/collapse state

Task 7: 實作 SearchBar
CREATE src/components/database/notion/components/SearchBar.tsx:
  - BUILD search input with debouncing
  - HIGHLIGHT search results
  - SUPPORT column-specific search

Task 8: 整合到 NotionTable
MODIFY src/components/database/notion/NotionTable.tsx:
  - INTEGRATE FilterManager, SortManager, GroupManager
  - ADD state management for filters/sorts/groups
  - UPDATE toolbar buttons to open panels
  - APPLY transformations to data before rendering

Task 9: 建立 Hooks
CREATE src/components/database/notion/hooks/useFilter.ts:
CREATE src/components/database/notion/hooks/useSort.ts:
CREATE src/components/database/notion/hooks/useGroup.ts:
  - EXTRACT reusable logic
  - PROVIDE clean API for components
```

### 偽代碼實作細節

```typescript
// Task 2: FilterManager 核心邏輯
class FilterManager {
  applyFilters(data: any[], filters: FilterGroup): any[] {
    return data.filter(row => this.evaluateFilterGroup(row, filters));
  }

  private evaluateFilterGroup(row: any, group: FilterGroup): boolean {
    const results = group.filters.map(filter => {
      if ('filters' in filter) {
        // 遞迴處理嵌套組
        return this.evaluateFilterGroup(row, filter);
      }
      return this.evaluateFilter(row, filter);
    });

    return group.operator === 'and' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  private evaluateFilter(row: any, filter: Filter): boolean {
    const value = row[filter.columnKey];
    
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).toLowerCase()
          .includes(String(filter.value).toLowerCase());
      // ... 其他操作符
    }
  }
}

// Task 4: SortManager 核心邏輯
class SortManager {
  applySort(data: any[], sorts: Sort[]): any[] {
    // 複製陣列避免修改原始資料
    const sorted = [...data];
    
    // 從低優先級到高優先級排序
    const sortedSorts = [...sorts].sort((a, b) => b.priority - a.priority);
    
    return sorted.sort((a, b) => {
      for (const sort of sortedSorts) {
        const aVal = a[sort.columnKey];
        const bVal = b[sort.columnKey];
        
        // 處理 null/undefined
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return sort.direction === 'asc' ? 1 : -1;
        if (bVal == null) return sort.direction === 'asc' ? -1 : 1;
        
        // 比較值
        let comparison = 0;
        if (typeof aVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = aVal - bVal;
        }
        
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }
}
```

### 整合點
```yaml
UI 更新:
  - NotionTable toolbar 按鈕點擊開啟對應面板
  - 面板使用 Portal 渲染在表格上方
  - 顯示當前啟用的過濾/排序/分組數量

狀態管理:
  - 使用 useReducer 管理複雜狀態
  - 儲存過濾/排序/分組配置到 localStorage
  - 支援配置的匯入/匯出

效能優化:
  - 使用 useMemo 快取過濾/排序結果
  - 大數據集時顯示載入指示器
  - 虛擬滾動保持不變
```

## 驗證循環

### Level 1: 語法和樣式
```bash
# TypeScript 編譯檢查
npm run tsc --noEmit

# ESLint 檢查
npm run lint

# 格式化檢查
npm run prettier --check "src/components/database/notion/**/*.{ts,tsx}"
```

### Level 2: 單元測試
```typescript
// 測試過濾邏輯
describe('FilterManager', () => {
  test('applies simple filter correctly', () => {
    const data = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 }
    ];
    const filter = {
      id: '1',
      columnKey: 'age',
      operator: 'greater_than' as const,
      value: 26,
      isActive: true
    };
    const result = filterManager.applyFilters(data, {
      id: 'root',
      operator: 'and',
      filters: [filter]
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
  });

  test('handles nested filter groups', () => {
    // 測試 AND/OR 邏輯組合
  });
});

// 測試排序邏輯
describe('SortManager', () => {
  test('sorts by multiple columns', () => {
    const data = [
      { name: 'Alice', age: 25, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' },
      { name: 'Charlie', age: 30, city: 'NYC' }
    ];
    const sorts = [
      { columnKey: 'age', direction: 'asc', priority: 1 },
      { columnKey: 'name', direction: 'desc', priority: 2 }
    ];
    const result = sortManager.applySort(data, sorts);
    expect(result[0].name).toBe('Bob'); // age 25, name B
    expect(result[1].name).toBe('Alice'); // age 25, name A
    expect(result[2].name).toBe('Charlie'); // age 30
  });
});
```

### Level 3: 整合測試
```bash
# 啟動開發環境
npm start

# 測試過濾功能
# 1. 點擊過濾按鈕
# 2. 新增過濾條件：狀態 = "完成"
# 3. 確認表格只顯示符合條件的資料

# 測試排序功能
# 1. 點擊排序按鈕
# 2. 設定按日期降序排序
# 3. 確認資料順序正確

# 測試搜尋功能
# 1. 在搜尋欄輸入關鍵字
# 2. 確認結果即時更新
# 3. 確認關鍵字高亮顯示
```

## 最終驗證清單
- [ ] 過濾功能正常運作，支援多種操作符
- [ ] 排序功能支援多層排序
- [ ] 分組功能可展開/收合
- [ ] 搜尋功能有防抖和高亮
- [ ] 所有功能可組合使用
- [ ] 效能良好（1000+ 筆資料流暢）
- [ ] 跨平台相容（Web/iOS/Android）
- [ ] 配置可儲存/載入

## 反模式避免
- ❌ 不要在每次渲染時重新過濾/排序資料
- ❌ 不要直接修改原始資料陣列
- ❌ 不要忽略 null/undefined 值的處理
- ❌ 不要在 Firebase 做複雜查詢（客戶端處理）
- ❌ 不要阻塞 UI（使用 Web Worker 處理大數據）

## 未來擴展
完成這些基礎功能後，可以繼續實作：
1. **Relations & Rollups** - 資料庫間的關聯
2. **Formulas** - 計算欄位
3. **Aggregations** - 聚合函數（總和、平均等）
4. **多視圖** - Gallery、Board、Calendar、Timeline
5. **條件格式化** - 根據值改變樣式
6. **匯入/匯出** - CSV、JSON 格式
7. **API 存取** - RESTful API
8. **即時協作** - 多人同時編輯

## 實作信心評分：9/10

### 評分理由
- (+) 有明確的開源參考實作
- (+) TanStack Table 提供良好的文檔
- (+) 功能拆分清晰，可逐步實作
- (+) 現有架構支援擴展
- (-) Firebase 查詢限制需要客戶端處理

### 建議
1. 先實作過濾和排序（最常用）
2. 使用 TanStack Table 的核心邏輯
3. UI 參考 duongdev/notion-table
4. 注意效能，大數據集需優化

---

*PRP-75 | 建立日期：2025-08-02 | 預估時間：5-7天 | 優先級：高*