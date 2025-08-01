import React, { useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { TanStackTableProps } from '../shared/tableTypes';
import { NotionDatabaseToolbar } from './NotionDatabaseToolbar';
import { NotionTableCell } from './NotionTableCell';

export const TanStackNotionTableV3: React.FC<TanStackTableProps> = ({
  data,
  columns,
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleAddRow = useCallback(() => {
    setIsAddingRow(true);
    setNewRowData({});
  }, []);

  const handleSaveNewRow = useCallback(async () => {
    if (Object.keys(newRowData).length > 0 && onAddRow) {
      try {
        await onAddRow(newRowData);
        setNewRowData({});
      } catch (error) {
        console.error('儲存新增列失敗:', error);
      }
    }
    setIsAddingRow(false);
  }, [newRowData, onAddRow]);

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

  const handleViewSettings = useCallback(() => {
    // TODO: 實作檢視設定功能
    console.log('檢視設定');
  }, []);

  const handleCellUpdate = useCallback(async (rowId: string, columnId: string, value: any) => {
    if (onUpdateCell) {
      try {
        await onUpdateCell(rowId, columnId, value);
      } catch (error) {
        console.error('更新儲存格失敗:', error);
      }
    }
  }, [onUpdateCell]);

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr className="notion-data-row">
          <td colSpan={table.getHeaderGroups()[0]?.headers.length || 1} className="notion-cell">
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--notion-gray-50)' }}>
              載入中...
            </div>
          </td>
        </tr>
      );
    }

    if (data.length === 0 && !isAddingRow) {
      return (
        <tr className="notion-data-row">
          <td colSpan={table.getHeaderGroups()[0]?.headers.length || 1} className="notion-cell">
            <div className="notion-empty-state">
              <div className="notion-empty-content">
                <div className="notion-empty-icon">📋</div>
                <p>沒有項目</p>
                <p>新增項目以開始使用資料庫</p>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return null;
  };

  return (
    <div className="notion-database-container">
      <NotionDatabaseToolbar
        onAddRow={handleAddRow}
        onViewSettings={handleViewSettings}
        viewCount={data.length}
        selectedCount={selectedItems.length}
      />
      
      <table className="notion-database-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="notion-header-row">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="notion-header-cell">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                    type="text"
                    placeholder={`輸入 ${header.column.columnDef.header}`}
                    autoFocus={header.column.id === 'name' || header.column.id === table.getLeafHeaders()[0]?.column.id}
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
          {table.getRowModel().rows.map((row) => {
            const isSelected = multiSelectMode && selectedItems.includes(row.original.id);
            
            return (
              <tr 
                key={row.id} 
                className={`notion-data-row ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (multiSelectMode) {
                    // 處理多選模式
                    if (onSelect) {
                      const newSelection = isSelected 
                        ? selectedItems.filter(id => id !== row.original.id)
                        : [...selectedItems, row.original.id];
                      onSelect(newSelection);
                    }
                  } else if (onRowPress) {
                    onRowPress(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="notion-cell">
                    {cell.column.id === 'select' ? (
                      // 核取方塊欄位
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : onUpdateCell ? (
                      // 可編輯欄位
                      <NotionTableCell
                        value={cell.getValue()}
                        onChange={(value) => handleCellUpdate(row.original.id, cell.column.id, value)}
                        type="text"
                        placeholder={`輸入 ${cell.column.columnDef.header}`}
                      />
                    ) : (
                      // 唯讀欄位
                      <div className="notion-cell-content">
                        {cell.getValue() || <span className="notion-cell-placeholder">-</span>}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}

          {/* 空狀態或載入狀態 */}
          {renderTableContent()}
        </tbody>
      </table>
      
      {/* 重新載入指示器 */}
      {refreshing && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: 'var(--notion-gray-50)',
          fontSize: 'var(--notion-font-size-body)'
        }}>
          正在重新載入...
        </div>
      )}
    </div>
  );
};