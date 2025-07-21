name: "資料庫頁面功能和 UI 改進"
description: |

## Purpose
改進資料庫頁面的使用者體驗，實作詳細資料檢視、優化多選功能、改善 UI 空間利用，並均分 Tab 寬度。

## Core Principles
1. **Context is King**: 包含所有必要的文件、範例和注意事項
2. **Validation Loops**: 提供可執行的測試讓 AI 可以執行和修復
3. **Information Dense**: 使用程式碼庫中的關鍵字和模式
4. **Progressive Success**: 從簡單開始，驗證，然後增強
5. **Global rules**: 確保遵循 CLAUDE.md 中的所有規則

---

## Goal
改進資料庫頁面的功能和使用者介面，實現：
1. 點擊任何一列資料開啟詳細資料頁面，顯示該項目的所有欄位資料及相關聯的其他資料
2. 優化多選功能，勾選框僅在點擊多選按鈕後出現，並顯示批量操作功能欄
3. 優化 UI 空間利用，將工具列圖示與搜尋欄合併到同一行
4. 均分客戶、紀錄、任務 Tab 的寬度

## Why
- **提升使用效率**: 減少頁面切換，快速查看和編輯詳細資料
- **改善使用體驗**: 更清晰的介面佈局，更直覺的操作流程
- **節省螢幕空間**: 優化版面配置，顯示更多有用資訊
- **批量操作支援**: 提高業務人員處理大量資料的效率

## What
使用者可見行為和技術需求：
- 點擊表格任一行開啟詳細資料視圖（Modal 或新頁面）
- 多選模式下顯示勾選框和批量操作工具列
- 工具列圖示與搜尋框整合在同一行
- Tab 均勻分配寬度
- 篩選條件顯示在獨立行（僅在有篩選時顯示）

### Success Criteria
- [ ] 點擊資料行可開啟詳細檢視，顯示所有欄位和相關資料
- [ ] 多選按鈕切換勾選框的顯示/隱藏
- [ ] 批量操作工具列顯示當前選中欄位的編輯選項
- [ ] 工具列與搜尋框在同一行，節省垂直空間
- [ ] Tab 寬度均分，視覺平衡
- [ ] 篩選條件清晰顯示，可快速清除

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /src/screens/database/DatabaseScreen.tsx
  why: 主要修改目標，包含工具列、Tab 和表格整合
  
- file: /src/components/common/DataTable.tsx
  why: 表格元件實作，需要修改多選行為和行點擊處理
  
- file: /src/hooks/useTableData.ts
  why: 表格狀態管理，包含選擇、篩選邏輯
  
- file: /src/types/navigation.ts
  why: 需要新增詳細檢視路由定義
  
- file: /src/navigation/AppNavigator.tsx
  why: 新增詳細檢視頁面到導航堆疊

- file: /src/components/common/ActionModal.tsx
  why: 可重用的 Modal 元件模式

- url: https://reactnavigation.org/docs/modal
  why: React Navigation Modal 實作模式

- docfile: ARCHITECTURE.md
  why: 專案架構和設計規範，確保一致性
```

### Current Codebase tree
```bash
src/
├── screens/
│   ├── database/
│   │   └── DatabaseScreen.tsx      # 資料庫主頁面
│   ├── customers/
│   │   └── CustomersScreen.tsx     # 客戶列表頁面
├── components/
│   ├── common/
│   │   ├── DataTable.tsx          # 通用表格元件
│   │   ├── SearchBar.tsx          # 搜尋框元件
│   │   └── ActionModal.tsx        # 動作選單 Modal
├── hooks/
│   └── useTableData.ts            # 表格資料管理 Hook
├── types/
│   ├── navigation.ts              # 導航類型定義
│   └── table.ts                   # 表格類型定義
└── navigation/
    ├── AppNavigator.tsx           # 主導航器
    └── MainTabNavigator.tsx       # Tab 導航器
```

### Desired Codebase tree with files to be added
```bash
src/
├── screens/
│   ├── database/
│   │   ├── DatabaseScreen.tsx      # 資料庫主頁面（修改）
│   │   ├── CustomerDetailScreen.tsx # 新增：客戶詳細頁面
│   │   ├── RecordDetailScreen.tsx   # 新增：紀錄詳細頁面
│   │   └── TaskDetailScreen.tsx     # 新增：任務詳細頁面
├── components/
│   ├── common/
│   │   ├── DataTable.tsx          # 修改：條件顯示勾選框
│   │   ├── SearchBar.tsx          # 保持原樣
│   │   ├── ToolbarIcons.tsx       # 新增：工具列圖示元件
│   │   ├── FilterBadge.tsx        # 新增：篩選條件顯示
│   │   └── BulkEditModal.tsx      # 新增：批量編輯 Modal
│   └── database/
│       ├── DetailSection.tsx       # 新增：詳細資料區塊元件
│       └── RelatedData.tsx         # 新增：相關資料顯示元件
```

### Known Gotchas
```typescript
// CRITICAL: React Navigation 需要在類型定義中預先聲明路由
// Example: 必須在 navigation.ts 中定義所有新路由

// CRITICAL: FlashList 在動態改變 item 高度時可能有問題
// Solution: 使用 estimatedItemSize 並在多選模式改變時刷新

// CRITICAL: TouchableOpacity 在 Android 上可能與 checkbox 衝突
// Solution: 使用 hitSlop 或分離點擊區域

// WARNING: 狀態更新可能導致不必要的重渲染
// Solution: 使用 useCallback 和 React.memo 優化性能
```

## Implementation Blueprint

### Data models and structure

```typescript
// 擴展導航類型定義 (types/navigation.ts)
export type RootStackParamList = {
  // ... existing routes
  CustomerDetail: { customerId: string };
  RecordDetail: { recordId: string };
  TaskDetail: { taskId: string };
};

// 批量編輯操作類型
export interface BulkEditAction {
  field: string;
  value: any;
  label: string;
}

// 工具列配置類型
export interface ToolbarConfig {
  showFilter: boolean;
  showSort: boolean;
  showMultiSelect: boolean;
  showColumns: boolean;
  activeFilters: FilterCondition[];
}
```

### List of tasks to be completed

```yaml
Task 1: 建立詳細檢視頁面基礎架構
CREATE src/screens/database/CustomerDetailScreen.tsx:
  - MIRROR pattern from: src/screens/customers/CustomersScreen.tsx
  - USE Layout component for consistent styling
  - IMPLEMENT back navigation
  - ADD loading and error states

CREATE src/screens/database/RecordDetailScreen.tsx:
  - FOLLOW same pattern as CustomerDetailScreen
  - INTEGRATE with recordStore

CREATE src/screens/database/TaskDetailScreen.tsx:
  - FOLLOW same pattern as CustomerDetailScreen
  - INTEGRATE with taskStore

Task 2: 更新導航配置
MODIFY src/types/navigation.ts:
  - ADD new route definitions for detail screens
  - INCLUDE proper parameter types

MODIFY src/navigation/AppNavigator.tsx:
  - ADD Stack.Screen entries for detail screens
  - USE modal presentation for better UX

Task 3: 實作條件性多選功能
MODIFY src/components/common/DataTable.tsx:
  - ADD showCheckboxes prop (default false)
  - CONDITION checkbox rendering on this prop
  - PRESERVE all existing selection logic

MODIFY src/screens/database/DatabaseScreen.tsx:
  - ADD multiSelectMode state
  - PASS showCheckboxes to DataTable
  - UPDATE toolbar multi-select button handler

Task 4: 建立批量編輯功能
CREATE src/components/common/BulkEditModal.tsx:
  - USE ActionModal as base pattern
  - RENDER edit options based on selected columns
  - IMPLEMENT batch update logic

MODIFY src/components/common/DataTable.tsx:
  - ENHANCE bulk actions bar with edit buttons
  - TRIGGER BulkEditModal on action

Task 5: 優化工具列佈局
CREATE src/components/common/ToolbarIcons.tsx:
  - RENDER filter, sort, multiselect, columns as icons only
  - USE TouchableOpacity with proper hitSlop
  - INTEGRATE with SearchBar in same row

CREATE src/components/common/FilterBadge.tsx:
  - DISPLAY active filter conditions
  - INCLUDE clear button for each filter
  - SHOW only when filters active

MODIFY src/screens/database/DatabaseScreen.tsx:
  - REPLACE current toolbar with new compact version
  - INTEGRATE ToolbarIcons and SearchBar
  - ADD FilterBadge below when needed

Task 6: 均分 Tab 寬度
MODIFY src/screens/database/DatabaseScreen.tsx:
  - REMOVE ScrollView from tab container
  - USE flex: 1 for equal tab width
  - ENSURE text doesn't overflow

Task 7: 連接行點擊到詳細檢視
MODIFY src/screens/database/DatabaseScreen.tsx:
  - UPDATE handleRowPress to navigate to detail screens
  - DETERMINE screen based on activeTab
  - PASS appropriate ID parameter

Task 8: 建立詳細檢視內容元件
CREATE src/components/database/DetailSection.tsx:
  - RENDER field label and value pairs
  - SUPPORT different field types (text, date, status)
  - USE consistent styling

CREATE src/components/database/RelatedData.tsx:
  - FETCH and display related records
  - USE FlatList for performance
  - INCLUDE navigation to related items
```

### Per task pseudocode

```typescript
// Task 1 - CustomerDetailScreen 基礎架構
const CustomerDetailScreen = ({ route, navigation }) => {
  const { customerId } = route.params;
  const { customers, isLoading } = useCustomerStore();
  
  // PATTERN: 從 store 獲取特定客戶
  const customer = customers.find(c => c.id === customerId);
  
  // PATTERN: 使用 Layout 包裝保持一致性
  return (
    <Layout>
      {/* CRITICAL: 自定義 header 與返回按鈕 */}
      <Header 
        title={customer?.name || '客戶詳情'}
        onBack={() => navigation.goBack()}
      />
      
      {/* 詳細資料區塊 */}
      <ScrollView>
        <DetailSection data={customer} />
        <RelatedData type="records" customerId={customerId} />
        <RelatedData type="tasks" customerId={customerId} />
      </ScrollView>
    </Layout>
  );
};

// Task 3 - 條件性多選實作
// In DataTable.tsx
const DataTable = ({ showCheckboxes = false, ... }) => {
  // CRITICAL: 保留所有現有邏輯
  // 僅改變渲染行為
  
  const renderCheckbox = useCallback(() => {
    if (!selectable || !showCheckboxes) return null;
    
    return (
      <View style={styles.checkboxContainer}>
        {/* existing checkbox code */}
      </View>
    );
  }, [selectable, showCheckboxes]);
};

// Task 5 - 優化工具列
const CompactToolbar = ({ onFilterPress, onSortPress, ... }) => {
  return (
    <View style={styles.toolbarContainer}>
      <SearchBar style={styles.searchBar} />
      
      {/* PATTERN: 使用 icon-only 按鈕節省空間 */}
      <View style={styles.iconGroup}>
        <TouchableOpacity onPress={onFilterPress}>
          <Ionicons name="filter" size={20} />
        </TouchableOpacity>
        {/* 其他圖示... */}
      </View>
    </View>
  );
};
```

### Integration Points
```yaml
NAVIGATION:
  - UPDATE: AppNavigator.tsx 加入詳細檢視路由
  - UPDATE: 類型定義確保 TypeScript 支援
  
STATE MANAGEMENT:
  - ENHANCE: useTableData hook 支援批量更新
  - ADD: 多選模式狀態到 DatabaseScreen
  
UI COMPONENTS:
  - MODIFY: DataTable 支援條件性勾選框
  - CREATE: 新的工具列和篩選顯示元件
  
STORES:
  - USE: 現有 stores 獲取詳細資料
  - ADD: 批量更新方法（如需要）
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# 檢查 TypeScript 編譯
npx tsc --noEmit

# 執行 ESLint
npm run lint

# Expected: 無錯誤。如有錯誤，閱讀並修復。
```

### Level 2: Component Tests
```typescript
// 測試詳細檢視導航
describe('DatabaseScreen Navigation', () => {
  it('navigates to customer detail on row press', () => {
    const { getByText } = render(<DatabaseScreen />);
    fireEvent.press(getByText('測試客戶'));
    expect(mockNavigate).toHaveBeenCalledWith('CustomerDetail', {
      customerId: expect.any(String)
    });
  });
});

// 測試多選模式切換
describe('Multi-select Mode', () => {
  it('shows checkboxes only when multi-select active', () => {
    const { queryByTestId, getByText } = render(<DatabaseScreen />);
    
    // 初始狀態無勾選框
    expect(queryByTestId('checkbox-0')).toBeNull();
    
    // 點擊多選按鈕
    fireEvent.press(getByText('多選'));
    
    // 勾選框出現
    expect(queryByTestId('checkbox-0')).toBeTruthy();
  });
});

// 測試工具列佈局
describe('Toolbar Layout', () => {
  it('renders search and icons in same row', () => {
    const { getByPlaceholder, getByTestId } = render(<DatabaseScreen />);
    const searchBar = getByPlaceholder('搜尋資料...');
    const filterIcon = getByTestId('filter-icon');
    
    // 檢查是否在同一行（相同的 y 座標）
    expect(searchBar.props.style.top).toBe(filterIcon.props.style.top);
  });
});
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 手動測試流程：
1. 開啟資料庫頁面
2. 點擊任一客戶行 → 應開啟詳細頁面
3. 返回並點擊多選按鈕 → 勾選框出現
4. 選擇多個項目 → 批量操作欄出現
5. 檢查工具列是否與搜尋框在同一行
6. 切換 Tab → 寬度應該相等
```

## Final Validation Checklist
- [ ] 所有 TypeScript 編譯通過
- [ ] 無 ESLint 錯誤
- [ ] 詳細檢視頁面正確顯示資料
- [ ] 多選模式切換正常運作
- [ ] 批量編輯功能完整
- [ ] 工具列佈局符合要求
- [ ] Tab 寬度均分
- [ ] 效能良好，無明顯延遲
- [ ] 錯誤處理完善

---

## Anti-Patterns to Avoid
- ❌ 不要在每次渲染時重新創建函數（使用 useCallback）
- ❌ 不要忽略 TypeScript 類型錯誤
- ❌ 不要硬編碼寬度值（使用 flex 佈局）
- ❌ 不要忽略無障礙設計（加入適當的 accessibility labels）
- ❌ 不要在詳細頁面載入所有資料（使用分頁或延遲載入）
- ❌ 不要忽略錯誤邊界情況（空資料、載入失敗等）

## 評分：8/10

**評分理由：**
- ✅ 完整的上下文和參考資料
- ✅ 清晰的實作步驟和順序
- ✅ 包含驗證測試和檢查清單
- ✅ 考慮了現有程式碼模式
- ✅ 提供了具體的程式碼範例
- ⚠️ 可能需要根據實際測試調整一些細節
- ⚠️ 批量編輯的具體業務邏輯可能需要進一步確認