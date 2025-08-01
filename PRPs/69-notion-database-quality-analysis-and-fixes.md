# PRP-69: Notion 資料庫質感分析與修復

## 📋 專案需求概述

通過深入分析 Notion 資料庫的視覺設計原理，解決目前實作與 Notion 質感差距過大的問題，並修復 5 個關鍵功能問題。

## 🎯 主要目標

### 1. 質感與視覺品質分析修復
- **問題**：目前實作與 Notion 的質感風格差距很大
- **解決方案**：深入分析 Notion 的設計語言，重新實作視覺系統

### 2. 功能性問題修復
- **問題 1**：右上角新增按鈕沒有反應，檢視按鈕用途不明
- **問題 2**：新增列應該在第一列，不是中間隔開的空白列
- **問題 3**：新增項目時姓名欄無法填寫
- **問題 4**：表格欄位間距問題，看起來像獨立格子而非表格
- **問題 5**：欄位下方有縫隙，破壞表格整體感

## 🔍 Notion 設計原理分析

### 視覺設計核心原則

#### 1. 色彩系統
```css
/* Notion 色彩系統 */
--notion-white: #ffffff;
--notion-gray-05: #f7f6f3;        /* 表頭背景 */
--notion-gray-10: #f1f1ef;        /* 分隔線淺色 */
--notion-gray-20: #e9e9e7;        /* 主要分隔線 */
--notion-gray-40: #c1c0c0;        /* 次要分隔線 */
--notion-gray-50: #9b9a97;        /* 輔助文字 */  
--notion-gray-70: #64625f;        /* 次要文字 */
--notion-gray-90: #37352f;        /* 主要文字 */
--notion-blue: #2383e2;           /* 主要操作色 */
--notion-blue-light: #e8f2ff;     /* 藍色淺背景 */
```

#### 2. 字體系統
```css
/* Notion 字體層級 */
--notion-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--notion-text-small: 12px;        /* 輔助標籤 */
--notion-text-body: 14px;         /* 表格內容 */
--notion-text-title: 16px;        /* 標題 */
--notion-line-height: 1.5;        /* 行高比例 */
--notion-font-weight-normal: 400;
--notion-font-weight-medium: 500;
--notion-font-weight-semibold: 600;
```

#### 3. 間距系統
```css
/* Notion 間距系統 */
--notion-space-xs: 2px;
--notion-space-sm: 4px;
--notion-space-md: 8px;
--notion-space-lg: 12px;
--notion-space-xl: 16px;
--notion-space-2xl: 24px;
--notion-space-3xl: 32px;
```

#### 4. 表格結構設計原則
- **無縫隙設計**：表格單元格之間沒有空隙
- **邊框系統**：使用極細的邊框 (1px) 創造分隔感
- **背景層次**：透過微妙的背景色差異建立視覺層次
- **內襯系統**：一致的內邊距創造呼吸空間

## 🏗️ 實作計劃

### 階段 1: 視覺設計系統重建 (1-2 小時)

#### 1.1 建立 Notion 設計令牌系統
```typescript
// src/components/database/web/design-tokens/NotionTokens.ts
export const NotionTokens = {
  colors: {
    white: '#ffffff',
    gray05: '#f7f6f3',
    gray10: '#f1f1ef', 
    gray20: '#e9e9e7',
    gray40: '#c1c0c0',
    gray50: '#9b9a97',
    gray70: '#64625f',
    gray90: '#37352f',
    blue: '#2383e2',
    blueLight: '#e8f2ff',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      small: '12px',
      body: '14px', 
      title: '16px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: 1.5,
  },
  spacing: {
    xs: '2px',
    sm: '4px', 
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
  },
  borders: {
    width: '1px',
    style: 'solid',
    radius: '3px',
  },
};
```

#### 1.2 重寫 CSS 樣式系統
```css
/* src/components/database/web/styles/NotionDatabaseV3.css */

/* === 設計令牌 === */
:root {
  --notion-white: #ffffff;
  --notion-gray-05: #f7f6f3;
  --notion-gray-10: #f1f1ef;
  --notion-gray-20: #e9e9e7;
  --notion-gray-40: #c1c0c0;
  --notion-gray-50: #9b9a97;
  --notion-gray-70: #64625f;
  --notion-gray-90: #37352f;
  --notion-blue: #2383e2;
  --notion-blue-light: #e8f2ff;
  
  --notion-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --notion-font-size-small: 12px;
  --notion-font-size-body: 14px;
  --notion-font-size-title: 16px;
  --notion-line-height: 1.5;
  
  --notion-space-xs: 2px;
  --notion-space-sm: 4px;
  --notion-space-md: 8px;
  --notion-space-lg: 12px;
  --notion-space-xl: 16px;
  --notion-space-2xl: 24px;
  --notion-space-3xl: 32px;
  
  --notion-border-width: 1px;
  --notion-border-radius: 3px;
}

/* === 容器系統 === */
.notion-database-container {
  font-family: var(--notion-font-family);
  font-size: var(--notion-font-size-body);
  line-height: var(--notion-line-height);
  color: var(--notion-gray-90);
  background: var(--notion-white);
  width: 100%;
  height: 100%;
  position: relative;
}

/* === 工具列系統 === */
.notion-database-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--notion-space-lg) var(--notion-space-lg) var(--notion-space-md);
  border-bottom: var(--notion-border-width) solid var(--notion-gray-20);
  background: var(--notion-white);
}

.notion-toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--notion-space-md);
}

.notion-toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--notion-space-sm);
}

/* === 表格系統 === */
.notion-database-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--notion-white);
  border: var(--notion-border-width) solid var(--notion-gray-20);
  border-radius: var(--notion-border-radius);
  overflow: hidden;
}

/* === 表頭系統 === */
.notion-header-row {
  background: var(--notion-gray-05);
}

.notion-header-cell {
  padding: var(--notion-space-md) var(--notion-space-lg);
  border-right: var(--notion-border-width) solid var(--notion-gray-20);
  border-bottom: var(--notion-border-width) solid var(--notion-gray-20);
  font-weight: 500;
  font-size: var(--notion-font-size-body);
  color: var(--notion-gray-70);
  text-align: left;
  vertical-align: middle;
  min-width: 140px;
  position: relative;
  user-select: none;
}

.notion-header-cell:last-child {
  border-right: none;
}

.notion-header-cell:hover {
  background: var(--notion-gray-10);
}

/* === 資料列系統 === */
.notion-data-row {
  background: var(--notion-white);
  transition: background-color 0.1s ease;
}

.notion-data-row:hover {
  background: rgba(247, 246, 243, 0.5);
}

.notion-data-row:last-child .notion-cell {
  border-bottom: none;
}

/* === 單元格系統 === */
.notion-cell {
  padding: var(--notion-space-md) var(--notion-space-lg);
  border-right: var(--notion-border-width) solid var(--notion-gray-10);
  border-bottom: var(--notion-border-width) solid var(--notion-gray-10);
  vertical-align: middle;
  min-height: 36px;
  font-size: var(--notion-font-size-body);
  color: var(--notion-gray-90);
  position: relative;
}

.notion-cell:last-child {
  border-right: none;
}

/* === 新增列系統 === */
.notion-add-row {
  background: var(--notion-white);
}

.notion-add-row-cell {
  padding: 0;
  border-right: var(--notion-border-width) solid var(--notion-gray-10);
  border-bottom: none;
}

.notion-add-row-cell:last-child {
  border-right: none;
}

.notion-add-row-button {
  width: 100%;
  padding: var(--notion-space-md) var(--notion-space-lg);
  background: none;
  border: none;
  color: var(--notion-gray-50);
  font-size: var(--notion-font-size-body);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--notion-space-md);
  transition: all 0.1s ease;
}

.notion-add-row-button:hover {
  color: var(--notion-gray-90);
  background: rgba(55, 53, 47, 0.03);
}

/* === 編輯狀態 === */
.notion-cell-editing {
  background: var(--notion-white);
  box-shadow: 0 0 0 2px var(--notion-blue);
  z-index: 10;
  position: relative;
}

.notion-cell-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 0;
  margin: 0;
}

/* === 按鈕系統 === */
.notion-button {
  display: inline-flex;
  align-items: center;
  gap: var(--notion-space-sm);
  padding: var(--notion-space-sm) var(--notion-space-md);
  border: var(--notion-border-width) solid var(--notion-gray-20);
  border-radius: var(--notion-border-radius);
  background: var(--notion-white);
  color: var(--notion-gray-70);
  font-size: var(--notion-font-size-body);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease;
  text-decoration: none;
}

.notion-button:hover {
  background: var(--notion-gray-05);
  border-color: var(--notion-gray-40);
}

.notion-button-primary {
  background: var(--notion-blue);
  border-color: var(--notion-blue);
  color: var(--notion-white);
}

.notion-button-primary:hover {
  background: #1a6bb8;
  border-color: #1a6bb8;
}

/* === 響應式設計 === */
@media (max-width: 768px) {
  .notion-header-cell,
  .notion-cell {
    min-width: 120px;
    padding: var(--notion-space-sm) var(--notion-space-md);
  }
  
  .notion-database-toolbar {
    padding: var(--notion-space-md);
  }
  
  .notion-toolbar-right {
    flex-direction: column;
    gap: var(--notion-space-xs);
  }
}
```

### 階段 2: 元件功能修復 (2-3 小時)

#### 2.1 修復工具列按鈕功能
```typescript
// src/components/database/web/NotionDatabaseToolbar.tsx
import React from 'react';
import { NotionTokens } from '../design-tokens/NotionTokens';

interface NotionDatabaseToolbarProps {
  onAddRow: () => void;
  onViewSettings: () => void;
  viewCount: number;
  selectedCount: number;
}

export const NotionDatabaseToolbar: React.FC<NotionDatabaseToolbarProps> = ({
  onAddRow,
  onViewSettings,
  viewCount,
  selectedCount,
}) => {
  return (
    <div className="notion-database-toolbar">
      <div className="notion-toolbar-left">
        <div className="notion-view-info">
          {viewCount} 項目
          {selectedCount > 0 && ` • ${selectedCount} 已選取`}
        </div>
      </div>
      
      <div className="notion-toolbar-right">
        <button 
          className="notion-button" 
          onClick={onViewSettings}
          title="檢視設定"
        >
          <span>⚙️</span>
          檢視
        </button>
        
        <button 
          className="notion-button notion-button-primary" 
          onClick={onAddRow}
          title="新增列"
        >
          <span>+</span>
          新增
        </button>
      </div>
    </div>
  );
};
```

#### 2.2 修復新增列位置和功能
```typescript
// src/components/database/web/TanStackNotionTableV3.tsx
import React, { useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { NotionDatabaseToolbar } from './NotionDatabaseToolbar';
import { NotionTableCell } from './NotionTableCell';

export const TanStackNotionTableV3: React.FC<TanStackNotionTableProps> = ({
  data,
  columns,
  onDataChange,
  onRowAdd,
  onRowDelete,
}) => {
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleAddRow = useCallback(() => {
    setIsAddingRow(true);
    setNewRowData({});
  }, []);

  const handleSaveNewRow = useCallback(() => {
    if (Object.keys(newRowData).length > 0) {
      onRowAdd?.(newRowData);
      setNewRowData({});
    }
    setIsAddingRow(false);
  }, [newRowData, onRowAdd]);

  const handleCancelNewRow = useCallback(() => {
    setIsAddingRow(false);
    setNewRowData({});
  }, []);

  const handleNewRowChange = useCallback((columnId: string, value: any) => {
    setNewRowData(prev => ({
      ...prev,
      [columnId]: value,
    }));
  }, []);

  return (
    <div className="notion-database-container">
      <NotionDatabaseToolbar
        onAddRow={handleAddRow}
        onViewSettings={() => console.log('View settings')}
        viewCount={data.length}
        selectedCount={0}
      />
      
      <table className="notion-database-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="notion-header-row">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="notion-header-cell">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        
        <tbody>
          {/* 新增列放在最前面 */}
          {isAddingRow && (
            <tr className="notion-add-row">
              {table.getLeafHeaders().map((header) => (
                <td key={header.id} className="notion-cell notion-cell-editing">
                  <NotionTableCell
                    value={newRowData[header.column.id] || ''}
                    onChange={(value) => handleNewRowChange(header.column.id, value)}
                    type={header.column.columnDef.meta?.type || 'text'}
                    placeholder={`輸入 ${header.column.columnDef.header}`}
                    autoFocus={header.column.id === 'name'}
                  />
                </td>
              ))}
              <td className="notion-cell">
                <div className="notion-row-actions">
                  <button 
                    className="notion-button notion-button-primary"
                    onClick={handleSaveNewRow}
                    disabled={Object.keys(newRowData).length === 0}
                  >
                    儲存
                  </button>
                  <button 
                    className="notion-button"
                    onClick={handleCancelNewRow}
                  >
                    取消
                  </button>
                </div>
              </td>
            </tr>
          )}

          {/* 現有資料列 */}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="notion-data-row">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="notion-cell">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 2.3 修復名稱欄位編輯問題
```typescript
// src/components/database/web/NotionTableCell.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';

interface NotionTableCellProps {
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: any }>;
}

export const NotionTableCell: React.FC<NotionTableCellProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  autoFocus = false,
  disabled = false,
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setIsEditing(true);
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSave = useCallback(() => {
    onChange(localValue);
    setIsEditing(false);
  }, [localValue, onChange]);

  const handleCancel = useCallback(() => {
    setLocalValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback(() => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [disabled, isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="notion-cell-input"
        type={type === 'number' ? 'number' : 'text'}
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div 
      className="notion-cell-content"
      onClick={handleClick}
      title="點擊編輯"
    >
      {value || <span className="notion-cell-placeholder">{placeholder}</span>}
    </div>
  );
};
```

### 階段 3: 整合與測試 (1 小時)

#### 3.1 更新主要資料庫元件
```typescript
// src/screens/database/DatabaseScreen.tsx - 更新部分
const renderWebDatabase = () => (
  <TanStackNotionTableV3
    data={currentData.data}
    columns={currentColumns}
    onDataChange={handleDataChange}
    onRowAdd={handleRowAdd}
    onRowDelete={handleRowDelete}
  />
);
```

#### 3.2 CSS 檔案整合
```typescript
// App.tsx - 更新 CSS 引用
import './src/components/database/web/styles/NotionDatabaseV3.css';
```

## 🧪 測試計劃

### 功能測試檢查清單
- [ ] 右上角新增按鈕功能正常
- [ ] 檢視按鈕顯示設定選項
- [ ] 新增列出現在表格第一列
- [ ] 名稱欄位可以正常輸入和編輯
- [ ] 表格欄位間無縫隙，呈現整體表格感
- [ ] 儲存和取消按鈕功能正常
- [ ] 鍵盤快捷鍵 (Enter 儲存, Escape 取消) 工作正常
- [ ] 響應式設計在不同螢幕尺寸下正常

### 視覺品質檢查清單
- [ ] 色彩系統符合 Notion 設計語言
- [ ] 字體層級和間距一致
- [ ] 表格邊框和分隔線正確
- [ ] Hover 狀態和互動反饋自然
- [ ] 整體視覺層次清晰

## 📚 技術規格

### 相依性
- `@tanstack/react-table`: ^8.20.5 (已安裝)
- `react`: ^18.2.0 (現有)
- `react-native`: ^0.75.2 (現有)

### 檔案結構
```
src/components/database/web/
├── design-tokens/
│   └── NotionTokens.ts (新增)
├── styles/
│   └── NotionDatabaseV3.css (新增)
├── NotionDatabaseToolbar.tsx (新增)
├── TanStackNotionTableV3.tsx (重寫)
└── NotionTableCell.tsx (改進)
```

### 效能考量
- CSS 使用 CSS 變數提升效能
- 避免內聯樣式減少重新計算
- 適當的 React.memo 和 useCallback 使用
- 表格虛擬化 (如果資料量大)

## 🚀 部署檢查清單

- [ ] TypeScript 類型檢查通過
- [ ] ESLint 規則檢查通過  
- [ ] Web 建置成功
- [ ] 功能測試完成
- [ ] 視覺回歸測試通過
- [ ] 響應式測試完成
- [ ] 效能測試通過
- [ ] Git 提交包含所有變更

## 📈 成功指標

### 定量指標
- 視覺相似度達到 95% 以上
- 所有 5 個功能問題完全解決
- 建置時間不增加超過 10%
- 包大小增加不超過 5KB

### 定性指標
- 使用者反饋：「看起來很像 Notion」
- 操作流暢度明顯改善
- 視覺層次清晰，專業感提升
- 互動體驗自然直觀

## 🔄 迭代計劃

### 第一版本 (本 PRP)
- 核心視覺系統建立
- 5 個主要問題修復
- 基本功能完整性

### 後續版本考量
- 進階互動動畫
- 拖拽排序功能
- 更多欄位類型支援
- 效能優化

---

**預估時間**: 4-6 小時  
**優先級**: 高  
**影響範圍**: Web 平台資料庫功能  
**風險評估**: 低 (主要為視覺改進和 bug 修復)