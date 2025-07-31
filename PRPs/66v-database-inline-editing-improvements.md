# PRP-66: 資料庫內聯編輯體驗改進

## 概述
優化資料庫的內聯編輯體驗，讓操作更接近 Google Sheets 和 Notion 的使用體驗。移除不必要的視覺元素，加強鍵盤操作支援。

## 背景與問題分析

### 現有問題

1. **工具列按鈕顏色問題**
   - 排序按鈕在啟用時顯示紅色，過於突兀
   - 應該使用統一的黑灰色背景表示選中狀態

2. **內聯新增列視覺設計問題**
   - 目前新增列有特殊背景色和邊框，看起來很醜
   - 應該像 Notion 一樣只是純粹的表格列
   - 缺少儲存/取消按鈕，應該更簡潔

3. **編輯體驗不佳**
   - 無法像 Google Sheets 一樣直接點擊儲存格編輯
   - 缺少鍵盤快捷鍵支援（複製、貼上、復原等）
   - 編輯時沒有適當的視覺回饋

## 技術方案

### 1. 修復工具列按鈕顏色

#### DatabaseToolbar.tsx 調整
```typescript
// 移除紅色，改用灰色背景
const buttonStyle = [
  styles.toolButton,
  isActive && styles.toolButtonActive, // 使用灰色背景而非紅色
];

// 樣式定義
toolButtonActive: {
  backgroundColor: '#f0f0f0', // 淺灰色背景
  borderColor: '#d0d0d0',
}
```

### 2. 重新設計內聯新增列

#### NotionStyleTableV2.tsx 改進
```typescript
// 移除特殊樣式，使用普通表格列
const renderNewRow = () => {
  if (!isAddingRow) return null;

  return (
    <View style={styles.tableRow}> {/* 使用普通 tableRow 樣式 */}
      {multiSelectMode && <View style={styles.checkboxColumn} />}
      
      {columns.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.tableCell,
            index === 0 && !multiSelectMode && styles.firstTableCell,
            column.width ? { width: column.width } : { flex: 1 }
          ]}
        >
          <EditableCell
            value={newRowData[column.key]}
            isEditing={true}
            onStartEdit={() => {}}
            onFinishEdit={(value) => {
              setNewRowData({ ...newRowData, [column.key]: value });
            }}
            onSubmit={handleSaveNewRow} // Enter 鍵直接儲存
            onCancel={handleCancelNewRow} // Esc 鍵取消
            inputType={getInputTypeForColumn(column)}
            placeholder={`輸入${column.title}`}
            autoFocus={index === 0} // 第一個欄位自動聚焦
          />
        </View>
      ))}
    </View>
  );
};

// 移除醜陋的樣式
// 刪除: newRow, newRowActions, saveButton, cancelButton
```

### 3. 實作 Google Sheets 風格的編輯體驗

#### 創建 useTableKeyboardShortcuts Hook
```typescript
// hooks/useTableKeyboardShortcuts.ts
export function useTableKeyboardShortcuts({
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onDelete,
  onSelectAll,
  onNavigate,
}: TableKeyboardShortcutsProps) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      // 複製 (Cmd/Ctrl + C)
      if (metaKey && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        onCopy?.();
      }
      
      // 貼上 (Cmd/Ctrl + V)
      if (metaKey && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        onPaste?.();
      }
      
      // 復原 (Cmd/Ctrl + Z)
      if (metaKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      
      // 重做 (Cmd/Ctrl + Shift + Z 或 Cmd/Ctrl + Y)
      if ((metaKey && e.key === 'z' && e.shiftKey) || (metaKey && e.key === 'y')) {
        e.preventDefault();
        onRedo?.();
      }
      
      // 刪除 (Delete 或 Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInputElement(e.target)) {
          e.preventDefault();
          onDelete?.();
        }
      }
      
      // 全選 (Cmd/Ctrl + A)
      if (metaKey && e.key === 'a') {
        e.preventDefault();
        onSelectAll?.();
      }
      
      // 方向鍵導航
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!isInputElement(e.target)) {
          e.preventDefault();
          onNavigate?.(e.key as ArrowKey);
        }
      }
      
      // Tab 鍵導航到下一個儲存格
      if (e.key === 'Tab') {
        e.preventDefault();
        onNavigate?.(e.shiftKey ? 'ShiftTab' : 'Tab');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste, onUndo, onRedo, onDelete, onSelectAll, onNavigate]);
}
```

#### 增強 EditableCell 組件
```typescript
// components/common/EditableCell.tsx 改進
interface EditableCellProps {
  // ... 現有 props
  onSubmit?: () => void; // Enter 確認
  onCancel?: () => void; // Esc 取消
  onTab?: (shift: boolean) => void; // Tab 導航
  autoFocus?: boolean;
}

// 處理鍵盤事件
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSubmit?.();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    onCancel?.();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    onTab?.(e.shiftKey);
  }
};
```

### 4. 實作儲存格選擇和批量操作

#### 儲存格選擇狀態管理
```typescript
// NotionStyleTableV2.tsx
const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
const [focusedCell, setFocusedCell] = useState<{ rowId: string; columnKey: string } | null>(null);
const [copiedData, setCopiedData] = useState<any>(null);

// 生成儲存格 ID
const getCellId = (rowId: string, columnKey: string) => `${rowId}-${columnKey}`;

// 處理儲存格點擊
const handleCellClick = (rowId: string, columnKey: string, e: React.MouseEvent) => {
  const cellId = getCellId(rowId, columnKey);
  
  if (e.metaKey || e.ctrlKey) {
    // 多選
    const newSelection = new Set(selectedCells);
    if (newSelection.has(cellId)) {
      newSelection.delete(cellId);
    } else {
      newSelection.add(cellId);
    }
    setSelectedCells(newSelection);
  } else if (e.shiftKey && focusedCell) {
    // 範圍選擇
    const cells = getCellsInRange(focusedCell, { rowId, columnKey });
    setSelectedCells(new Set(cells));
  } else {
    // 單選
    setSelectedCells(new Set([cellId]));
    setFocusedCell({ rowId, columnKey });
  }
};

// 複製選中的儲存格
const handleCopy = () => {
  if (selectedCells.size === 0) return;
  
  const cellsData = Array.from(selectedCells).map(cellId => {
    const [rowId, columnKey] = cellId.split('-');
    const row = data.find(r => r.id === rowId);
    return row ? row[columnKey] : '';
  });
  
  setCopiedData(cellsData);
  
  // 複製到系統剪貼簿
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cellsData.join('\t'));
  }
};

// 貼上到選中的儲存格
const handlePaste = async () => {
  if (!copiedData || selectedCells.size === 0) return;
  
  const updates: Array<{ rowId: string; columnKey: string; value: any }> = [];
  const cellsArray = Array.from(selectedCells);
  
  copiedData.forEach((value: any, index: number) => {
    if (index < cellsArray.length) {
      const [rowId, columnKey] = cellsArray[index].split('-');
      updates.push({ rowId, columnKey, value });
    }
  });
  
  // 批量更新
  for (const update of updates) {
    await onUpdateCell?.(update.rowId, update.columnKey, update.value);
  }
};
```

### 5. 視覺回饋改進

```typescript
// 儲存格樣式
tableCellContent: {
  padding: 8,
  minHeight: 32,
  cursor: 'text',
},

tableCellSelected: {
  backgroundColor: 'rgba(35, 131, 226, 0.1)', // 淡藍色背景
  borderColor: '#2383e2',
  borderWidth: 1,
},

tableCellFocused: {
  borderColor: '#2383e2',
  borderWidth: 2,
  boxShadow: '0 0 0 1px #2383e2', // Web only
},

tableCellEditing: {
  backgroundColor: '#ffffff',
  borderColor: '#2383e2',
  borderWidth: 2,
}
```

## 實施步驟

### 第一階段：修復視覺問題（30分鐘）
1. ✅ 修改 DatabaseToolbar 按鈕顏色
2. ✅ 簡化內聯新增列樣式
3. ✅ 移除不必要的視覺元素

### 第二階段：鍵盤快捷鍵（1小時）
1. ✅ 創建 useTableKeyboardShortcuts hook
2. ✅ 增強 EditableCell 鍵盤支援
3. ✅ 實作 Tab 導航
4. ✅ 測試各種快捷鍵

### 第三階段：儲存格選擇（1小時）
1. ✅ 實作儲存格選擇邏輯
2. ✅ 支援多選和範圍選擇
3. ✅ 實作複製貼上功能
4. ✅ 添加視覺回饋

## 驗證標準

### 視覺測試
- [ ] 工具列按鈕使用灰色背景
- [ ] 內聯新增列沒有特殊樣式
- [ ] 編輯狀態有清晰的視覺回饋

### 功能測試
- [ ] Cmd/Ctrl + C 複製儲存格
- [ ] Cmd/Ctrl + V 貼上資料
- [ ] Cmd/Ctrl + Z 復原操作
- [ ] Tab/Shift+Tab 儲存格導航
- [ ] Enter 確認編輯
- [ ] Esc 取消編輯
- [ ] 點擊儲存格直接編輯

### 使用體驗
- [ ] 操作流暢無延遲
- [ ] 快捷鍵響應迅速
- [ ] 視覺回饋清晰

## 風險評估

### 潛在風險
1. **瀏覽器相容性** - 剪貼簿 API 可能不支援舊瀏覽器
2. **效能問題** - 大量儲存格選擇可能影響效能
3. **快捷鍵衝突** - 可能與瀏覽器快捷鍵衝突

### 緩解措施
1. 提供 fallback 方案
2. 限制最大選擇數量
3. 只在表格獲得焦點時啟用快捷鍵

## 參考資源

### 內部檔案
- `/src/components/database/DatabaseToolbar.tsx` - 工具列組件
- `/src/components/database/NotionStyleTableV2.tsx` - 表格組件
- `/src/components/common/EditableCell.tsx` - 可編輯儲存格
- `/src/hooks/useDatabaseKeyboardShortcuts.ts` - 現有快捷鍵

### 外部文檔
- [Google Sheets 鍵盤快捷鍵](https://support.google.com/docs/answer/181110)
- [Notion 鍵盤快捷鍵](https://www.notion.so/help/keyboard-shortcuts)
- [Clipboard API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

## 成功標準

1. **視覺簡潔** - 介面乾淨，沒有不必要的裝飾
2. **操作直覺** - 使用者可以像使用 Google Sheets 一樣操作
3. **快捷鍵完整** - 支援常用的編輯快捷鍵
4. **效能良好** - 操作響應迅速，無卡頓

## 實作信心評分：9/10

加分原因：
- 需求明確，技術方案成熟（+2）
- 有現成的參考實作（+1）
- 改動範圍可控（+1）

扣分原因：
- 需要處理跨瀏覽器相容性（-1）