# PRP-68: 資料庫元件完全重建 - TanStack Table Web 專用實作

## 概述
使用 TanStack Table 重建 Web 版資料庫表格元件，實現真正的 Notion 風格資料庫功能。採用漸進式策略：Web 版使用新元件，APP 保持現有 NotionStyleTableV2。

## 背景與問題分析

### 現有問題深度分析
1. **根本架構問題**：使用 React Native 元件（View/Text）在 Web 上渲染成 div/span，缺少真正的表格語義結構
2. **新增列功能完全故障**：handleInlineAdd 調用後無法正確儲存資料到 Firebase
3. **視覺體驗差**：與 Notion 資料庫的專業外觀相差甚遠，缺少表格結構感

### 解決方案驗證
基於深度調研，**TanStack Table** 是最佳選擇：
- ✅ 業界最受歡迎的 React 表格庫
- ✅ 專門有成功的 [Notion + TanStack Table 範例專案](https://github.com/s-d-le/tanstack-react-table-mega-example)
- ✅ 完全支援 React Native Web
- ✅ Bundle 僅 10-15KB，輕量級設計
- ✅ 完整支援排序、篩選、編輯、拖放

## 技術架構設計

### 1. 實作策略：平台分離
```typescript
// DatabaseScreen.tsx 中的條件渲染
const TableComponent = Platform.select({
  web: () => <TanStackNotionTable {...props} />,
  default: () => <NotionStyleTableV2 {...props} />
});
```

### 2. 文件結構設計
```
src/components/database/
├── NotionStyleTableV2.tsx           # 現有 APP 版本（保持不變）
├── web/
│   ├── TanStackNotionTable.tsx      # 新的 Web 專用表格
│   ├── NotionTableCell.tsx          # Web 專用儲存格
│   ├── NotionTableHeader.tsx        # Web 專用表頭
│   └── hooks/
│       ├── useNotionTable.ts        # 表格狀態管理
│       └── useNotionColumns.ts      # 欄位定義邏輯
└── shared/
    ├── tableTypes.ts                # 共用型別定義
    └── tableUtils.ts                # 共用工具函數
```

### 3. 資料整合模式
基於現有的 Zustand stores：
```typescript
// 現有架構：src/stores/customerStore.ts, recordStore.ts, taskStore.ts
// 新增：useNotionTable.ts 作為適配層
const useNotionTable = (type: 'customers' | 'records' | 'tasks') => {
  const store = useStoreByType(type); // customers/records/tasks
  
  return {
    data: store.data,
    loading: store.isLoading,
    onUpdate: store.updateItem,
    onCreate: store.addItem,
    onDelete: store.deleteItem,
  };
};
```

## 實作藍圖

### 階段 1：依賴安裝與基礎架構（30分鐘）

#### 1.1 安裝依賴
```bash
npm install @tanstack/react-table @dnd-kit/core @dnd-kit/sortable
```

#### 1.2 建立基礎 Hook
```typescript
// src/components/database/web/hooks/useNotionTable.ts
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

export const useNotionTable = <T>({ data, columns }: TableProps<T>) => {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection: selectedRows,
    },
    onRowSelectionChange: setSelectedRows,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });
};
```

### 階段 2：核心表格元件實作（2小時）

#### 2.1 主表格元件架構
```typescript
// src/components/database/web/TanStackNotionTable.tsx
export const TanStackNotionTable: React.FC<TableProps> = ({
  data,
  onAddRow,
  onUpdateCell,
  onColumnsReorder,
}) => {
  const columns = useNotionColumns({ onUpdateCell, onColumnsReorder });
  const table = useNotionTable({ data, columns });
  
  return (
    <div className="notion-table">
      <table className="notion-table-element">
        <NotionTableHeader table={table} />
        <tbody>
          {table.getRowModel().rows.map(row => (
            <NotionTableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
      <NotionAddRowButton onAdd={onAddRow} />
    </div>
  );
};
```

#### 2.2 欄位定義模式
```typescript
// src/components/database/web/hooks/useNotionColumns.ts
export const useNotionColumns = ({ onUpdateCell }: ColumnsProps) => {
  return useMemo(() => [
    // 核取方塊列（始終顯示）
    {
      id: 'select',
      header: ({ table }) => (
        <NotionCheckbox
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <NotionCheckbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 40,
    },
    // 資料欄位
    ...generateDataColumns(onUpdateCell),
  ], [onUpdateCell]);
};
```

#### 2.3 內聯編輯儲存格
```typescript
// src/components/database/web/NotionTableCell.tsx
export const NotionTableCell: React.FC<CellProps> = ({ 
  value, 
  onChange,
  type = 'text' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  const handleSave = useCallback(async () => {
    try {
      await onChange?.(editValue);
      setIsEditing(false);
    } catch (error) {
      // 錯誤處理
      setEditValue(value); // 回滾
    }
  }, [editValue, onChange, value]);
  
  return (
    <td className="notion-cell" onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
};
```

### 階段 3：拖放功能實作（1小時）

#### 3.1 欄位拖放整合
```typescript
// 使用 @dnd-kit 實作欄位拖放
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

const NotionTableHeader = ({ table }) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // 重新排序欄位
      onColumnsReorder?.(newColumnOrder);
    }
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
        <thead>
          <tr>
            {table.getHeaderGroups().map(headerGroup => (
              headerGroup.headers.map(header => (
                <SortableHeaderCell key={header.id} header={header} />
              ))
            ))}
          </tr>
        </thead>
      </SortableContext>
    </DndContext>
  );
};
```

### 階段 4：樣式實作（1小時）

#### 4.1 Notion 風格 CSS
```css
/* src/components/database/web/NotionTable.css */
.notion-table {
  background: white;
  border-radius: 3px;
  overflow: hidden;
  width: 100%;
}

.notion-table-element {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.notion-table-element thead {
  border-bottom: 1px solid #E9E9E7;
  background: #ffffff;
}

.notion-table-element th {
  padding: 6px 8px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #787774;
  border-right: 1px solid transparent;
  height: 36px;
}

.notion-table-element td {
  padding: 6px 8px;
  height: 36px;
  border-bottom: 1px solid transparent;
  transition: background-color 0.1s ease;
}

.notion-table-element tr:hover td {
  background-color: #F7F6F3;
}

.notion-cell {
  cursor: text;
  position: relative;
}

.notion-cell:hover {
  background-color: rgba(55, 53, 47, 0.08);
  border-radius: 3px;
}
```

## Firebase 整合模式

### 現有資料流程整合
```typescript
// 整合現有的 Firebase 服務
// src/services/firebase/customers.ts -> createCustomer, updateCustomer
// src/stores/customerStore.ts -> 狀態管理

const handleCellUpdate = useCallback(async (rowId: string, columnKey: string, value: any) => {
  try {
    switch (activeTab) {
      case 'customers':
        await updateCustomer(rowId, { [columnKey]: value }, user?.uid || '');
        await fetchCustomers(user); // 重新載入
        break;
      case 'records':
        // 類似實作...
        break;
    }
  } catch (error) {
    showToast('error', '更新失敗');
    throw error; // 讓 cell 回滾
  }
}, [activeTab, user]);
```

## 驗證標準

### 功能驗證
```bash
# 編譯檢查
npm run type-check

# Web 版本建置測試
npm run web:build

# 本地測試伺服器
npm run web:preview
```

### 測試清單
- [ ] 表格正確載入客戶/紀錄/任務資料
- [ ] 內聯編輯功能可以儲存到 Firebase
- [ ] 核取方塊選擇和多選功能
- [ ] 欄位拖放排序功能
- [ ] 新增列功能正常運作
- [ ] 視覺外觀符合 Notion 風格
- [ ] APP 版本不受影響
- [ ] 響應式設計在不同螢幕尺寸正常

## 風險控制

### 1. 相容性風險
- **風險**：TanStack Table 與 React Native Web 不相容
- **控制**：TanStack Table 官方確認支援 React Native，且有成功案例

### 2. 學習曲線風險
- **風險**：TanStack Table API 複雜
- **控制**：有詳細的實作範例和分階段實作計劃

### 3. 資料流程風險
- **風險**：現有 Firebase 整合中斷
- **控制**：完全重用現有的 stores 和 services，不改變資料流程

## 參考資源

### 官方文檔
- [TanStack Table 文檔](https://tanstack.com/table/latest)
- [React Table 完整指南](https://blog.logrocket.com/react-table-complete-guide/)

### 實作範例
- [TanStack Table + Notion API 範例](https://github.com/s-d-le/tanstack-react-table-mega-example)
- [React Notion Table 庫](https://github.com/opa-oz/react-notion-table)

### 相關庫文檔
- [@dnd-kit 文檔](https://docs.dndkit.com/)
- [React Native Web 表格最佳實踐](https://necolas.github.io/react-native-web/)

## 現有程式碼整合點

### 主要檔案
- `src/screens/database/DatabaseScreen.tsx:527` - NotionStyleTableV2 使用處
- `src/stores/customerStore.ts` - 客戶資料管理
- `src/stores/recordStore.ts` - 紀錄資料管理  
- `src/stores/taskStore.ts` - 任務資料管理
- `src/components/common/EditableCell.tsx` - 現有編輯邏輯參考

### 整合模式
```typescript
// DatabaseScreen.tsx 整合點
const TableImplementation = Platform.select({
  web: TanStackNotionTable,
  default: NotionStyleTableV2,
});

return (
  <TableImplementation
    data={currentData.data}
    columns={currentColumns}
    onAddRow={handleAddRow}
    onUpdateCell={handleCellUpdate}
    // ... 現有 props
  />
);
```

## 成功標準

1. **視覺一致**：與 Notion 資料庫外觀完全一致
2. **功能完整**：所有現有功能正常運作 + 內聯編輯修復
3. **效能優秀**：載入和操作響應迅速
4. **零影響**：APP 版本完全不受影響
5. **可維護**：程式碼結構清晰，易於擴展

## 實作信心評分：9/10

基於充分的調研和成功案例，使用業界標準工具，風險控制完善，採用漸進式實作策略，成功機率極高。