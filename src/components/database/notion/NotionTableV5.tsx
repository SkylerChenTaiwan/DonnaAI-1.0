/**
 * Notion 風格表格元件 V5 - 使用 TanStack Table
 * 徹底解決欄位寬度調整問題
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  ColumnResizeMode } from '@tanstack/react-table';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { NotionIcons } from './NotionIcons';
import { FilterPanel } from './components/FilterPanel';
import { SortPanel } from './components/SortPanel';
import { GroupPanel } from './components/GroupPanel';
import { ColumnManager } from './components/ColumnManager';
import { SearchBar } from './components/SearchBar';
// CSS 已移至動態載入，避免全域污染

interface NotionTableV5Props {
  data: any[];
  columns: any[];
  onCellUpdate?: (rowId: string, columnKey: string, value: any) => void;
  onRowClick?: (row: any) => void;
  onRowAdd?: () => void;
  onColumnAdd?: () => void;
  onColumnReorder?: (columns: any[]) => void;
  multiSelect?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  activeTab?: string;
}

export const NotionTableV5: React.FC<NotionTableV5Props> = ({
  data = [],
  columns: inputColumns = [],
  onCellUpdate,
  onRowClick,
  onRowAdd,
  onColumnAdd,
  onColumnReorder,
  multiSelect = false,
  selectedRows = [],
  onSelectionChange,
  loading = false,
  error = null,
  emptyMessage = '沒有資料',
  activeTab }) => {
  // 狀態管理
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    inputColumns.map(col => col.id)
  );
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  
  // 各種面板狀態
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // 按鈕引用
  const [filterButtonRef, setFilterButtonRef] = useState<HTMLElement | null>(null);
  const [sortButtonRef, setSortButtonRef] = useState<HTMLElement | null>(null);
  const [groupButtonRef, setGroupButtonRef] = useState<HTMLElement | null>(null);
  const [columnManagerButtonRef, setColumnManagerButtonRef] = useState<HTMLElement | null>(null);

  // 轉換為 TanStack Table 的欄位定義
  const columns = useMemo<ColumnDef<any>[]>(() => {
    return inputColumns
      .filter(col => visibleColumns.includes(col.id))
      .map(col => ({
        id: col.id,
        accessorKey: col.key,
        header: () => (
          <div className="notion-header-content">
            <span className="notion-property-icon">
              {NotionIcons[col.type]?.() || NotionIcons.text()}
            </span>
            <span className="notion-property-title">{col.title}</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return value || '空白';
        },
        size: col.width || 180,
        minSize: 50,
        maxSize: 500,
        enableResizing: col.resizable !== false }));
  }, [inputColumns, visibleColumns]);

  // 建立 table 實例
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    onColumnSizingChange: (updater) => {
      // 當欄位大小改變時
      if (typeof updater === 'function') {
        const newSizing = updater(table.getState().columnSizing);
        
        // 延遲通知父組件
        setTimeout(() => {
          if (onColumnReorder) {
            const updatedColumns = inputColumns.map(col => ({
              ...col,
              width: newSizing[col.id] || col.width || 180 }));
            onColumnReorder(updatedColumns);
          }
        }, 300);
      }
    } });

  if (Platform.OS !== 'web') {
    return (
      <View>
        <Text>此元件僅支援 Web 平台</Text>
      </View>
    );
  }

  return (
    <div className="notion-database-wrapper">
      {/* 工具列 */}
      <div className="notion-toolbar-container">
        <div className="notion-toolbar-left">
          <button
            ref={(el) => setFilterButtonRef(el)}
            className="notion-button"
            onClick={() => setIsFilterPanelOpen(true)}
          >
            <span className="notion-button-icon">{NotionIcons.filter()}</span>
            過濾
          </button>
          
          <button
            ref={(el) => setSortButtonRef(el)}
            className="notion-button"
            onClick={() => setIsSortPanelOpen(true)}
          >
            <span className="notion-button-icon">{NotionIcons.sort()}</span>
            排序
          </button>
          
          <button
            ref={(el) => setGroupButtonRef(el)}
            className="notion-button"
            onClick={() => setIsGroupPanelOpen(true)}
          >
            <span className="notion-button-icon">{NotionIcons.group()}</span>
            群組
          </button>
        </div>
        
        <div className="notion-toolbar-right">
          {showSearchBar ? (
            <SearchBar
              value=""
              onChange={() => {}}
              onClose={() => setShowSearchBar(false)}
              placeholder="搜尋資料庫..."
            />
          ) : (
            <button
              className="notion-button"
              onClick={() => setShowSearchBar(true)}
            >
              <span className="notion-button-icon">{NotionIcons.search()}</span>
              搜尋
            </button>
          )}
          
          <button
            ref={(el) => setColumnManagerButtonRef(el)}
            className="notion-button"
            onClick={() => setIsColumnManagerOpen(true)}
            title="自訂屬性"
          >
            {NotionIcons.more()}
          </button>
          
          <button
            className="notion-button notion-button-primary"
            onClick={onRowAdd}
          >
            新建
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="notion-table-container">
        <table className="notion-database-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="notion-header-row">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="notion-header-cell"
                    style={{
                      width: header.getSize(),
                      position: 'relative' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    
                    {/* 欄位寬度調整器 */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`notion-column-resizer ${
                          header.column.getIsResizing() ? 'resizing' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
                
                {/* 新增欄位按鈕 */}
                <th className="notion-add-column-cell">
                  {onColumnAdd && (
                    <button
                      className="notion-add-column-btn"
                      onClick={onColumnAdd}
                    >
                      +
                    </button>
                  )}
                </th>
              </tr>
            ))}
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                  載入中...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                  錯誤：{error.message}
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="notion-data-row"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="notion-cell"
                      style={{
                        width: cell.column.getSize() }}
                    >
                      <div className="notion-cell-content">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="notion-cell-empty-column" />
                </tr>
              ))
            )}
            
            {/* 新增列按鈕 */}
            <tr className="notion-add-row">
              <td colSpan={columns.length + 1} className="notion-add-row-cell">
                <button
                  className="notion-add-row-button"
                  onClick={onRowAdd}
                >
                  <span className="notion-add-icon">+</span>
                  <span>新增</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 各種面板 */}
      {isFilterPanelOpen && (
        <FilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          anchorEl={filterButtonRef}
          filters={{ operator: 'and', filters: [] }}
          onFiltersChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isSortPanelOpen && (
        <SortPanel
          isOpen={isSortPanelOpen}
          onClose={() => setIsSortPanelOpen(false)}
          anchorEl={sortButtonRef}
          sorts={[]}
          onSortsChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isGroupPanelOpen && (
        <GroupPanel
          isOpen={isGroupPanelOpen}
          onClose={() => setIsGroupPanelOpen(false)}
          anchorEl={groupButtonRef}
          groupConfig={null}
          onGroupChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isColumnManagerOpen && (
        <ColumnManager
          isOpen={isColumnManagerOpen}
          onClose={() => setIsColumnManagerOpen(false)}
          anchorEl={columnManagerButtonRef}
          columns={inputColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={setVisibleColumns}
          onColumnReorder={onColumnReorder || (() => {})}
        />
      )}

    </div>
  );
};