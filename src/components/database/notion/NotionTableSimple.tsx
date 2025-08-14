/**
 * Notion 風格表格元件 - 簡化版本
 * 專注於核心功能，不包含複雜的工具列
 */

import React, { useState, useMemo } from 'react';
import { Platform, View, Text } from 'react-native';
import { NotionIcons } from './NotionIcons';
// CSS 現在只在 Notion 元件內引入
import '../web/styles/NotionWrapper.css';
import '../web/styles/NotionDatabaseV4.css';

interface NotionTableSimpleProps {
  data: any[];
  columns: any[];
  onCellUpdate?: (rowId: string, columnKey: string, value: any) => void;
  onRowClick?: (row: any) => void;
  onRowAdd?: () => void;
  onColumnAdd?: () => void;
  onColumnReorder?: (columns: any[]) => void;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

export const NotionTableSimple: React.FC<NotionTableSimpleProps> = ({
  data = [],
  columns: inputColumns = [],
  onCellUpdate,
  onRowClick,
  onRowAdd,
  onColumnAdd,
  onColumnReorder,
  loading = false,
  error = null,
  emptyMessage = '沒有資料' }) => {
  // 欄位寬度狀態
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    inputColumns.forEach(col => {
      initial[col.id] = col.width || 180;
    });
    return initial;
  });

  // 正在調整的欄位
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // 處理欄位寬度調整
  const handleColumnResize = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columnSizing[columnId] || 180;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, Math.min(500, startWidth + deltaX));
      
      setColumnSizing(prev => ({
        ...prev,
        [columnId]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing-column');
      setResizingColumn(null);

      // 通知父組件寬度變更
      if (onColumnReorder) {
        const updatedColumns = inputColumns.map(col => ({
          ...col,
          width: columnSizing[col.id] || col.width || 180 }));
        onColumnReorder(updatedColumns);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('resizing-column');
    setResizingColumn(columnId);
  };

  if (Platform.OS !== 'web') {
    return (
      <View>
        <Text>此元件僅支援 Web 平台</Text>
      </View>
    );
  }

  return (
    <div className="notion-simple-table-container">
      <table className="notion-database-table">
        <thead>
          <tr className="notion-header-row">
            {inputColumns.map(column => (
              <th
                key={column.id}
                className="notion-header-cell"
                style={{ width: columnSizing[column.id] || column.width || 180 }}
              >
                <div className="notion-header-content">
                  <span className="notion-property-icon">
                    {NotionIcons[column.type]?.() || NotionIcons.text()}
                  </span>
                  <span className="notion-property-name">{column.title}</span>
                </div>
                
                {/* 欄位寬度調整器 */}
                <div
                  className={`notion-column-resizer ${resizingColumn === column.id ? 'resizing' : ''}`}
                  onMouseDown={(e) => handleColumnResize(column.id, e)}
                />
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
        </thead>
        
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={inputColumns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                載入中...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={inputColumns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                錯誤：{error.message}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={inputColumns.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="notion-data-row"
                onClick={() => onRowClick?.(row)}
              >
                {inputColumns.map(column => (
                  <td
                    key={column.id}
                    className="notion-cell"
                    style={{ width: columnSizing[column.id] || column.width || 180 }}
                  >
                    <div className="notion-cell-content">
                      {row[column.key] || '空白'}
                    </div>
                  </td>
                ))}
                <td className="notion-cell-empty-column" />
              </tr>
            ))
          )}
          
          {/* 新增列按鈕 */}
          <tr className="notion-add-row">
            <td colSpan={inputColumns.length + 1} className="notion-add-row-cell">
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
  );
};