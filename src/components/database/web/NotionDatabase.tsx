/**
 * 真正的 Notion 風格資料庫 - 使用純 HTML 表格
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import './styles/NotionDatabase.css';

interface NotionColumn {
  id: string;
  title: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'phone';
  width?: number;
  options?: string[];
}

interface NotionRow {
  id: string;
  [key: string]: any;
}

interface NotionDatabaseProps {
  data: NotionRow[];
  columns: NotionColumn[];
  onUpdateCell?: (rowId: string, columnId: string, value: any) => void;
  onAddRow?: (rowData: Record<string, any>) => void;
  onDeleteRow?: (rowId: string) => void;
}

export const NotionDatabase: React.FC<NotionDatabaseProps> = ({
  data,
  columns,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
}) => {
  const [editingCell, setEditingCell] = useState<{rowId: string, columnId: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const editInputRef = useRef<HTMLInputElement>(null);

  // 如果不是 Web 平台，不渲染
  if (Platform.OS !== 'web') {
    return null;
  }

  // 處理儲存格點擊
  const handleCellClick = (rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId });
    setEditValue(currentValue?.toString() || '');
  };

  // 處理編輯完成
  const handleEditComplete = useCallback(async () => {
    if (editingCell && onUpdateCell) {
      try {
        await onUpdateCell(editingCell.rowId, editingCell.columnId, editValue);
      } catch (error) {
        console.error('更新儲存格失敗:', error);
      }
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, onUpdateCell]);

  // 處理按鍵
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // 處理新增行
  const handleAddRow = async () => {
    if (onAddRow && Object.keys(newRowData).length > 0) {
      try {
        await onAddRow(newRowData);
        setNewRowData({});
        setIsAddingRow(false);
      } catch (error) {
        console.error('新增行失敗:', error);
      }
    }
  };

  // 渲染儲存格內容
  const renderCellContent = (row: NotionRow, column: NotionColumn) => {
    const cellKey = `${row.id}-${column.id}`;
    const value = row[column.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;

    if (isEditing) {
      return (
        <input
          ref={editInputRef}
          type={column.type === 'number' ? 'number' : column.type === 'email' ? 'email' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleKeyDown}
          className="notion-cell-input"
          autoFocus
        />
      );
    }

    // 根據欄位類型渲染不同內容
    switch (column.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onUpdateCell?.(row.id, column.id, e.target.checked)}
            className="notion-checkbox"
          />
        );
      
      case 'select':
        const selectValue = value || '';
        return (
          <div className={`notion-select-tag ${selectValue.toLowerCase()}`}>
            {selectValue || '未選擇'}
          </div>
        );
      
      default:
        return (
          <div 
            className="notion-cell-content"
            onClick={() => handleCellClick(row.id, column.id, value)}
          >
            {value || ''}
          </div>
        );
    }
  };

  // 渲染新增行
  const renderNewRow = () => {
    if (!isAddingRow) {
      return (
        <tr className="notion-add-row">
          <td colSpan={columns.length + 1} className="notion-add-row-cell">
            <div 
              className="notion-add-row-button"
              onClick={() => setIsAddingRow(true)}
            >
              <span className="notion-add-icon">+</span>
              新增頁面
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="notion-editing-row">
        <td className="notion-row-actions">
          <button 
            className="notion-save-button"
            onClick={handleAddRow}
            disabled={Object.keys(newRowData).length === 0}
          >
            ✓
          </button>
          <button 
            className="notion-cancel-button"
            onClick={() => {
              setIsAddingRow(false);
              setNewRowData({});
            }}
          >
            ✕
          </button>
        </td>
        {columns.map((column) => (
          <td key={column.id} className="notion-cell">
            <input
              type={column.type === 'number' ? 'number' : column.type === 'email' ? 'email' : 'text'}
              placeholder={`輸入${column.title}...`}
              value={newRowData[column.id] || ''}
              onChange={(e) => setNewRowData({
                ...newRowData,
                [column.id]: e.target.value
              })}
              className="notion-cell-input"
            />
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="notion-database-container">
      <table className="notion-database-table">
        {/* 表頭 */}
        <thead>
          <tr className="notion-header-row">
            <th className="notion-row-selector"></th>
            {columns.map((column) => (
              <th 
                key={column.id} 
                className="notion-header-cell"
                style={{ width: column.width || 'auto' }}
              >
                <div className="notion-header-content">
                  <span className="notion-column-title">{column.title}</span>
                  <span className="notion-column-type">{column.type}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* 表格內容 */}
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="notion-data-row">
              <td className="notion-row-selector">
                <input
                  type="checkbox"
                  checked={selectedRows.has(row.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedRows);
                    if (e.target.checked) {
                      newSelected.add(row.id);
                    } else {
                      newSelected.delete(row.id);
                    }
                    setSelectedRows(newSelected);
                  }}
                  className="notion-row-checkbox"
                />
              </td>
              {columns.map((column) => (
                <td key={column.id} className="notion-cell">
                  {renderCellContent(row, column)}
                </td>
              ))}
            </tr>
          ))}
          
          {/* 新增行 */}
          {renderNewRow()}
          
          {/* 空狀態 */}
          {data.length === 0 && !isAddingRow && (
            <tr>
              <td colSpan={columns.length + 1} className="notion-empty-state">
                <div className="notion-empty-content">
                  <div className="notion-empty-icon">📋</div>
                  <p>沒有資料</p>
                  <p>點選「新增頁面」來建立第一筆資料</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default NotionDatabase;