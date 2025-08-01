/**
 * TanStack Table 實作的 Notion 風格資料庫表格 - 使用 HTML 表格元素
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { flexRender } from '@tanstack/react-table';
import { TanStackTableProps, TableData } from '../shared/tableTypes';
import { useNotionTable } from './hooks/useNotionTable';
import { useNotionColumns } from './hooks/useNotionColumns';
import { NotionTableCell } from './NotionTableCell';
import { NotionCheckbox } from './NotionCheckbox';
import { generateColumnsByType } from '../shared/tableUtils';
import { TableColumn } from '@/types/table';

export const TanStackNotionTable: React.FC<TanStackTableProps> = ({
  data,
  columns: propColumns,
  onAddRow,
  onUpdateCell,
  onColumnsReorder,
  onRowPress,
  multiSelectMode = false,
  selectedItems = [],
  onSelect,
  refreshing = false,
  onRefresh,
  loading = false,
  sortConfig,
  onSort,
  enableColumnDrag = false,
}) => {
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // 如果不是 Web 平台，返回 null
  if (Platform.OS !== 'web') {
    return null;
  }

  // 判斷資料類型
  const dataType = useMemo(() => {
    if (!data.length) return 'customers'; // 預設
    
    // 檢查資料結構判斷類型
    if (data[0].hasOwnProperty('company')) return 'customers';
    if (data[0].hasOwnProperty('customerName')) return 'records';
    if (data[0].hasOwnProperty('assignee')) return 'tasks';
    
    return 'customers';
  }, [data]);

  // 生成欄位定義
  const columns = useNotionColumns({
    onUpdateCell,
    onColumnsReorder,
    activeTab: dataType,
    includeSelectColumn: multiSelectMode,
  });

  // 建立表格實例
  const { table, selectedRows, setSelectedRows } = useNotionTable({
    data,
    columns,
    enableRowSelection: multiSelectMode,
  });

  // 同步選擇狀態
  React.useEffect(() => {
    if (onSelect && multiSelectMode) {
      const selected = Object.keys(selectedRows).filter(id => selectedRows[id]);
      onSelect(selected);
    }
  }, [selectedRows, onSelect, multiSelectMode]);

  // 處理新增行
  const handleAddRow = useCallback(async () => {
    if (!onAddRow) return;
    
    try {
      setIsAddingRow(true);
      
      // 如果是內聯新增模式且有資料
      if (Object.keys(newRowData).length > 0) {
        await onAddRow(newRowData);
        setNewRowData({});
        setIsAddingRow(false);
      } else {
        // 調用父組件的新增邏輯
        await onAddRow();
        setIsAddingRow(false);
      }
    } catch (error) {
      console.error('新增行失敗:', error);
      setIsAddingRow(false);
    }
  }, [onAddRow, newRowData]);

  // 處理新增行的儲存格變更
  const handleNewRowCellChange = useCallback((columnKey: string, value: any) => {
    setNewRowData(prev => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  // 取消新增行
  const handleCancelAddRow = useCallback(() => {
    setIsAddingRow(false);
    setNewRowData({});
  }, []);

  // 確認新增行
  const handleConfirmAddRow = useCallback(async () => {
    if (Object.keys(newRowData).length === 0) {
      setIsAddingRow(false);
      return;
    }
    
    try {
      if (onAddRow) {
        await onAddRow(newRowData);
      }
      setNewRowData({});
      setIsAddingRow(false);
    } catch (error) {
      console.error('確認新增行失敗:', error);
    }
  }, [newRowData, onAddRow]);

  // 空狀態
  if (!data.length && !loading) {
    return (
      <div className="notion-database-container">
        <div className="notion-empty-state">
          <div className="notion-empty-content">
            <div className="notion-empty-icon">📋</div>
            <p className="notion-empty-title">沒有資料</p>
            <p className="notion-empty-subtitle">點選「新增頁面」開始建立第一筆資料</p>
            {onAddRow && (
              <button 
                className="notion-add-row-button"
                onClick={() => setIsAddingRow(true)}
              >
                <span className="notion-add-icon">+</span>
                新增頁面
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notion-database-container">
      <table className="notion-database-table">
        {/* 表頭 */}
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="notion-header-row">
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const canSort = column.getCanSort();
                const sorted = column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    className="notion-header-cell"
                    style={{ width: header.getSize() || 'auto' }}
                    onClick={() => {
                      if (canSort && onSort) {
                        onSort(column.id);
                      } else if (canSort) {
                        column.toggleSorting();
                      }
                    }}
                  >
                    <div className="notion-header-content">
                      <span className="notion-column-title">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </span>
                      {canSort && (
                        <span className="notion-sort-icon">
                          {sorted === 'asc' && '↑'}
                          {sorted === 'desc' && '↓'}
                          {!sorted && '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* 表格內容 */}
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = multiSelectMode && selectedItems.includes(row.original.id);
            
            return (
              <tr
                key={row.id}
                className={`notion-data-row ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (multiSelectMode) {
                    row.toggleSelected();
                  } else if (onRowPress) {
                    onRowPress(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="notion-cell"
                    style={{ width: cell.column.getSize() || 'auto' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          
          {/* 新增行 */}
          {onAddRow && (
            <>
              {isAddingRow ? (
                <tr className="notion-editing-row">
                  <td className="notion-row-actions">
                    <button 
                      className="notion-save-button"
                      onClick={handleConfirmAddRow}
                      disabled={Object.keys(newRowData).length === 0}
                    >
                      ✓
                    </button>
                    <button 
                      className="notion-cancel-button"
                      onClick={handleCancelAddRow}
                    >
                      ✕
                    </button>
                  </td>
                  {table.getHeaderGroups()[0]?.headers.slice(1).map((header) => {
                    const columnId = header.column.id;
                    
                    return (
                      <td key={columnId} className="notion-cell">
                        <input
                          type="text"
                          placeholder={`輸入${header.column.columnDef.header}`}
                          value={newRowData[columnId] || ''}
                          onChange={(e) => handleNewRowCellChange(columnId, e.target.value)}
                          className="notion-cell-input"
                        />
                      </td>
                    );
                  })}
                </tr>
              ) : (
                <tr className="notion-add-row">
                  <td colSpan={table.getHeaderGroups()[0]?.headers.length || 1} className="notion-add-row-cell">
                    <div 
                      className="notion-add-row-button"
                      onClick={() => setIsAddingRow(true)}
                    >
                      <span className="notion-add-icon">+</span>
                      新增頁面
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
      
      {refreshing && (
        <div className="notion-loading-indicator">
          <span>重新載入中...</span>
        </div>
      )}
    </div>
  );
};