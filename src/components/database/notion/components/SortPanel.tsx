/**
 * Notion 風格排序面板
 * 提供排序設定界面，支援多層排序和拖拽調整優先級
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { SortPanelProps, Sort, ColumnConfig } from '../types';
import { SortManager, createSort } from '../managers/SortManager';
import { NotionIcons } from '../NotionIcons';

export const SortPanel: React.FC<SortPanelProps> = ({
  isOpen,
  onClose,
  columns,
  currentSorts,
  onSortsChange,
  anchorEl
}) => {
  const [sortManager] = useState(() => new SortManager());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }

  // 處理添加新排序規則
  const handleAddSort = useCallback(() => {
    const usedColumns = new Set(currentSorts.map(s => s.columnKey));
    const availableColumn = columns.find(col => !usedColumns.has(col.key));
    
    if (!availableColumn) return;

    const newSort = createSort(
      availableColumn.key,
      sortManager.getDefaultSortDirection(availableColumn.type),
      currentSorts.length
    );

    onSortsChange([...currentSorts, newSort]);
  }, [columns, currentSorts, onSortsChange, sortManager]);

  // 處理移除排序規則
  const handleRemoveSort = useCallback((columnKey: string) => {
    const newSorts = sortManager.removeSort(currentSorts, columnKey);
    onSortsChange(newSorts);
  }, [currentSorts, onSortsChange, sortManager]);

  // 處理更新排序規則
  const handleUpdateSort = useCallback((columnKey: string, updates: Partial<Sort>) => {
    const newSorts = currentSorts.map(sort => 
      sort.columnKey === columnKey ? { ...sort, ...updates } : sort
    );
    onSortsChange(newSorts);
  }, [currentSorts, onSortsChange]);

  // 處理切換排序方向
  const handleToggleDirection = useCallback((columnKey: string) => {
    const sort = currentSorts.find(s => s.columnKey === columnKey);
    if (!sort) return;

    const newDirection = sortManager.toggleSortDirection(sort.direction);
    handleUpdateSort(columnKey, { direction: newDirection });
  }, [currentSorts, handleUpdateSort, sortManager]);

  // 處理拖拽開始
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // 需要設定資料才能拖拽
  }, []);

  // 處理拖拽結束
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // 處理拖拽經過
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  // 處理放下
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSorts = [...currentSorts];
    const [movedSort] = newSorts.splice(draggedIndex, 1);
    newSorts.splice(dropIndex, 0, movedSort);

    // 重新分配優先級
    const reorderedSorts = newSorts.map((sort, index) => ({
      ...sort,
      priority: index,
    }));

    onSortsChange(reorderedSorts);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, currentSorts, onSortsChange]);

  // 取得可用的欄位選項
  const availableColumns = useMemo(() => {
    const usedColumns = new Set(currentSorts.map(s => s.columnKey));
    return columns.filter(col => !usedColumns.has(col.key));
  }, [columns, currentSorts]);

  return React.createElement('div', {
    className: 'notion-sort-panel-overlay',
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: 'notion-sort-panel',
      style: anchorEl ? getPositionStyle(anchorEl) : undefined
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-sort-panel-header'
      },
        React.createElement('h3', {
          className: 'notion-sort-panel-title'
        }, '排序'),
        React.createElement('button', {
          className: 'notion-sort-panel-close',
          onClick: onClose
        }, '✕')
      ),

      // 排序規則內容
      React.createElement('div', {
        className: 'notion-sort-panel-content'
      },
        // 排序規則列表
        currentSorts.length > 0 ? React.createElement('div', {
          className: 'notion-sort-list'
        },
          React.createElement('div', {
            className: 'notion-sort-list-header'
          }, '排序規則（拖拽調整優先級）'),
          ...currentSorts.map((sort, index) => 
            renderSortItem(
              sort,
              index,
              columns,
              handleUpdateSort,
              handleRemoveSort,
              handleToggleDirection,
              handleDragStart,
              handleDragEnd,
              handleDragOver,
              handleDrop,
              draggedIndex === index,
              dragOverIndex === index
            )
          )
        ) : React.createElement('div', {
          className: 'notion-sort-empty'
        }, '尚未設定排序規則'),

        // 排序統計
        currentSorts.length > 0 && React.createElement('div', {
          className: 'notion-sort-stats'
        },
          React.createElement('span', {
            className: 'notion-sort-stats-text'
          }, `共 ${currentSorts.length} 個排序規則`)
        )
      ),

      // 面板底部
      React.createElement('div', {
        className: 'notion-sort-panel-footer'
      },
        React.createElement('button', {
          className: 'notion-button',
          onClick: handleAddSort,
          disabled: availableColumns.length === 0
        }, 
          NotionIcons.plus(),
          ' 新增排序'
        ),
        currentSorts.length > 0 && React.createElement('button', {
          className: 'notion-button-text',
          onClick: () => onSortsChange([])
        }, '清除全部')
      )
    )
  );
};

// === 輔助渲染函數 ===

function renderSortItem(
  sort: Sort,
  index: number,
  columns: ColumnConfig[],
  onUpdateSort: (columnKey: string, updates: Partial<Sort>) => void,
  onRemoveSort: (columnKey: string) => void,
  onToggleDirection: (columnKey: string) => void,
  onDragStart: (e: React.DragEvent, index: number) => void,
  onDragEnd: () => void,
  onDragOver: (e: React.DragEvent, index: number) => void,
  onDrop: (e: React.DragEvent, index: number) => void,
  isDragging: boolean,
  isDragOver: boolean
): React.ReactElement {
  const column = columns.find(col => col.key === sort.columnKey);
  
  return React.createElement('div', {
    key: sort.columnKey,
    className: `notion-sort-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`,
    draggable: true,
    onDragStart: (e: React.DragEvent) => onDragStart(e, index),
    onDragEnd: onDragEnd,
    onDragOver: (e: React.DragEvent) => onDragOver(e, index),
    onDrop: (e: React.DragEvent) => onDrop(e, index)
  },
    // 拖拽手柄
    React.createElement('div', {
      className: 'notion-sort-drag-handle',
      title: '拖拽調整優先級'
    }, '⋮⋮'),

    // 優先級指示器
    React.createElement('div', {
      className: 'notion-sort-priority'
    }, index + 1),

    // 欄位選擇
    React.createElement('select', {
      className: 'notion-sort-column-select',
      value: sort.columnKey,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateSort(sort.columnKey, { columnKey: e.target.value });
      }
    },
      ...columns.map(col => 
        React.createElement('option', {
          key: col.key,
          value: col.key
        }, col.title)
      )
    ),

    // 排序方向切換
    React.createElement('button', {
      className: `notion-sort-direction ${sort.direction}`,
      onClick: () => onToggleDirection(sort.columnKey),
      title: `當前：${sort.direction === 'asc' ? '升序' : '降序'}，點擊切換`
    },
      React.createElement('span', {
        className: 'notion-sort-direction-icon'
      }, sort.direction === 'asc' ? '↑' : '↓'),
      React.createElement('span', {
        className: 'notion-sort-direction-text'
      }, sort.direction === 'asc' ? '升序' : '降序')
    ),

    // 欄位類型指示器
    column && React.createElement('div', {
      className: 'notion-sort-column-info'
    },
      React.createElement('span', {
        className: 'notion-sort-column-type'
      }, getColumnTypeLabel(column.type))
    ),

    // 移除按鈕
    React.createElement('button', {
      className: 'notion-sort-remove',
      onClick: () => onRemoveSort(sort.columnKey),
      title: '移除此排序規則'
    }, '✕')
  );
}

// === 輔助函數 ===

function getColumnTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'text': '文字',
    'number': '數字',
    'date': '日期',
    'select': '選項',
    'multiselect': '多選',
    'checkbox': '核取方塊',
    'url': '網址',
    'email': '電子郵件',
    'phone': '電話',
    'tags': '標籤',
    'relation': '關聯',
  };
  return labels[type] || type;
}

function getPositionStyle(anchorEl: HTMLElement): React.CSSProperties {
  const rect = anchorEl.getBoundingClientRect();
  return {
    position: 'absolute',
    top: rect.bottom + 8,
    left: rect.left,
    zIndex: 1000,
  };
}