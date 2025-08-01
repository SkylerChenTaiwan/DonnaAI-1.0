# PRP-70: Notion UI 設計系統精緻化

## 📋 專案需求概述

基於專業 UI 設計分析，徹底重構視覺系統以達到 Notion 的品質標準，解決顏色、字體、間距和輸入方式等核心設計問題。

## 🎯 核心問題與解決方案

### ⚠️ 新增的關鍵設計原則
1. **欄位寬度彈性**：使用 `table-layout: auto` 讓欄位根據內容自動調整寬度，而非強制均分
2. **適當留白**：通過 wrapper 提供 60px 左右留白，而非讓表格佔滿整個螢幕
3. **層次分明**：工具列使用透明背景，與表格保持適當間距（16px）

### 1. 色彩系統問題
**問題診斷**：原有灰階過於輕淡，缺乏層次感
- 當前：`#f7f6f3` (gray-05) 太淺，對比度不足
- Notion：使用更深的灰階創造清晰層次

**解決方案**：
```css
/* 精確的 Notion 色彩系統 */
--notion-background: #fbfbfa;      /* 溫暖的主背景 */
--notion-surface: #ffffff;         /* 純白表面 */
--notion-gray-05: #f7f7f5;        /* 極淺灰 - 懸停背景 */
--notion-gray-10: #efeeec;        /* 淺灰 - 分隔線 */
--notion-gray-15: #e9e9e7;        /* 內部分隔線 */
--notion-gray-30: #d3d3d1;        /* 主要邊框色 */
--notion-gray-40: #c4c4c2;        /* 滾動條 */
--notion-gray-50: #9b9a97;        /* 占位符文字 */
--notion-gray-60: #787774;        /* 輔助文字 */
--notion-gray-80: #37352f;        /* 主要文字 */
--notion-blue: #2383e2;           /* 主要操作色 */
--notion-blue-light: #ddebf1;     /* 藍色淺背景 */
--notion-hover-bg: rgba(55, 53, 47, 0.04);
--notion-selected-bg: rgba(35, 131, 226, 0.03);
```

### 2. 字體層級問題
**問題診斷**：字體過大，間距過寬
- 當前：14px 字體 + 36px 行高 = 過於寬鬆
- Notion：13px 字體 + 32px 行高 = 精緻緊湊

**解決方案**：
```css
/* 精確的字體系統 */
--notion-font-size-xs: 11px;      /* 輔助標籤 */
--notion-font-size-sm: 12px;      /* 次要文字 */
--notion-font-size-body: 13px;    /* 主要內容 */
--notion-font-size-title: 14px;   /* 標題 */
--notion-line-height-tight: 1.3;   /* 緊湊行高 */
--notion-line-height-normal: 1.5;  /* 正常行高 */
--notion-font-weight-normal: 400;
--notion-font-weight-medium: 500;
--notion-font-weight-semibold: 600;
```

### 3. 間距系統問題
**問題診斷**：內邊距過大導致界面鬆散
- 當前：`padding: 8px 12px` 過於寬鬆
- Notion：`padding: 6px 12px` 更加緊湊

**解決方案**：
```css
/* 緊湊的間距系統 */
--notion-space-xxs: 2px;
--notion-space-xs: 4px;
--notion-space-sm: 6px;
--notion-space-md: 8px;
--notion-space-base: 12px;
--notion-space-lg: 16px;
--notion-space-xl: 20px;
--notion-space-2xl: 24px;

/* 特定元素間距 */
--notion-cell-padding: 6px 12px;
--notion-header-padding: 8px 12px;
--notion-toolbar-padding: 12px 16px;
--notion-cell-height: 32px;
--notion-header-height: 36px;
```

### 4. 輸入框樣式問題
**問題診斷**：聚焦狀態過於突兀
- 當前：2px 藍色邊框過於醒目
- Notion：1px 邊框 + 微妙陰影

**解決方案**：

### 5. 表格寬度與留白問題
**問題診斷**：欄位強制均分寬度，缺乏適當留白
- 當前：表格寬度 100%，欄位均分
- Notion：內容決定寬度，適當留白

**解決方案**：
```css
/* 表格不佔滿寬度 */
.notion-database-wrapper {
  padding: 0 60px; /* 左右留白 */
  max-width: 100%;
  margin: 0 auto;
}

/* 表格寬度由內容決定 */
.notion-database-table {
  width: auto;
  min-width: 100%;
  table-layout: auto; /* 不強制均分 */
}

/* 欄位寬度彈性 */
.notion-header-cell {
  width: auto;
  min-width: 120px;
  max-width: 400px;
}

/* 特定欄位寬度 */
.notion-header-cell[data-column="name"] {
  min-width: 200px;
}

.notion-header-cell[data-column="checkbox"] {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
}
```
```css
/* Notion 風格輸入框 */
.notion-cell-input {
  font-size: var(--notion-font-size-body);
  line-height: var(--notion-line-height-tight);
  color: var(--notion-gray-80);
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
  margin: 0;
  caret-color: var(--notion-blue);
}

/* 聚焦狀態 - 單元格容器 */
.notion-cell-editing {
  background: var(--notion-surface);
  box-shadow: 
    0 0 0 1px var(--notion-blue),
    0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 100;
  position: relative;
  transform: scale(1.002);
}

/* 編輯時的藍色光暈效果 */
.notion-cell-editing::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--notion-blue-light);
  opacity: 0.1;
  border-radius: 3px;
  z-index: -1;
}
```

## 🏗️ 完整實作計劃

### 階段 1: 更新設計令牌系統 (30 分鐘)

#### 1.1 更新 NotionTokens.ts
```typescript
export const NotionTokens = {
  colors: {
    // 背景層次
    background: '#fbfbfa',
    surface: '#ffffff',
    
    // 精確的灰階系統
    gray05: '#f7f7f5',
    gray10: '#efeeec',
    gray15: '#e9e9e7',
    gray30: '#d3d3d1',
    gray40: '#c4c4c2',
    gray50: '#9b9a97',
    gray60: '#787774',
    gray70: '#64625f',
    gray80: '#37352f',
    gray90: '#2f2e2a',
    
    // 功能色
    blue: '#2383e2',
    blueLight: '#ddebf1',
    red: '#eb5757',
    redLight: '#fbe4e4',
    
    // 特殊色
    hoverBg: 'rgba(55, 53, 47, 0.04)',
    selectedBg: 'rgba(35, 131, 226, 0.03)',
    borderTransparent: 'rgba(227, 226, 224, 0.5)',
  },
  
  typography: {
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    sizes: {
      xs: '11px',
      sm: '12px',
      body: '13px',
      title: '14px',
      large: '16px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeights: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  
  spacing: {
    xxs: '2px',
    xs: '4px',
    sm: '6px',
    md: '8px',
    base: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  
  sizing: {
    cellHeight: '32px',
    headerHeight: '36px',
    toolbarHeight: '44px',
    minColumnWidth: '120px',
    checkboxSize: '14px',
    iconSize: '16px',
  },
  
  borders: {
    width: '1px',
    style: 'solid',
    radius: '3px',
    radiusLarge: '6px',
  },
  
  effects: {
    transitionFast: '120ms',
    transitionNormal: '200ms',
    transitionSlow: '300ms',
    shadowSubtle: '0 1px 3px rgba(0, 0, 0, 0.02)',
    shadowNormal: '0 2px 4px rgba(0, 0, 0, 0.04)',
    shadowElevated: '0 4px 8px rgba(0, 0, 0, 0.08)',
  },
};
```

### 階段 2: 重寫核心 CSS 系統 (1 小時)

#### 2.1 建立 NotionDatabaseV4.css
```css
/* === 設計令牌 === */
:root {
  /* 背景層次 */
  --notion-background: #fbfbfa;
  --notion-surface: #ffffff;
  
  /* 精確灰階 */
  --notion-gray-05: #f7f7f5;
  --notion-gray-10: #efeeec;
  --notion-gray-15: #e9e9e7;
  --notion-gray-30: #d3d3d1;
  --notion-gray-40: #c4c4c2;
  --notion-gray-50: #9b9a97;
  --notion-gray-60: #787774;
  --notion-gray-70: #64625f;
  --notion-gray-80: #37352f;
  --notion-gray-90: #2f2e2a;
  
  /* 功能色 */
  --notion-blue: #2383e2;
  --notion-blue-light: #ddebf1;
  --notion-red: #eb5757;
  --notion-red-light: #fbe4e4;
  
  /* 特殊色 */
  --notion-hover-bg: rgba(55, 53, 47, 0.04);
  --notion-selected-bg: rgba(35, 131, 226, 0.03);
  --notion-border-transparent: rgba(227, 226, 224, 0.5);
  
  /* 字體 */
  --notion-font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --notion-font-size-xs: 11px;
  --notion-font-size-sm: 12px;
  --notion-font-size-body: 13px;
  --notion-font-size-title: 14px;
  --notion-line-height-tight: 1.3;
  --notion-line-height-normal: 1.5;
  
  /* 間距 */
  --notion-space-xxs: 2px;
  --notion-space-xs: 4px;
  --notion-space-sm: 6px;
  --notion-space-md: 8px;
  --notion-space-base: 12px;
  --notion-space-lg: 16px;
  
  /* 尺寸 */
  --notion-cell-height: 32px;
  --notion-header-height: 36px;
  --notion-toolbar-height: 44px;
  
  /* 效果 */
  --notion-transition-fast: 120ms;
  --notion-transition-normal: 200ms;
  --notion-shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.02);
  --notion-shadow-normal: 0 2px 4px rgba(0, 0, 0, 0.04);
}

/* === 容器系統 === */
.notion-database-container {
  font-family: var(--notion-font-family);
  font-size: var(--notion-font-size-body);
  line-height: var(--notion-line-height-normal);
  color: var(--notion-gray-80);
  background: var(--notion-background);
  width: 100%;
  height: 100%;
  position: relative;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* === 內容包裝器 - 提供適當留白 === */
.notion-database-wrapper {
  padding: 20px 60px; /* 上下 20px，左右 60px 留白 */
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto; /* 允許水平滾動 */
  overflow-y: visible;
}

/* 小螢幕適配 */
@media (max-width: 1024px) {
  .notion-database-wrapper {
    padding: 16px 32px;
  }
}

@media (max-width: 768px) {
  .notion-database-wrapper {
    padding: 12px 16px;
  }
}

/* === 工具列系統 === */
.notion-database-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--notion-space-base) 0; /* 左右不需要額外 padding，使用 wrapper 的 */
  margin-bottom: var(--notion-space-lg); /* 與表格的間距 */
  background: transparent;
  height: var(--notion-toolbar-height);
}

.notion-view-info {
  font-size: var(--notion-font-size-body);
  color: var(--notion-gray-60);
  font-weight: 500;
}

/* === 表格系統 === */
.notion-database-table {
  width: auto; /* 寬度由內容決定 */
  min-width: 100%; /* 最小佔滿容器 */
  border-collapse: separate;
  border-spacing: 0;
  background: var(--notion-surface);
  border: 1px solid var(--notion-gray-30);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: var(--notion-shadow-subtle);
  table-layout: auto; /* 自動調整欄位寬度 */
}

/* === 表頭系統 === */
.notion-header-row {
  background: var(--notion-gray-05);
  border-bottom: 1px solid var(--notion-gray-30);
}

.notion-header-cell {
  padding: var(--notion-space-md) var(--notion-space-base);
  border-right: 1px solid var(--notion-gray-15);
  font-weight: 500;
  font-size: var(--notion-font-size-body);
  color: var(--notion-gray-60);
  text-align: left;
  vertical-align: middle;
  width: auto; /* 自動寬度 */
  min-width: 120px; /* 最小寬度 */
  max-width: 400px; /* 最大寬度，避免過寬 */
  height: var(--notion-header-height);
  position: relative;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 特定欄位寬度設定 */
.notion-header-cell[data-column="select"],
.notion-header-cell[data-column="checkbox"] {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  text-align: center;
}

.notion-header-cell[data-column="name"],
.notion-header-cell[data-column="title"] {
  min-width: 200px; /* 名稱欄位較寬 */
}

.notion-header-cell[data-column="status"],
.notion-header-cell[data-column="type"] {
  min-width: 100px;
  max-width: 150px;
}

.notion-header-cell[data-column="date"] {
  min-width: 120px;
  max-width: 160px;
}

.notion-header-cell:last-child {
  border-right: none;
}

.notion-header-cell:hover {
  background: var(--notion-gray-10);
  cursor: pointer;
}

/* === 資料列系統 === */
.notion-data-row {
  background: var(--notion-surface);
  transition: background-color var(--notion-transition-fast) ease;
  position: relative;
}

.notion-data-row:hover {
  background: var(--notion-hover-bg);
}

/* 懸停時的左側指示線 */
.notion-data-row:hover::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--notion-blue);
  opacity: 0.4;
}

/* === 單元格系統 === */
.notion-cell {
  padding: var(--notion-space-sm) var(--notion-space-base);
  border-right: 1px solid var(--notion-gray-15);
  border-bottom: 1px solid var(--notion-gray-15);
  vertical-align: middle;
  height: var(--notion-cell-height);
  font-size: var(--notion-font-size-body);
  color: var(--notion-gray-80);
  position: relative;
  line-height: var(--notion-line-height-tight);
}

.notion-cell:last-child {
  border-right: none;
}

.notion-data-row:last-child .notion-cell {
  border-bottom: none;
}

/* === 單元格內容系統 === */
.notion-cell-content {
  cursor: text;
  word-wrap: break-word;
  white-space: pre-wrap;
  min-height: 20px;
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: 2px;
  transition: background-color var(--notion-transition-fast) ease;
}

.notion-cell-content:hover {
  background: var(--notion-hover-bg);
}

.notion-cell-placeholder {
  color: var(--notion-gray-50);
  font-style: normal;
}

/* === 編輯狀態 === */
.notion-cell-editing {
  background: var(--notion-surface);
  box-shadow: 
    0 0 0 1px var(--notion-blue),
    0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 100;
  position: relative;
  transform: scale(1.002);
}

/* 編輯時的藍色光暈 */
.notion-cell-editing::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--notion-blue-light);
  opacity: 0.1;
  border-radius: 3px;
  z-index: -1;
}

.notion-cell-input {
  font: inherit;
  font-size: var(--notion-font-size-body);
  line-height: var(--notion-line-height-tight);
  color: var(--notion-gray-80);
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
  margin: 0;
  caret-color: var(--notion-blue);
}

/* 輸入時自動選中文字 */
.notion-cell-input::selection {
  background: var(--notion-blue-light);
}

/* === 新增列系統 === */
.notion-add-row {
  background: var(--notion-surface);
}

.notion-add-row-button {
  width: 100%;
  padding: var(--notion-space-sm) var(--notion-space-base);
  background: none;
  border: none;
  color: var(--notion-gray-50);
  font-size: var(--notion-font-size-body);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--notion-space-xs);
  transition: all var(--notion-transition-fast) ease;
  height: var(--notion-cell-height);
}

.notion-add-row-button:hover {
  color: var(--notion-gray-70);
  background: var(--notion-hover-bg);
}

.notion-add-icon {
  font-size: 14px;
  font-weight: 300;
  opacity: 0.8;
}

/* === 按鈕系統 === */
.notion-button {
  display: inline-flex;
  align-items: center;
  gap: var(--notion-space-xs);
  padding: var(--notion-space-xs) var(--notion-space-md);
  border: 1px solid var(--notion-gray-30);
  border-radius: 3px;
  background: var(--notion-surface);
  color: var(--notion-gray-70);
  font-size: var(--notion-font-size-sm);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--notion-transition-fast) ease;
  text-decoration: none;
  height: 28px;
  position: relative;
  overflow: hidden;
}

.notion-button:hover {
  background: var(--notion-gray-05);
  border-color: var(--notion-gray-40);
  transform: translateY(-1px);
  box-shadow: var(--notion-shadow-normal);
}

.notion-button:active {
  transform: translateY(0);
  box-shadow: var(--notion-shadow-subtle);
}

.notion-button-primary {
  background: var(--notion-blue);
  border-color: var(--notion-blue);
  color: white;
}

.notion-button-primary:hover {
  background: #1a6dc8;
  border-color: #1a6dc8;
}

/* === 動畫效果 === */
@keyframes notion-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes notion-focus-in {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.002);
  }
}

.notion-data-row {
  animation: notion-fade-in-up var(--notion-transition-normal) ease-out;
}

.notion-cell-editing {
  animation: notion-focus-in var(--notion-transition-fast) ease-out;
}

/* === 選取狀態 === */
.notion-data-row.selected {
  background: var(--notion-selected-bg);
}

.notion-data-row.selected:hover {
  background: var(--notion-selected-bg);
}

/* === 狀態標籤 === */
.notion-status-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: var(--notion-font-size-xs);
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
}

.notion-status-tag.completed {
  color: #448361;
  background: #edf3ec;
}

.notion-status-tag.in-progress {
  color: #5e86c7;
  background: #e8f0ff;
}

.notion-status-tag.todo {
  color: #ca8532;
  background: #fef3e2;
}

/* === 空狀態 === */
.notion-empty-state {
  text-align: center;
  padding: 60px 40px;
}

.notion-empty-icon {
  font-size: 36px;
  opacity: 0.2;
  margin-bottom: 12px;
}

.notion-empty-content p:first-of-type {
  color: var(--notion-gray-80);
  font-size: var(--notion-font-size-title);
  font-weight: 500;
  margin-bottom: 4px;
}

.notion-empty-content p:last-of-type {
  color: var(--notion-gray-60);
  font-size: var(--notion-font-size-body);
}

/* === 滾動條樣式 === */
.notion-database-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.notion-database-container::-webkit-scrollbar-track {
  background: transparent;
}

.notion-database-container::-webkit-scrollbar-thumb {
  background: var(--notion-gray-40);
  border: 3px solid var(--notion-background);
  border-radius: 6px;
}

.notion-database-container::-webkit-scrollbar-thumb:hover {
  background: var(--notion-gray-50);
}

/* === 響應式設計 === */
@media (max-width: 768px) {
  .notion-header-cell,
  .notion-cell {
    min-width: 100px;
    padding: var(--notion-space-xs) var(--notion-space-md);
    font-size: var(--notion-font-size-sm);
  }
  
  .notion-toolbar {
    padding: var(--notion-space-md);
  }
}
```

### 階段 3: 更新元件實作 (30 分鐘)

#### 3.1 更新 TanStackNotionTableV3.tsx - 加入包裝器
```typescript
// 在 return 語句中加入包裝器
return (
  <div className="notion-database-container">
    <div className="notion-database-wrapper"> {/* 新增包裝器 */}
      <DebugInfo />
      <NotionDatabaseToolbar
        onAddRow={handleAddRow}
        onViewSettings={handleViewSettings}
        viewCount={data.length}
        selectedCount={selectedItems.length}
      />
      
      <table className="notion-database-table">
        {/* ... 表格內容 ... */}
      </table>
    </div>
  </div>
);
```

#### 3.2 更新欄位定義 - 加入 data-column 屬性
```typescript
// 在表頭渲染時加入 data-column
<th 
  key={header.id} 
  className="notion-header-cell"
  data-column={header.column.id} // 加入這行
>
  {header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())}
</th>

// 單元格也要加上對應的 class
<td 
  key={cell.id} 
  className="notion-cell"
  data-column={cell.column.id} // 加入這行
>
```

#### 3.3 更新 NotionDatabaseToolbar.tsx
```typescript
import React from 'react';

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
          {viewCount} 項
          {selectedCount > 0 && ` • ${selectedCount} 已選取`}
        </div>
      </div>
      
      <div className="notion-toolbar-right">
        <button 
          className="notion-button" 
          onClick={onViewSettings}
          title="檢視設定"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM15 8a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM8 13a1 1 0 001 1h2a1 1 0 100-2H9a1 1 0 00-1 1zM1 8a1 1 0 011-1h2a1 1 0 110 2H2a1 1 0 01-1-1z"/>
          </svg>
          檢視
        </button>
        
        <button 
          className="notion-button notion-button-primary" 
          onClick={onAddRow}
          title="新增列"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 017 1z"/>
          </svg>
          新增
        </button>
      </div>
    </div>
  );
};
```

#### 3.2 更新 NotionTableCell.tsx - 增強 autoFocus 行為
```typescript
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
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // 自動選中文字
      }, 50);
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
    } else if (e.key === 'Tab') {
      // Tab 鍵保存並移到下一個單元格
      handleSave();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback(() => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
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
      title={disabled ? '' : '點擊編輯'}
    >
      {value || <span className="notion-cell-placeholder">{placeholder || '空白'}</span>}
    </div>
  );
};
```

## 🧪 測試計劃

### 視覺品質檢查清單
- [ ] 表頭背景色為 `#f7f7f5` (極淺灰)
- [ ] 主要邊框色為 `#d3d3d1` (明顯的灰色線條)
- [ ] 字體大小為 13px，行高緊湊
- [ ] 單元格內邊距為 `6px 12px`
- [ ] 懸停效果顯示藍色左側指示線
- [ ] 聚焦時有微妙的放大效果和陰影
- [ ] 新增列在表格第一列位置
- [ ] 按鈕有上升效果和陰影變化
- [ ] **表格左右有 60px 留白**
- [ ] **欄位寬度根據內容自動調整**
- [ ] **新增欄位不會強制均分寬度**
- [ ] **工具列與表格有適當間距**

### 功能測試檢查清單
- [ ] 點擊單元格自動選中文字
- [ ] Tab 鍵可以在單元格間導航
- [ ] Enter 儲存，Escape 取消
- [ ] 新增列的名稱欄位自動聚焦
- [ ] 工具列按鈕響應正常
- [ ] 滾動條樣式符合 Notion 風格

## 📊 預期成果

### 視覺相似度提升
| 設計元素 | 修改前 | 修改後 | 改進幅度 |
|---------|--------|--------|----------|
| 色彩對比 | 60% | 95% | +35% |
| 字體層級 | 70% | 92% | +22% |
| 間距系統 | 65% | 90% | +25% |
| 輸入體驗 | 50% | 88% | +38% |
| 整體質感 | 60% | 93% | +33% |

### 關鍵改進
1. **色彩層次**：清晰的視覺分層，專業感十足
2. **緊湊精緻**：合理的空間利用，界面更加精煉
3. **細節到位**：陰影、過渡、動畫等細節完善
4. **操作流暢**：編輯體驗自然，反饋及時

## 🚀 部署檢查清單

- [ ] 更新 NotionTokens.ts 設計令牌
- [ ] 建立 NotionDatabaseV4.css 新樣式
- [ ] 更新 App.tsx 引用新 CSS
- [ ] 更新 TanStackNotionTableV3 使用新樣式
- [ ] 測試所有視覺和功能改進
- [ ] 確認與 Notion 的相似度達到 90% 以上

---

**預估時間**: 2-3 小時  
**優先級**: 高  
**影響範圍**: Web 平台資料庫視覺品質  
**風險評估**: 低 (純視覺改進，不影響功能)