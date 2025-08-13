/**
 * TanStack Table 實作的 Notion 風格資料庫表格 - 完全重新設計版本
 * 特色：
 * - 真正的 Notion 視覺設計
 * - 完整的工具列功能
 * - 正確的空狀態顯示
 * - 專業的表格互動
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { flexRender } from '@tanstack/react-table';
import { TanStackTableProps, TableData } from '../shared/tableTypes';
import { useNotionTable } from './hooks/useNotionTable';
import { useNotionColumns } from './hooks/useNotionColumns';
import { NotionTableCell } from './NotionTableCell';
import { NotionCheckbox } from './NotionCheckbox';
import { generateColumnsByType } from '../shared/tableUtils';
import { TableColumn } from '@/types/table';
import './styles/NotionDatabaseV2.css';

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
  enableColumnDrag = false }) => {
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

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
    includeSelectColumn: multiSelectMode });

  // 建立表格實例
  const { table, selectedRows, setSelectedRows } = useNotionTable({
    data,
    columns,
    enableRowSelection: multiSelectMode });

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
      [columnKey]: value }));
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

  // 處理儲存格編輯
  const handleCellEdit = useCallback((rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId });
    setEditingValue(String(currentValue || ''));
  }, []);

  const handleCellEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  const handleCellEditConfirm = useCallback(async () => {
    if (!editingCell || !onUpdateCell) {
      setEditingCell(null);
      setEditingValue('');
      return;
    }

    try {
      await onUpdateCell(editingCell.rowId, editingCell.columnId, editingValue);
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('更新儲存格失敗:', error);
      setEditingCell(null);
      setEditingValue('');
    }
  }, [editingCell, editingValue, onUpdateCell]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellEditConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellEditCancel();
    }
  }, [handleCellEditConfirm, handleCellEditCancel]);

  // 處理工具列功能
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 渲染工具列
  const renderToolbar = () => (
    <div className="notion-database-toolbar">
      <div className="notion-toolbar-left">
        <button className="notion-toolbar-button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 4.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM2 7a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 012 7zM2.5 9a.5.5 0 000 1h5a.5.5 0 000-1h-5z"/>
          </svg>
          篩選
        </button>
        <button className="notion-toolbar-button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 3.5a.5.5 0 01.5-.5h7a.5.5 0 01.354.146l.146.147a.5.5 0 010 .707L7.707 7.293a.5.5 0 00-.146.353v2.708L6.25 11.25V7.646a.5.5 0 00-.146-.353L2.5 3.793a.5.5 0 010-.707L2.646 3.04A.5.5 0 013 3.5z"/>
          </svg>
          排序
        </button>
        <button 
          className={`notion-toolbar-button ${showSearch ? 'active' : ''}`}
          onClick={() => setShowSearch(!showSearch)}
          title="搜尋"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          搜尋
        </button>
        {showSearch && (
          <input
            type="text"
            placeholder="搜尋所有欄位..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notion-search-input"
            autoFocus
          />
        )}
      </div>
      <div className="notion-toolbar-right">
        <button className="notion-toolbar-button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1.75a.75.75 0 00-.75.75v4.69L4.22 5.22a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06L7.75 7.19V2.5A.75.75 0 007 1.75z"/>
          </svg>
          檢視
        </button>
        {onAddRow && (
          <button 
            className="notion-toolbar-button notion-add-button"
            onClick={() => setIsAddingRow(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 2.75a.75.75 0 01.75.75v2.75H10.5a.75.75 0 010 1.5H7.75V10.5a.75.75 0 01-1.5 0V7.25H3.5a.75.75 0 010-1.5h2.75V3a.75.75 0 01.75-.75z"/>
            </svg>
            新增
          </button>
        )}
      </div>
    </div>
  );

  // 渲染表格內容（包含空狀態）
  const renderTable = () => {
    const hasData = data.length > 0;
    
    return (
      <div className="notion-database-table-container">
        <table className="notion-database-table">
          {/* 表頭 - 始終顯示 */}
          <thead className="notion-database-header">
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
                          <span className={`notion-sort-icon ${sorted ? 'active' : ''}`}>
                            {sorted === 'asc' && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M6 2l4 4H8v4H4V6H2l4-4z"/>
                              </svg>
                            )}
                            {sorted === 'desc' && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M6 10L2 6h2V2h4v4h2l-4 4z"/>
                              </svg>
                            )}
                            {!sorted && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
                                <path d="M4 3h4v1H4zM3 5h6v1H3zM5 7h2v1H5z"/>
                              </svg>
                            )}
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
          <tbody className="notion-database-body">
            {hasData ? (
              // 有資料時顯示資料行
              table.getRowModel().rows.map((row) => {
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
                    {row.getVisibleCells().map((cell) => {
                      const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === cell.column.id;
                      const cellValue = cell.getValue();
                      
                      return (
                        <td
                          key={cell.id}
                          className={`notion-cell ${onUpdateCell ? 'notion-cell-editable' : ''} ${isEditing ? 'editing' : ''}`}
                          style={{ width: cell.column.getSize() || 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateCell && cell.column.id !== 'select' && !multiSelectMode) {
                              handleCellEdit(row.original.id, cell.column.id, cellValue);
                            }
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleCellKeyDown}
                              onBlur={handleCellEditConfirm}
                              className="notion-cell-input"
                              autoFocus
                            />
                          ) : (
                            <span className={cellValue ? '' : 'notion-cell-empty'}>
                              {cellValue || '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              // 空狀態時顯示空的表格行以保持結構
              !loading && (
                <tr className="notion-empty-row">
                  <td 
                    colSpan={table.getHeaderGroups()[0]?.headers.length || 1} 
                    className="notion-empty-cell"
                  >
                    <div className="notion-empty-content">
                      <div className="notion-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                          <rect x="8" y="12" width="32" height="24" rx="2" stroke="#E5E5E5" strokeWidth="2" fill="none"/>
                          <line x1="8" y1="20" x2="40" y2="20" stroke="#E5E5E5" strokeWidth="2"/>
                          <line x1="16" y1="12" x2="16" y2="36" stroke="#E5E5E5" strokeWidth="2"/>
                          <line x1="24" y1="12" x2="24" y2="36" stroke="#E5E5E5" strokeWidth="2"/>
                          <line x1="32" y1="12" x2="32" y2="36" stroke="#E5E5E5" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="notion-empty-text">
                        <div className="notion-empty-title">沒有項目</div>
                        <div className="notion-empty-subtitle">新增項目以開始使用資料庫</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            )}
            
            {/* 新增行 - 始終顯示 */}
            {onAddRow && (
              <>
                {isAddingRow ? (
                  <tr className="notion-editing-row">
                    <td className="notion-row-actions">
                      <div className="notion-row-action-buttons">
                        <button 
                          className="notion-save-button"
                          onClick={handleConfirmAddRow}
                          disabled={Object.keys(newRowData).length === 0}
                          title="儲存"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10 3L4.5 8.5 2 6"/>
                          </svg>
                        </button>
                        <button 
                          className="notion-cancel-button"
                          onClick={handleCancelAddRow}
                          title="取消"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M9 3L3 9M3 3l6 6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    {table.getHeaderGroups()[0]?.headers.slice(1).map((header) => {
                      const columnId = header.column.id;
                      
                      return (
                        <td key={columnId} className="notion-cell notion-editing-cell">
                          <input
                            type="text"
                            placeholder={`輸入${header.column.columnDef.header}`}
                            value={newRowData[columnId] || ''}
                            onChange={(e) => handleNewRowCellChange(columnId, e.target.value)}
                            className="notion-cell-input"
                            autoFocus={columnId === table.getHeaderGroups()[0]?.headers[1]?.column.id}
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
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="notion-add-icon">
                          <path d="M7 2.75a.75.75 0 01.75.75v2.75H10.5a.75.75 0 010 1.5H7.75V10.5a.75.75 0 01-1.5 0V7.25H3.5a.75.75 0 010-1.5h2.75V3a.75.75 0 01.75-.75z"/>
                        </svg>
                        <span>新增項目</span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
        
        {/* 載入指示器 */}
        {loading && (
          <div className="notion-loading-overlay">
            <div className="notion-loading-spinner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#E5E5E5" strokeWidth="2"/>
                <path d="M18 10a8 8 0 01-8 8" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="notion-database-container">
      {/* 工具列 */}
      {renderToolbar()}
      
      {/* 表格 */}
      {renderTable()}
      
      {/* 重新載入指示器 */}
      {refreshing && (
        <div className="notion-refresh-indicator">
          <div className="notion-refresh-text">正在重新載入...</div>
        </div>
      )}
    </div>
  );
};