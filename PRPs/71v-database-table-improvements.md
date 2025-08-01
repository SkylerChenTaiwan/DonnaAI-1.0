# PRP-62: 資料庫表格改進 - 移除標題、新增列驗證、屬性按鈕位置

## 概述
改進資料庫表格介面，包含三個主要改動：
1. 移除表格標題區塊（"表格"文字和圖標）
2. 實作類似 Google Sheets 的新增列驗證行為
3. 將"新增屬性"按鈕移至工具列（與篩選、排序同一列）

## 背景
使用者回饋：
- 表格上方的"表格"標題區塊是多餘的
- 新增列時若有必填欄位未填會直接失敗，體驗不佳
- "新增屬性"按鈕位置不符合 Notion 的設計慣例

## 研究成果

### 1. 現有程式碼結構
- **GlideNotionTable.tsx**: 表格元件，包含標題區塊（第291-302行）
- **DatabaseToolbar.tsx**: 工具列元件，包含篩選、排序等按鈕
- **Firebase服務**: 在 `createCustomer`、`createRecord`、`createTask` 中有必填欄位驗證
- **現有驗證模式**: 使用 Zod 進行資料驗證（`form-schemas.ts`）

### 2. Glide Data Grid 驗證支援
- 不提供內建的驗證狀態管理
- 需要自行實作 pending changes 追蹤
- 支援 `validateCell` 回調但無法顯示驗證訊息
- 參考：https://github.com/glideapps/glide-data-grid/issues/838

### 3. 類似功能參考
- **EditableDataTable.tsx**: 已有 cell 驗證器和錯誤訊息顯示的實作
- **MUI Data Grid**: 使用 `preProcessEditCellProps` 進行驗證
- **Google Sheets 行為**: 允許暫存無效資料，離開時提示

## 實作方案

### 架構設計
```typescript
// 新增的 pending changes 狀態管理
interface PendingChange {
  rowId: string;
  columnKey: string;
  value: any;
  originalValue: any;
  validationError?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// 新增列的暫存狀態
interface DraftRow {
  id: string;
  data: Record<string, any>;
  validationErrors: Record<string, string>;
  isNew: boolean;
}
```

### 實作步驟

#### 1. 移除表格標題區塊
- 檔案：`src/components/database/web/GlideNotionTable.tsx`
- 移除第291-302行的標題區塊
- 保留"新增屬性"按鈕的功能，準備移至工具列

#### 2. 新增屬性按鈕移至工具列
- 檔案：`src/components/database/DatabaseToolbar.tsx`
- 在工具列右側新增"新增屬性"按鈕
- 更新 `DatabaseScreen.tsx` 傳遞 `onAddColumn` 回調

#### 3. 實作 Pending Changes 系統
- 建立新的 hook：`src/hooks/usePendingChanges.ts`
- 追蹤所有未儲存的變更
- 實作驗證邏輯
- 處理離開頁面時的提示

#### 4. 修改新增列行為
- 允許新增空白列（不立即儲存到 Firebase）
- 實作 inline 驗證提示
- 離開頁面時檢查並提示未儲存的變更

### 詳細實作

#### usePendingChanges Hook
```typescript
// src/hooks/usePendingChanges.ts
import { useState, useCallback, useEffect } from 'react';
import { CustomerFormSchema, RecordFormSchema, TaskFormSchema } from '@/services/validation/form-schemas';

export function usePendingChanges(tableType: 'customers' | 'records' | 'tasks') {
  const [pendingChanges, setPendingChanges] = useState<Map<string, DraftRow>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 驗證函數
  const validateRow = useCallback((row: Record<string, any>) => {
    const schema = {
      customers: CustomerFormSchema,
      records: RecordFormSchema,
      tasks: TaskFormSchema,
    }[tableType];

    try {
      schema.parse(row);
      return { isValid: true, errors: {} };
    } catch (error) {
      // 解析 Zod 錯誤
      const errors = {};
      if (error.errors) {
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
      }
      return { isValid: false, errors };
    }
  }, [tableType]);

  // 新增或更新 pending change
  const updatePendingChange = useCallback((rowId: string, field: string, value: any) => {
    setPendingChanges(prev => {
      const updated = new Map(prev);
      const existing = updated.get(rowId) || { 
        id: rowId, 
        data: {}, 
        validationErrors: {},
        isNew: rowId.startsWith('draft_')
      };
      
      existing.data[field] = value;
      
      // 重新驗證整列
      const validation = validateRow(existing.data);
      existing.validationErrors = validation.errors;
      
      updated.set(rowId, existing);
      setHasUnsavedChanges(true);
      return updated;
    });
  }, [validateRow]);

  // 頁面離開提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    pendingChanges,
    hasUnsavedChanges,
    updatePendingChange,
    validateRow,
    clearPendingChanges: () => {
      setPendingChanges(new Map());
      setHasUnsavedChanges(false);
    }
  };
}
```

#### 修改後的 GlideNotionTable
```typescript
// 移除標題區塊，新增驗證提示
const drawCell = useCallback((args: any, drawContent: () => void) => {
  const { ctx, cell, rect, theme, col, row } = args;
  const column = columns[col];
  const rowData = data[row];
  
  // 檢查是否有驗證錯誤
  const validationError = getValidationError?.(rowData.id, column.key);
  
  if (validationError) {
    // 繪製紅色邊框和錯誤提示
    ctx.strokeStyle = '#e03e3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
    
    // 顯示錯誤圖標
    ctx.fillStyle = '#e03e3e';
    ctx.font = '12px sans-serif';
    ctx.fillText('!', rect.x + rect.width - 10, rect.y + 15);
  }
  
  // 原有的渲染邏輯...
}, [columns, data, getValidationError]);
```

## 任務清單

1. **移除表格標題** ✅
   - 修改 `GlideNotionTable.tsx` 移除標題區塊
   - 保留新增屬性按鈕邏輯

2. **更新工具列** ✅
   - 修改 `DatabaseToolbar.tsx` 新增"新增屬性"按鈕
   - 更新 props 介面

3. **建立 Pending Changes Hook** ✅
   - 建立 `usePendingChanges.ts`
   - 實作驗證邏輯
   - 實作離開頁面提示

4. **整合到資料庫畫面** ✅
   - 修改 `DatabaseScreen.tsx` 使用新 hook
   - 傳遞驗證錯誤到表格元件
   - 處理儲存邏輯

5. **測試與優化** ✅
   - 測試新增列流程
   - 測試驗證提示
   - 測試離開頁面警告

## 驗證標準

### 功能驗證
```bash
# 1. 啟動開發伺服器
npm run web

# 2. 手動測試
# - 確認表格標題已移除
# - 確認新增屬性按鈕在工具列中
# - 測試新增空白列不會失敗
# - 測試必填欄位顯示紅框
# - 測試離開頁面時有提示
```

### 程式碼品質
```bash
# TypeScript 類型檢查
npm run type-check

# ESLint 檢查
npm run lint

# 格式化
npm run format
```

## 潛在問題與解決方案

### 1. 效能考量
- **問題**: 每次編輯都觸發整列驗證可能影響效能
- **解決**: 使用 debounce 延遲驗證，或只驗證修改的欄位

### 2. 大量未儲存資料
- **問題**: 使用者可能累積大量未儲存的變更
- **解決**: 顯示未儲存變更數量，提供批次儲存按鈕

### 3. 驗證訊息顯示
- **問題**: Glide Data Grid 不支援原生 tooltip
- **解決**: 使用自訂渲染在儲存格內顯示錯誤圖標，hover 時顯示完整訊息

## 參考資源

- [Glide Data Grid 文檔](https://docs.grid.glideapps.com/)
- [MUI Data Grid 驗證](https://mui.com/x/react-data-grid/editing/#validation)
- [React Hook Form 驗證模式](https://react-hook-form.com/advanced-usage#CustomHookwithValidation)
- 內部參考：`EditableDataTable.tsx` 的驗證實作

## 成功指標

1. ✅ 表格標題區塊已移除
2. ✅ 新增屬性按鈕顯示在工具列
3. ✅ 新增列時不會因必填欄位而失敗
4. ✅ 必填欄位有視覺提示（紅框）
5. ✅ 離開頁面時提示未儲存的變更
6. ✅ 程式碼通過所有檢查

## 信心評分：8/10

扣分原因：
- Glide Data Grid 的驗證支援有限，需要較多自訂實作
- 需要仔細處理效能問題，避免過度渲染

加分原因：
- 已有類似的驗證模式可參考（EditableDataTable）
- 使用現有的 Zod schema 進行驗證
- 架構清晰，實作路徑明確