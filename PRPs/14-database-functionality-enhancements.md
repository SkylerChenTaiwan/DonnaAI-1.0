name: "Database Functionality Enhancements - Filter, Sort, Batch Operations & Column Settings"
description: |

## Purpose
實作資料庫頁面缺失的核心功能：篩選器 UI、排序選擇器、批量操作功能和欄位顯示設定，提升資料管理效率。

## Core Principles
1. **Context is King**: 包含所有必要的文件、範例和注意事項
2. **Validation Loops**: 提供可執行的測試讓 AI 能執行和修復
3. **Information Dense**: 使用程式碼庫中的關鍵字和模式
4. **Progressive Success**: 從簡單開始，驗證後再增強
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
完成資料庫頁面的四個核心功能：
1. **篩選器功能**：建立篩選器 Modal，讓使用者可以根據不同條件篩選資料
2. **排序功能**：建立排序選擇器 Modal，提供多種排序選項
3. **批量操作功能**：實作批量編輯、刪除、匯出等操作
4. **欄位設定功能**：讓使用者自訂要顯示的欄位

## Why
- **業務價值**：提升資料管理效率，讓使用者能快速找到和處理所需資料
- **使用者影響**：改善使用者體驗，減少手動操作時間
- **解決問題**：目前篩選、排序按鈕無作用，批量操作僅能選取但無法處理，欄位設定按鈕空白

## What
### 使用者可見行為
1. 點擊篩選按鈕 → 顯示篩選器 Modal → 設定條件 → 應用篩選
2. 點擊排序按鈕 → 顯示排序選項 → 選擇排序方式 → 資料重新排序
3. 多選模式下 → 顯示批量操作按鈕 → 執行批量編輯/刪除/匯出
4. 點擊欄位設定 → 顯示欄位選擇器 → 勾選要顯示的欄位 → 更新表格

### Success Criteria
- [ ] 篩選器可正確過濾客戶、紀錄、任務資料
- [ ] 排序功能支援多欄位升降序排序
- [ ] 批量操作可同時處理多筆資料
- [ ] 欄位設定能記住使用者偏好
- [ ] 所有功能在不同 Tab 間獨立運作
- [ ] UI 符合現有設計系統

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /src/screens/database/DatabaseScreen.tsx
  why: 主要實作檔案，需要了解現有結構和狀態管理
  
- file: /src/components/common/DataTable.tsx
  why: 表格元件，了解如何整合新功能
  
- file: /src/hooks/useTableData.ts
  why: 包含篩選和排序邏輯，需要連接 UI
  
- file: /src/components/common/ActionModal.tsx
  why: 可重用的 Modal 元件模式
  
- file: /src/components/common/FilterBadge.tsx
  why: 已實作的篩選條件顯示元件
  
- file: /src/stores/customerStore.ts
  why: 了解批量操作 API (batchUpdateCustomers)
  
- file: /src/types/table.ts
  why: 了解表格資料結構和型別定義

- url: https://reactnative.dev/docs/virtualizedlist
  why: 了解 React Native 虛擬列表效能最佳化

- url: https://medium.com/@thewidlarzgroup/react-table-7-sorting-filtering-pagination-and-more-6bc28af104d6
  why: React Table 篩選和排序的最佳實踐
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── common/
│   │   ├── ActionModal.tsx       # 可重用的 Modal 元件
│   │   ├── DataTable.tsx         # 資料表格元件
│   │   ├── FilterBadge.tsx       # 篩選條件顯示
│   │   ├── SearchBar.tsx         # 搜尋框元件
│   │   └── ToolbarIcons.tsx      # 工具列圖示
│   └── settings/
│       └── SettingItem.tsx       # 支援 select 類型
├── hooks/
│   └── useTableData.ts           # 表格資料管理 Hook
├── screens/
│   └── database/
│       ├── DatabaseScreen.tsx    # 資料庫主頁面
│       ├── CustomerDetailScreen.tsx
│       ├── RecordDetailScreen.tsx
│       └── TaskDetailScreen.tsx
├── stores/
│   ├── customerStore.ts          # 客戶資料管理
│   ├── recordStore.ts            # 紀錄資料管理
│   └── taskStore.ts              # 任務資料管理
└── types/
    ├── table.ts                  # 表格型別定義
    └── navigation.ts             # 導航型別
```

### Desired Codebase tree with files to be added
```bash
src/
├── components/
│   ├── common/
│   │   ├── FilterModal.tsx       # NEW: 篩選器 Modal
│   │   ├── SortModal.tsx         # NEW: 排序選擇器 Modal
│   │   ├── BatchActionsModal.tsx # NEW: 批量操作 Modal
│   │   └── ColumnSettingsModal.tsx # NEW: 欄位設定 Modal
│   └── database/
│       ├── FilterForm.tsx        # NEW: 篩選表單元件
│       ├── BatchEditForm.tsx     # NEW: 批量編輯表單
│       └── ExportOptions.tsx     # NEW: 匯出選項元件
├── hooks/
│   ├── useTableData.ts           # MODIFY: 連接篩選 UI
│   └── useColumnSettings.ts      # NEW: 欄位設定管理
└── utils/
    └── tableExport.ts            # NEW: 資料匯出工具
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Native Modal 在 Android 上需要 statusBarTranslucent
// Example: <Modal statusBarTranslucent={true} />

// CRITICAL: FlashList 需要 estimatedItemSize 以優化效能
// Example: <FlashList estimatedItemSize={60} />

// CRITICAL: Zustand store 的批量更新需要使用 immer
// Example: set((state) => { state.items = newItems })

// CRITICAL: React 18 自動批量處理狀態更新
// 多個 setState 會自動合併為一次渲染

// PATTERN: 使用現有的顏色系統
// 主色: #007AFF, 背景: #F2F2F7, 文字: #1C1C1E
```

## Implementation Blueprint

### Data models and structure
```typescript
// 篩選條件型別
interface FilterCondition {
  key: string;        // 欄位名稱
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;         // 篩選值
  label?: string;     // 顯示標籤
}

// 排序設定型別
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
  label?: string;
}

// 欄位設定型別
interface ColumnSettings {
  [tabId: string]: {
    visibleColumns: string[];
    columnOrder?: string[];
  };
}

// 批量操作型別
interface BatchAction {
  id: string;
  label: string;
  icon: string;
  action: (selectedIds: string[]) => Promise<void>;
  confirmRequired?: boolean;
}
```

### List of tasks to be completed in order

```yaml
Task 1: 建立篩選器 Modal 和表單
MODIFY src/screens/database/DatabaseScreen.tsx:
  - ADD state: showFilterModal, currentFilters
  - MODIFY onFilterPress to show modal
  - INTEGRATE with existing activeFilters state

CREATE src/components/common/FilterModal.tsx:
  - MIRROR pattern from: ActionModal.tsx
  - ADD filter form based on active tab
  - EMIT onApply and onClear events

CREATE src/components/database/FilterForm.tsx:
  - DYNAMIC form based on column types
  - SUPPORT different operators per field type
  - VALIDATE filter conditions

Task 2: 建立排序選擇器
CREATE src/components/common/SortModal.tsx:
  - LIST sortable columns from TableColumn[]
  - ALLOW direction toggle (asc/desc)
  - SUPPORT multi-column sort

MODIFY src/screens/database/DatabaseScreen.tsx:
  - ADD state: showSortModal
  - CONNECT to useTableData sort functionality
  - PERSIST sort preferences

Task 3: 實作批量操作功能
CREATE src/components/common/BatchActionsModal.tsx:
  - SHOW available actions based on selection
  - CONFIRM dangerous operations
  - PROGRESS indicator for long operations

CREATE src/components/database/BatchEditForm.tsx:
  - FORM for bulk property updates
  - PREVIEW changes before applying
  - UNDO capability

MODIFY src/screens/database/DatabaseScreen.tsx:
  - ADD batch action handlers
  - INTEGRATE with store batch methods
  - ERROR handling and rollback

Task 4: 建立欄位設定功能
CREATE src/components/common/ColumnSettingsModal.tsx:
  - CHECKLIST of available columns
  - DRAG to reorder columns
  - RESET to defaults option

CREATE src/hooks/useColumnSettings.ts:
  - PERSIST settings to AsyncStorage
  - PER-TAB column preferences
  - DEFAULT column sets

MODIFY src/components/common/DataTable.tsx:
  - FILTER columns based on settings
  - RESPECT column order
  - DYNAMIC column width

Task 5: 新增資料匯出功能
CREATE src/utils/tableExport.ts:
  - EXPORT to CSV format
  - RESPECT current filters/sort
  - INCLUDE only visible columns

CREATE src/components/database/ExportOptions.tsx:
  - FORMAT selection (CSV, JSON)
  - COLUMN selection
  - EMAIL or save to device

Task 6: 整合和測試
MODIFY src/hooks/useTableData.ts:
  - EXPOSE filter methods to UI
  - OPTIMIZE performance for large datasets
  - MEMOIZE filtered results

UPDATE all stores:
  - ADD batch operation error handling
  - IMPLEMENT optimistic updates
  - ROLLBACK on failure
```

### Per task pseudocode

```typescript
// Task 1: FilterModal 核心邏輯
const FilterModal = ({ visible, onClose, columns, filters, onApply }) => {
  // PATTERN: 使用 useState 管理表單狀態
  const [conditions, setConditions] = useState<FilterCondition[]>(filters);
  
  const handleAddCondition = () => {
    // PATTERN: 使用 spread operator 更新陣列
    setConditions([...conditions, { 
      key: columns[0].key, 
      operator: 'contains', 
      value: '' 
    }]);
  };
  
  const handleApply = () => {
    // VALIDATE: 移除空值條件
    const validConditions = conditions.filter(c => c.value);
    onApply(validConditions);
    onClose();
  };
  
  // PATTERN: 使用現有 Modal 樣式
  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* 實作篩選表單 UI */}
    </Modal>
  );
};

// Task 3: 批量操作處理
const handleBatchDelete = async (selectedIds: string[]) => {
  // PATTERN: 顯示確認對話框
  Alert.alert(
    '確認刪除',
    `確定要刪除 ${selectedIds.length} 筆資料嗎？`,
    [
      { text: '取消', style: 'cancel' },
      { 
        text: '刪除', 
        style: 'destructive',
        onPress: async () => {
          try {
            // PATTERN: 使用 store 的批量方法
            await customerStore.batchDelete(selectedIds);
            // CLEAR: 清除選取狀態
            clearSelection();
            // NOTIFY: 顯示成功訊息
            Toast.show('刪除成功');
          } catch (error) {
            // ERROR: 顯示錯誤訊息
            Alert.alert('錯誤', '刪除失敗，請稍後再試');
          }
        }
      }
    ]
  );
};

// Task 4: 欄位設定持久化
const useColumnSettings = (tabId: string) => {
  const [settings, setSettings] = useState<ColumnSettings>({});
  
  // LOAD: 從 AsyncStorage 載入設定
  useEffect(() => {
    AsyncStorage.getItem(`columnSettings_${tabId}`)
      .then(data => data && setSettings(JSON.parse(data)));
  }, [tabId]);
  
  // SAVE: 儲存設定到 AsyncStorage
  const saveSettings = useCallback((newSettings: ColumnSettings) => {
    setSettings(newSettings);
    AsyncStorage.setItem(
      `columnSettings_${tabId}`, 
      JSON.stringify(newSettings)
    );
  }, [tabId]);
  
  return { settings, saveSettings };
};
```

### Integration Points
```yaml
STATE_MANAGEMENT:
  - DatabaseScreen: 新增 modal 狀態管理
  - useTableData: 暴露 setFilter 方法
  - Stores: 確保批量操作方法可用

UI_COMPONENTS:
  - Modal: 統一使用 statusBarTranslucent
  - Form: 遵循現有表單樣式
  - Button: 使用標準按鈕元件

NAVIGATION:
  - 批量操作後可能需要重新載入
  - 確保 modal 在導航時正確關閉

PERFORMANCE:
  - 大量資料篩選使用 useMemo
  - 批量操作顯示進度指示器
  - 虛擬列表優化渲染
```

## Validation Loop

### Level 1: TypeScript 檢查
```bash
# 檢查新增檔案的型別
npx tsc --noEmit

# Expected: 無錯誤。如有錯誤，修復型別定義
```

### Level 2: 元件測試
```typescript
// 測試篩選功能
describe('FilterModal', () => {
  it('should apply filters correctly', () => {
    const onApply = jest.fn();
    const { getByText } = render(
      <FilterModal 
        visible={true}
        columns={mockColumns}
        onApply={onApply}
      />
    );
    
    // 新增篩選條件
    fireEvent.press(getByText('新增條件'));
    // 設定條件值
    fireEvent.changeText(getByPlaceholder('輸入值'), 'test');
    // 應用篩選
    fireEvent.press(getByText('應用'));
    
    expect(onApply).toHaveBeenCalledWith([
      { key: 'name', operator: 'contains', value: 'test' }
    ]);
  });
});

// 測試批量操作
describe('Batch Operations', () => {
  it('should handle batch delete', async () => {
    const { getByText } = render(<DatabaseScreen />);
    
    // 啟用多選模式
    fireEvent.press(getByText('多選'));
    // 選擇項目
    fireEvent.press(getByTestId('checkbox-1'));
    fireEvent.press(getByTestId('checkbox-2'));
    // 執行刪除
    fireEvent.press(getByText('刪除'));
    
    await waitFor(() => {
      expect(customerStore.batchDelete).toHaveBeenCalledWith(['1', '2']);
    });
  });
});
```

### Level 3: 整合測試
```bash
# 啟動應用程式
npm run start

# 手動測試流程
1. 開啟資料庫頁面
2. 測試篩選：
   - 點擊篩選按鈕
   - 新增條件（名稱包含 "test"）
   - 確認資料正確過濾
3. 測試排序：
   - 點擊排序按鈕
   - 選擇日期降序
   - 確認資料正確排序
4. 測試批量操作：
   - 啟用多選模式
   - 選擇多筆資料
   - 執行批量編輯
5. 測試欄位設定：
   - 點擊欄位設定
   - 隱藏部分欄位
   - 確認表格更新
```

## Final validation Checklist
- [ ] 所有 TypeScript 型別正確
- [ ] 篩選功能可正確過濾資料
- [ ] 排序支援多欄位和方向切換
- [ ] 批量操作有確認機制和錯誤處理
- [ ] 欄位設定可持久化儲存
- [ ] UI 符合現有設計系統
- [ ] 效能良好（大量資料不卡頓）
- [ ] 在 iOS 和 Android 上都正常運作

---

## Anti-Patterns to Avoid
- ❌ 不要在渲染函數中直接操作陣列（使用 useMemo）
- ❌ 不要忽略 Modal 在 Android 的相容性問題
- ❌ 不要在批量操作時凍結 UI（顯示進度）
- ❌ 不要硬編碼欄位名稱（使用 TableColumn 定義）
- ❌ 不要忽略錯誤處理和回滾機制
- ❌ 不要創建新的 UI 模式（遵循現有設計）

## Confidence Score: 8/10

此 PRP 包含詳細的實作指引和充分的上下文資訊。扣分原因：
1. (-1) 可能需要根據實際 UI/UX 需求調整 Modal 設計
2. (-1) 批量操作的具體業務邏輯可能需要進一步確認

透過提供的驗證循環和現有程式碼參考，AI 應該能夠成功實作這些功能。