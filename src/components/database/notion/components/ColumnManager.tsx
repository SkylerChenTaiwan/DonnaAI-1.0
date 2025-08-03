/**
 * Notion 資料庫欄位管理面板
 * 用於管理欄位顯示/隱藏、順序調整、說明設定等
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { ColumnConfig } from '../types';
import { NotionIcons } from '../NotionIcons';

export interface ColumnManagerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  visibleColumns: string[];
  onVisibilityChange: (visibleColumns: string[]) => void;
  onColumnReorder: (columns: ColumnConfig[]) => void;
  onColumnUpdate: (columnId: string, updates: Partial<ColumnConfig>) => void;
  anchorEl?: HTMLElement | null;
}

export const ColumnManager: React.FC<ColumnManagerProps> = ({
  isOpen,
  onClose,
  columns,
  visibleColumns,
  onVisibilityChange,
  onColumnReorder,
  onColumnUpdate,
  anchorEl
}) => {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [columnDescriptions, setColumnDescriptions] = useState<Record<string, string>>({});
  
  // 處理欄位顯示/隱藏切換
  const handleToggleVisibility = useCallback((columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onVisibilityChange(visibleColumns.filter(id => id !== columnId));
    } else {
      onVisibilityChange([...visibleColumns, columnId]);
    }
  }, [visibleColumns, onVisibilityChange]);
  
  // 處理拖放開始
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  // 處理拖放結束
  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);
  
  // 處理拖放放置
  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumnId) return;
    
    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(col => col.id === draggedColumn);
    const targetIndex = newColumns.findIndex(col => col.id === targetColumnId);
    
    if (draggedIndex > -1 && targetIndex > -1) {
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);
      onColumnReorder(newColumns);
    }
  }, [draggedColumn, columns, onColumnReorder]);
  
  // 處理拖放經過
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  // 處理欄位說明更新
  const handleDescriptionUpdate = useCallback((columnId: string, description: string) => {
    setColumnDescriptions(prev => ({
      ...prev,
      [columnId]: description
    }));
    onColumnUpdate(columnId, { description });
  }, [onColumnUpdate]);
  
  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }
  
  return React.createElement('div', {
    className: 'notion-column-manager-overlay',
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: 'notion-column-manager',
      style: anchorEl ? getPositionStyle(anchorEl) : undefined
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-column-manager-header'
      },
        React.createElement('span', null, '自訂屬性'),
        React.createElement('button', {
          className: 'notion-column-manager-close',
          onClick: onClose
        }, '✕')
      ),
      
      // 欄位列表
      React.createElement('div', {
        className: 'notion-column-manager-content'
      },
        columns.map((column, index) => 
          React.createElement('div', {
            key: column.id,
            className: `notion-column-item ${draggedColumn === column.id ? 'dragging' : ''}`,
            draggable: true,
            onDragStart: (e) => handleDragStart(e, column.id),
            onDragEnd: handleDragEnd,
            onDrop: (e) => handleDrop(e, column.id),
            onDragOver: handleDragOver
          },
            // 拖動手柄
            React.createElement('span', {
              className: 'notion-column-drag-handle'
            }, '⋮⋮'),
            
            // 顯示/隱藏切換
            React.createElement('button', {
              className: 'notion-column-visibility-toggle',
              onClick: () => handleToggleVisibility(column.id)
            },
              visibleColumns.includes(column.id) 
                ? NotionIcons.checkbox() 
                : React.createElement('span', { className: 'notion-checkbox-empty' }, '☐')
            ),
            
            // 欄位資訊
            React.createElement('div', {
              className: 'notion-column-info'
            },
              React.createElement('span', {
                className: 'notion-column-icon'
              }, getColumnIcon(column.type)),
              React.createElement('span', {
                className: 'notion-column-name'
              }, column.title)
            ),
            
            // 編輯說明按鈕
            React.createElement('button', {
              className: 'notion-column-edit-btn',
              onClick: () => setEditingColumn(
                editingColumn === column.id ? null : column.id
              )
            }, NotionIcons.more()),
            
            // 說明編輯區
            editingColumn === column.id && React.createElement('div', {
              className: 'notion-column-description-editor'
            },
              React.createElement('textarea', {
                className: 'notion-column-description-input',
                placeholder: '為 AI 新增欄位說明...',
                value: columnDescriptions[column.id] || column.description || '',
                onChange: (e) => handleDescriptionUpdate(column.id, e.target.value),
                rows: 3
              })
            )
          )
        )
      ),
      
      // 底部操作
      React.createElement('div', {
        className: 'notion-column-manager-footer'
      },
        React.createElement('button', {
          className: 'notion-button-text',
          onClick: () => {
            onVisibilityChange(columns.map(col => col.id));
          }
        }, '顯示全部'),
        React.createElement('button', {
          className: 'notion-button-text',
          onClick: () => {
            onVisibilityChange([]);
          }
        }, '隱藏全部')
      )
    )
  );
};

// === 輔助函數 ===

function getPositionStyle(anchorEl: HTMLElement): React.CSSProperties {
  const rect = anchorEl.getBoundingClientRect();
  const panelWidth = 320;
  const panelHeight = 480;
  const padding = 16;
  
  let right = window.innerWidth - rect.right;
  let top = rect.bottom + 8;
  
  // 檢查右側是否會超出視窗
  if (right + panelWidth + padding > window.innerWidth) {
    right = padding;
  }
  
  // 檢查底部是否會超出視窗
  if (top + panelHeight + padding > window.innerHeight) {
    top = rect.top - panelHeight - 8;
    
    if (top < padding) {
      top = padding;
    }
  }
  
  return {
    position: 'fixed',
    top,
    right,
    zIndex: 1000,
  };
}

function getColumnIcon(type: string): React.ReactElement {
  switch (type) {
    case 'text':
      return NotionIcons.text();
    case 'number':
      return NotionIcons.number();
    case 'select':
      return NotionIcons.select();
    case 'multiselect':
      return NotionIcons.multiSelect();
    case 'date':
      return NotionIcons.date();
    case 'checkbox':
      return NotionIcons.checkbox();
    case 'tags':
      return NotionIcons.tag();
    default:
      return NotionIcons.text();
  }
}