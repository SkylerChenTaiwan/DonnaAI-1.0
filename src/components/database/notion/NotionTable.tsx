/**
 * Notion 風格資料庫表格主元件
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import '../web/styles/NotionDatabaseV4.css';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { NotionTableProps, CellPosition, ColumnConfig } from './types';
import { VirtualScroller } from './VirtualScroller';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { useCellStateMachine } from './hooks/useCellStateMachine';
import { tableStyles } from './styles/tableStyles';
import { NOTION_DEFAULTS, NotionColors } from './constants';
import { Icon } from '@/components/common/Icon';
import { useDebouncedUpdate } from '@/hooks/useDebouncedUpdate';
import { EditorFactory } from './editors/EditorFactory';
import { NotionIcons, getPropertyIcon as getNotionPropertyIcon } from './NotionIcons';

export const NotionTable: React.FC<NotionTableProps & { activeTab?: string }> = ({
  data,
  columns,
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
  rowHeight = NOTION_DEFAULTS.ROW_HEIGHT,
  headerHeight = NOTION_DEFAULTS.HEADER_HEIGHT,
  overscan = NOTION_DEFAULTS.OVERSCAN_COUNT,
  activeTab,
}) => {
  // 除錯日誌
  console.log('🎯 NotionTable 渲染:', {
    dataLength: data?.length,
    columnsLength: columns?.length,
    loading,
    error,
    platform: Platform.OS,
    data: data?.slice(0, 2), // 顯示前兩筆資料
    columns: columns?.map(c => ({ id: c.id, title: c.title, type: c.type })),
  });
  
  // Column management - 使用 useMemo 避免無限重新渲染
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  
  // Selection management - 初始化為空，避免依賴外部 props
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());
  
  // 初始化欄位寬度，只在 columns 改變時執行
  useEffect(() => {
    const widths: Record<string, number> = {};
    columns.forEach(col => {
      widths[col.id] = col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH;
    });
    setColumnWidths(widths);
  }, [columns]);
  
  const selectedRowsSet = useMemo(
    () => new Set(selectedRows.length > 0 ? selectedRows : internalSelectedRows),
    [selectedRows, internalSelectedRows]
  );
  
  // Cell state management
  const {
    getCellState,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    handleBlur,
    setEditingCell,
    editingCell,
  } = useCellStateMachine();
  
  // Debounced update for auto-save
  const handleCellUpdate = useCallback(async (rowId: string, columnKey: string, value: any) => {
    try {
      await onCellUpdate?.(rowId, columnKey, value);
    } catch (error) {
      console.error('Failed to update cell:', error);
      // Show error toast
    }
  }, [onCellUpdate]);
  
  const { debouncedUpdate } = useDebouncedUpdate(handleCellUpdate, NOTION_DEFAULTS.DEBOUNCE_DELAY);
  
  // Handle column resize
  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: newWidth,
    }));
  }, []);
  
  // Handle row selection
  const handleSelectRow = useCallback((rowId: string, selected: boolean) => {
    const newSelection = new Set(selectedRowsSet);
    
    if (selected) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    
    setInternalSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  }, [selectedRowsSet, onSelectionChange]);
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIds = data.map(row => row.id);
      setInternalSelectedRows(new Set(allIds));
      onSelectionChange?.(allIds);
    } else {
      setInternalSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  }, [data, onSelectionChange]);
  
  // Handle cell edit
  const handleCellEdit = useCallback((rowId: string, columnKey: string, value: any) => {
    // Exit edit mode
    setEditingCell(null);
    
    // Trigger debounced update
    debouncedUpdate(rowId, columnKey, value);
  }, [debouncedUpdate, setEditingCell]);
  
  // Helper function to get database title and icon based on active tab
  const getDatabaseInfo = useCallback((tab?: string) => {
    switch (tab) {
      case 'customers':
        return { title: '客戶資料庫', icon: '👥', description: '管理客戶聯絡資訊、狀態和相關資料' };
      case 'records':
        return { title: '記錄資料庫', icon: '📄', description: '管理各種記錄和文件資料' };
      case 'tasks':
        return { title: '任務資料庫', icon: '✅', description: '管理任務分配、進度和完成狀態' };
      default:
        return { title: '資料庫', icon: '📊', description: '管理和組織您的資料' };
    }
  }, []);

  // 使用從 NotionIcons 導入的 getPropertyIcon 函數

  // Helper function to render cell content based on column type
  const renderCellContent = useCallback((row: any, column: any) => {
    const value = row[column.key];
    const cellKey = `${row.id}-${column.key}`;
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
    
    if (Platform.OS !== 'web') {
      // React Native fallback
      return value || '空白';
    }
    
    // 如果正在編輯，顯示編輯器
    if (isEditing) {
      return React.createElement('div', {
        style: { 
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          zIndex: 1000
        }
      },
        EditorFactory.createEditor(column.type, {
          value,
          onChange: (newValue: any) => {
            console.log('編輯器更新值:', { rowId: row.id, columnKey: column.key, newValue });
            handleCellEdit(row.id, column.key, newValue);
          },
          onBlur: () => {
            console.log('編輯器失去焦點');
            setEditingCell(null);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              // 移動到下一個儲存格
              const currentColIndex = columns.findIndex((c: any) => c.key === column.key);
              const nextCol = columns[currentColIndex + (e.shiftKey ? -1 : 1)];
              if (nextCol) {
                setEditingCell({ rowId: row.id, columnKey: nextCol.key });
              }
            }
          },
          column,
          autoFocus: true,
        })
      );
    }
    
    // 一般顯示狀態
    switch (column.type) {
      case 'checkbox':
        return React.createElement('input', {
          type: 'checkbox',
          className: 'notion-checkbox',
          checked: !!value,
          onChange: (e: any) => handleCellEdit(row.id, column.key, e.target.checked)
        });
      case 'select':
        if (value && column.options) {
          const option = column.options.find((opt: any) => opt.value === value);
          if (option) {
            return React.createElement('span', {
              className: 'notion-status-tag',
              style: { 
                backgroundColor: option.color || '#f1f3f4',
                color: option.textColor || '#000'
              }
            }, option.label || value);
          }
        }
        return React.createElement('span', {
          className: 'notion-cell-placeholder'
        }, value || '選擇選項');
      case 'date':
        return value 
          ? new Date(value).toLocaleDateString('zh-TW') 
          : React.createElement('span', {
              className: 'notion-cell-placeholder'
            }, '選擇日期');
      default:
        return value || React.createElement('span', {
          className: 'notion-cell-placeholder'
        }, '空白');
    }
  }, [handleCellEdit, editingCell, setEditingCell, columns]);
  
  // Handle add row - 允許空值，不強制必填
  const handleAddRow = useCallback(() => {
    const newRow: any = {
      id: `draft_${Date.now()}`, // 使用臨時 ID
    };
    columns.forEach(col => {
      // 所有欄位都設為預設值，允許空值
      switch (col.type) {
        case 'checkbox':
          newRow[col.key] = false;
          break;
        case 'number':
          newRow[col.key] = null;
          break;
        case 'date':
          newRow[col.key] = null;
          break;
        default:
          newRow[col.key] = '';
      }
    });
    onRowAdd?.(newRow);
  }, [columns, onRowAdd]);
  
  // Prepare columns with updated widths
  const columnsWithWidths = useMemo(() => {
    return columns.map(col => ({
      ...col,
      width: columnWidths[col.id] || col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH,
    }));
  }, [columns, columnWidths]);
  
  // Render row for virtual scroller
  const renderRow = useCallback((rowData: any, index: number) => {
    return (
      <TableRow
        key={rowData.id}
        rowData={rowData}
        rowIndex={index}
        columns={columnsWithWidths}
        isSelected={selectedRowsSet.has(rowData.id)}
        onRowClick={onRowClick}
        onCellClick={handleClick}
        onCellDoubleClick={(position) => setEditingCell(position)}
        onCellMouseEnter={handleMouseEnter}
        onCellMouseLeave={handleMouseLeave}
        onCellEdit={handleCellEdit}
        getCellState={getCellState}
        multiSelectMode={multiSelect}
        onSelectRow={handleSelectRow}
      />
    );
  }, [
    columnsWithWidths,
    selectedRowsSet,
    onRowClick,
    handleClick,
    setEditingCell,
    handleMouseEnter,
    handleMouseLeave,
    handleCellEdit,
    getCellState,
    multiSelect,
    handleSelectRow,
  ]);
  
  // Loading state
  if (loading) {
    return (
      <View style={[tableStyles.container, tableStyles.loadingContainer]}>
        <ActivityIndicator size="large" color={NotionColors.text.gray} />
      </View>
    );
  }
  
  // Error state
  if (error) {
    return (
      <View style={[tableStyles.container, tableStyles.emptyContainer]}>
        <Icon name="alert-circle" size={48} color={NotionColors.text.red} />
        <Text style={[tableStyles.emptyText, { color: NotionColors.text.red, marginTop: 16 }]}>
          載入資料時發生錯誤
        </Text>
      </View>
    );
  }
  
  // Web 平台的完整 Notion 風格界面
  if (Platform.OS === 'web') {
    console.log('🌐 渲染 Notion 風格 Web 界面，資料數量:', data.length);
    
    const dbInfo = getDatabaseInfo(activeTab);
    
    return React.createElement('div', 
      { className: 'notion-database-wrapper' },
      
      React.createElement('div', 
        { className: 'notion-database-container' },
        
        // 標題區域
        React.createElement('div', 
          { className: 'notion-database-header' },
          React.createElement('h1', 
            { className: 'notion-database-title' },
            dbInfo.title
          )
        ),
        
        // 工具列區域 - 包含視圖標籤和功能按鈕
        React.createElement('div', 
          { className: 'notion-toolbar-container' },
          // 左側：視圖標籤和功能按鈕
          React.createElement('div', 
            { className: 'notion-toolbar-left' },
            // 視圖標籤
            React.createElement('div', 
              { className: 'notion-view-tab active' },
              React.createElement('span', { className: 'notion-view-icon' }, NotionIcons.table()),
              ' 表格'
            ),
            // 分隔線
            React.createElement('div', 
              { className: 'notion-toolbar-divider' }
            ),
            // 功能按鈕
            React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: () => console.log('過濾')
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.filter()),
              '過濾'
            ),
            React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: () => console.log('排序')
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.sort()),
              '排序'
            ),
            React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: () => console.log('群組')
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.group()),
              '群組'
            )
          ),
          // 右側功能按鈕
          React.createElement('div', 
            { className: 'notion-toolbar-right' },
            React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: () => console.log('搜尋')
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.search()),
              '搜尋'
            ),
            React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: () => console.log('更多')
              },
              NotionIcons.more()
            ),
            React.createElement('button', 
              { 
                className: 'notion-button notion-button-primary',
                onClick: handleAddRow
              },
              '新建'
            )
          )
        ),
        
        // 顯示表格（不管有沒有資料）
        React.createElement('table', 
          { className: 'notion-database-table' },
          React.createElement('thead', {},
            React.createElement('tr', 
              { className: 'notion-header-row' },
              columnsWithWidths.map((column) => 
                React.createElement('th', {
                  key: column.id,
                  className: 'notion-header-cell',
                  'data-column': column.key,
                  style: { width: column.width }
                },
                  React.createElement('div', 
                    { className: 'notion-header-content' },
                    React.createElement('span', 
                      { className: 'notion-property-icon' }, 
                      getNotionPropertyIcon(column.type)
                    ),
                    React.createElement('span', 
                      { className: 'notion-property-name' }, 
                      column.title
                    ),
                    React.createElement('span', 
                      { className: 'notion-header-actions' },
                      React.createElement('button', 
                        { className: 'notion-header-action-btn' }, 
                        '⋯'
                      )
                    )
                  )
                )
              ),
              // 新增欄位按鈕
              React.createElement('th', 
                { className: 'notion-add-column-cell' },
                onColumnAdd && React.createElement('button', {
                  className: 'notion-add-column-btn',
                  onClick: onColumnAdd
                }, '+')
              )
            )
          ),
          React.createElement('tbody', {},
            // 如果有資料，顯示資料行
            data.length > 0 && data.map((row, index) => 
              React.createElement('tr', {
                key: row.id,
                className: `notion-data-row ${selectedRowsSet.has(row.id) ? 'selected' : ''}`,
                onClick: () => onRowClick?.(row)
              },
                columnsWithWidths.map((column) => 
                  React.createElement('td', {
                    key: column.id,
                    className: 'notion-cell',
                    style: { position: 'relative' },
                    onDoubleClick: () => {
                      console.log('雙擊儲存格:', { rowId: row.id, columnKey: column.key });
                      setEditingCell({ rowId: row.id, columnKey: column.key });
                    }
                  },
                    React.createElement('div', {
                      className: 'notion-cell-content'
                    }, renderCellContent(row, column))
                  )
                ),
                // 空的最後一欄（對應新增欄位按鈕）
                React.createElement('td', 
                  { className: 'notion-cell-empty-column' }
                )
              )
            ),
            // 如果沒有資料，顯示一個空行保持表格結構
            data.length === 0 && React.createElement('tr',
              { className: 'notion-empty-row' },
              React.createElement('td', {
                colSpan: columnsWithWidths.length + 1,
                style: { height: '100px', border: 'none' }
              })
            ),
            // 新增列按鈕
            onRowAdd && React.createElement('tr', 
              { className: 'notion-add-row' },
              React.createElement('td', {
                colSpan: columnsWithWidths.length + 1,
                className: 'notion-add-row-cell'
              },
                React.createElement('button', {
                  className: 'notion-add-row-button',
                  onClick: () => {
                    console.log('🔥 底部新增按鈕被點擊');
                    handleAddRow();
                  }
                }, 
                  React.createElement('span', { className: 'notion-add-icon' }, '+'),
                  '新頁面'
                )
              )
            )
          )
        )
      )
    ) as any;
  }

  // React Native 空狀態
  if (data.length === 0) {
    return (
      <View style={[tableStyles.container, tableStyles.emptyContainer]}>
        <Icon name="folder-open" size={48} color={NotionColors.text.lightGray} />
        <Text style={[tableStyles.emptyText, { marginTop: 16 }]}>
          {emptyMessage}
        </Text>
        {onRowAdd && (
          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: NotionColors.interactive.hover,
              borderRadius: 4,
            }}
            onPress={handleAddRow}
          >
            <Text style={{ color: NotionColors.text.default }}>
              新增第一筆資料
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  

  return (
    <View style={tableStyles.container}>
      {/* Fixed header */}
      <TableHeader
        columns={columnsWithWidths}
        onColumnResize={handleColumnResize}
        onColumnReorder={onColumnReorder}
        onColumnClick={(column) => {
          // Handle column sort
          console.log('Sort by column:', column.key);
        }}
        onAddColumn={onColumnAdd}
        multiSelectMode={multiSelect}
        allSelected={selectedRowsSet.size === data.length && data.length > 0}
        onSelectAll={handleSelectAll}
      />
      
      {/* Virtual scrolling body */}
      <VirtualScroller
        items={data}
        rowHeight={rowHeight}
        overscan={overscan}
        renderRow={renderRow}
        style={{ flex: 1 }}
      />
      
      {/* Add row button */}
      {onRowAdd && (
        <TouchableOpacity
          style={tableStyles.addRowButton}
          onPress={handleAddRow}
          activeOpacity={0.7}
        >
          <Icon name="add" size={16} color={NotionColors.text.gray} />
          <Text style={tableStyles.addRowText}>新增列</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};