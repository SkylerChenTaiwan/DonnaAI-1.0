# PRP-65: 資料庫內聯新增與欄位拖動排序

## 概述
修復資料庫內聯新增列功能並實作欄位拖動排序功能。讓使用者能直接在表格中新增資料（而非跳出 Modal），並可透過拖動來重新排序欄位順序。

## 背景與問題分析

### 現有問題

1. **內聯新增功能失效**
   - NotionStyleTableV2 已實作內聯新增 UI，但 `handleAddRow` 仍導航到 Modal
   - 存在兩個 `onAddRow` prop 定義造成混淆
   - 實際資料創建邏輯未正確連接

2. **欄位無法拖動排序**
   - 使用者無法自訂欄位順序
   - 缺乏直覺的拖放介面

### 程式碼分析

#### 內聯新增問題根源
```typescript
// DatabaseScreen.tsx - 問題所在
const handleAddRow = useCallback(() => {
  // 錯誤：導航到 Modal 而非內聯處理
  navigation.navigate('AddRecordModal' as any, {
    tableType: activeTab,
    columns,
    onSubmit,
  });
}, [activeTab, navigation, user, currentColumns, handleRefresh]);

// NotionStyleTableV2.tsx - 正確實作但未被使用
onAddRow={async (rowData) => {
  if (rowData) {
    // 這裡應該直接創建資料
    handleAddRow(); // 呼叫了錯誤的函數
  }
}}
```

#### 現有拖放實作參考
- DragDropHandler.tsx：使用 react-native-gesture-handler
- 專為組織圖設計，需調整為表格欄位使用

## 技術方案

### 1. 修復內聯新增功能

#### 重構 handleAddRow 支援兩種模式
```typescript
// DatabaseScreen.tsx
const handleAddRow = useCallback(async (rowData?: Record<string, any>) => {
  if (!rowData) {
    // 舊模式：導航到 Modal（保留給其他地方使用）
    navigation.navigate('AddRecordModal' as any, {
      tableType: activeTab,
      columns: currentColumns,
      onSubmit: async (data) => {
        await handleAddRowWithData(data);
      },
    });
  } else {
    // 新模式：內聯新增
    await handleAddRowWithData(rowData);
  }
}, [activeTab, navigation, currentColumns]);

const handleAddRowWithData = useCallback(async (data: Record<string, any>) => {
  try {
    switch (activeTab) {
      case 'customers':
        await createCustomer({
          ...data,
          organizationId: user?.organizationId || '',
          createdBy: user?.uid || '',
        });
        break;
      case 'records':
        await createRecord({
          ...data,
          organizationId: user?.organizationId || '',
          createdBy: user?.uid || '',
        });
        break;
      case 'tasks':
        await createTask({
          ...data,
          organizationId: user?.organizationId || '',
          assignedTo: user?.uid || '',
          createdBy: user?.uid || '',
        });
        break;
    }
    await handleRefresh();
    showToast('success', `成功新增${tabs.find(t => t.id === activeTab)?.title}`);
  } catch (error) {
    console.error('Error creating row:', error);
    showToast('error', '新增失敗');
    throw error;
  }
}, [activeTab, user, handleRefresh]);
```

### 2. 實作欄位拖動排序

#### 創建 DraggableTableHeader 組件
```typescript
// src/components/database/DraggableTableHeader.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { TableColumn } from '@/types/table';

interface DraggableTableHeaderProps {
  columns: TableColumn[];
  onColumnsReorder: (columns: TableColumn[]) => void;
  multiSelectMode?: boolean;
  // ... 其他 props
}

export const DraggableTableHeader: React.FC<DraggableTableHeaderProps> = ({
  columns,
  onColumnsReorder,
  multiSelectMode,
  ...props
}) => {
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [columnOrder, setColumnOrder] = useState(columns.map((_, i) => i));
  
  if (Platform.OS === 'web') {
    // Web 平台使用 HTML5 Drag and Drop API
    return (
      <View style={styles.tableHeader}>
        {multiSelectMode && <View style={styles.checkboxColumn} />}
        
        {columnOrder.map((originalIndex) => {
          const column = columns[originalIndex];
          return (
            <div
              key={column.key}
              draggable
              onDragStart={(e) => handleDragStart(e, originalIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, originalIndex)}
              onDragEnd={handleDragEnd}
              className={`header-cell ${draggedColumn === originalIndex ? 'dragging' : ''}`}
              style={{
                cursor: 'move',
                opacity: draggedColumn === originalIndex ? 0.5 : 1,
              }}
            >
              <TouchableOpacity
                style={[styles.headerCell]}
                onPress={() => column.sortable && props.onSort?.(column.key)}
              >
                <Icon name="drag-handle" size={16} color="#999" />
                <Text style={styles.headerText}>{column.title}</Text>
              </TouchableOpacity>
            </div>
          );
        })}
      </View>
    );
  } else {
    // Native 平台使用 react-native-gesture-handler
    return <GestureHandlerTableHeader {...props} />;
  }
};

// Web 平台的拖放處理函數
const handleDragStart = (e: React.DragEvent, index: number) => {
  setDraggedColumn(index);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', index.toString());
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
  
  if (dragIndex !== dropIndex) {
    const newOrder = [...columnOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    
    setColumnOrder(newOrder);
    
    // 重新排序實際的 columns 陣列
    const reorderedColumns = newOrder.map(i => columns[i]);
    onColumnsReorder(reorderedColumns);
  }
};
```

#### 儲存欄位順序到 localStorage/AsyncStorage
```typescript
// hooks/useColumnOrder.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export function useColumnOrder(tableKey: string, defaultColumns: TableColumn[]) {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const storageKey = `column_order_${tableKey}`;

  useEffect(() => {
    loadColumnOrder();
  }, [tableKey]);

  const loadColumnOrder = async () => {
    try {
      let savedOrder: string | null = null;
      
      if (Platform.OS === 'web') {
        savedOrder = localStorage.getItem(storageKey);
      } else {
        savedOrder = await AsyncStorage.getItem(storageKey);
      }
      
      if (savedOrder) {
        setColumnOrder(JSON.parse(savedOrder));
      } else {
        setColumnOrder(defaultColumns.map(col => col.key));
      }
    } catch (error) {
      console.error('Error loading column order:', error);
      setColumnOrder(defaultColumns.map(col => col.key));
    }
  };

  const saveColumnOrder = async (newOrder: string[]) => {
    try {
      const orderString = JSON.stringify(newOrder);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, orderString);
      } else {
        await AsyncStorage.setItem(storageKey, orderString);
      }
      
      setColumnOrder(newOrder);
    } catch (error) {
      console.error('Error saving column order:', error);
    }
  };

  // 根據儲存的順序重新排序欄位
  const getOrderedColumns = (columns: TableColumn[]): TableColumn[] => {
    if (columnOrder.length === 0) return columns;
    
    const orderedColumns: TableColumn[] = [];
    const columnMap = new Map(columns.map(col => [col.key, col]));
    
    // 先加入已儲存順序的欄位
    columnOrder.forEach(key => {
      const col = columnMap.get(key);
      if (col) {
        orderedColumns.push(col);
        columnMap.delete(key);
      }
    });
    
    // 加入新欄位（未在儲存順序中的）
    columnMap.forEach(col => {
      orderedColumns.push(col);
    });
    
    return orderedColumns;
  };

  return {
    getOrderedColumns,
    saveColumnOrder,
  };
}
```

### 3. 整合修改到 NotionStyleTableV2

```typescript
// NotionStyleTableV2.tsx 修改
interface NotionStyleTableV2Props {
  // ... 其他 props
  onColumnsReorder?: (columns: TableColumn[]) => void;
  enableColumnDrag?: boolean;
}

export const NotionStyleTableV2: React.FC<NotionStyleTableV2Props> = ({
  // ... 其他 props
  onColumnsReorder,
  enableColumnDrag = true,
}) => {
  // 使用可拖動的表頭
  const renderHeader = () => {
    if (enableColumnDrag && onColumnsReorder) {
      return (
        <DraggableTableHeader
          columns={columns}
          onColumnsReorder={onColumnsReorder}
          multiSelectMode={multiSelectMode}
          onSort={onSort}
          // ... 其他 props
        />
      );
    }
    
    // 原有的表頭渲染邏輯
    return (
      <View style={styles.tableHeader}>
        {/* ... 原有邏輯 ... */}
      </View>
    );
  };
};
```

## 實施步驟

### 第一階段：修復內聯新增（Day 1）
1. ✅ 重構 `handleAddRow` 支援兩種模式
2. ✅ 修正 NotionStyleTableV2 的 `onAddRow` 調用
3. ✅ 測試各種資料類型的內聯新增
4. ✅ 處理錯誤和驗證

### 第二階段：欄位拖動基礎（Day 2）
1. ✅ 創建 DraggableTableHeader 組件
2. ✅ 實作 Web 平台的 HTML5 拖放
3. ✅ 實作 Native 平台的手勢處理
4. ✅ 視覺回饋（拖動時的樣式）

### 第三階段：持久化和整合（Day 3）
1. ✅ 實作 useColumnOrder hook
2. ✅ 整合到 DatabaseScreen
3. ✅ 測試跨平台相容性
4. ✅ 優化性能

## 驗證標準

### 功能測試
```bash
# 執行測試
npm test -- --testPathPattern=database

# E2E 測試
npm run test:e2e -- --testNamePattern="inline add|column drag"
```

### 手動測試清單
- [ ] 內聯新增功能
  - [ ] 點擊「新增」按鈕出現可編輯列
  - [ ] 填寫資料後按確認成功新增
  - [ ] 取消按鈕正確清除輸入
  - [ ] 錯誤處理正常顯示
- [ ] 欄位拖動功能
  - [ ] 拖動欄位標題可改變順序
  - [ ] 視覺回饋清晰
  - [ ] 順序持久化正常
  - [ ] 重新載入後順序保持

### 性能指標
- 拖動響應時間 < 16ms（60fps）
- 內聯新增響應時間 < 100ms
- 無記憶體洩漏

## 風險評估

### 潛在風險
1. **跨平台相容性** - Web 和 Native 拖放實作差異大
2. **FlashList 相容性** - 動態改變欄位順序可能影響虛擬列表
3. **狀態同步** - 欄位順序與資料渲染的同步問題

### 緩解措施
1. 使用 Platform.OS 條件渲染不同實作
2. 在欄位順序改變時強制 FlashList 重新渲染
3. 使用 key prop 確保正確的渲染順序

## 參考資源

### 內部檔案
- `/src/components/database/NotionStyleTableV2.tsx` - 表格組件
- `/src/screens/database/DatabaseScreen.tsx` - 資料庫主頁面
- `/src/components/personnel/DragDropHandler.tsx` - 現有拖放實作
- `/src/services/firebase/customers.ts` - 客戶資料創建 API
- `/src/services/firebase/records.ts` - 紀錄資料創建 API
- `/src/services/firebase/tasks.ts` - 任務資料創建 API

### 外部文檔
- [HTML5 Drag and Drop API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Using HTML Drag-And-Drop API In React](https://www.smashingmagazine.com/2020/02/html-drag-drop-api-react/)
- [Material React Table - Column Ordering](https://www.material-react-table.com/docs/guides/column-ordering-dnd)

## 成功標準

1. **內聯新增順暢** - 使用者可直接在表格中新增資料，無需跳轉頁面
2. **拖放直覺** - 欄位拖動操作流暢自然
3. **狀態持久** - 欄位順序在重新載入後保持
4. **跨平台一致** - Web 和 Native 體驗一致

## 實作信心評分：7/10

扣分原因：
- 跨平台拖放實作複雜度高（-2）
- FlashList 與動態欄位順序的相容性未知（-1）

加分原因：
- 內聯新增修復相對簡單（+1）
- 已有拖放組件可參考（+1）