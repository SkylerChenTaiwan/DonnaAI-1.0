/**
 * Notion 風格資料庫表格主元件
 */

import React, { useCallback, useMemo, useState, useRef } from 'react';
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

export const NotionTable: React.FC<NotionTableProps> = ({
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
}) => {
  // 除錯日誌
  console.log('🎯 NotionTable 渲染:', {
    dataLength: data?.length,
    columnsLength: columns?.length,
    loading,
    error,
    data: data?.slice(0, 2), // 顯示前兩筆資料
    columns: columns?.map(c => ({ id: c.id, title: c.title, type: c.type })),
  });
  // Column management
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    columns.forEach(col => {
      widths[col.id] = col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH;
    });
    return widths;
  });
  
  // Selection management
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(
    new Set(selectedRows)
  );
  
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
  
  // Helper function to render cell content based on column type
  const renderCellContent = useCallback((row: any, column: any) => {
    const value = row[column.key];
    
    if (Platform.OS !== 'web') {
      // React Native fallback
      return value || '空白';
    }
    
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
  }, [handleCellEdit]);
  
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
  
  // Handle add row
  const handleAddRow = useCallback(() => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.key] = col.type === 'checkbox' ? false : '';
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
  
  // Empty state
  if (data.length === 0) {
    console.log('📋 NotionTable 空狀態渲染');
    
    if (Platform.OS === 'web') {
      return React.createElement('div', 
        { className: 'notion-database-wrapper' },
        React.createElement('div', 
          { className: 'notion-database-container' },
          React.createElement('div', 
            { className: 'notion-empty-state' },
            React.createElement('div', 
              { className: 'notion-empty-icon' }, 
              '📋'
            ),
            React.createElement('div', 
              { className: 'notion-empty-title' }, 
              emptyMessage
            ),
            onRowAdd && React.createElement('button', {
              className: 'notion-button notion-button-primary',
              onClick: handleAddRow,
              style: { marginTop: 16 }
            }, '新增第一筆資料')
          )
        )
      ) as any;
    }
    
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
  
  // 當有資料時渲染完整的 Notion 風格表格
  if (Platform.OS === 'web') {
    return React.createElement('div', 
      { className: 'notion-database-wrapper' },
      React.createElement('div', 
        { className: 'notion-database-container' },
        React.createElement('div', 
          { className: 'notion-database-toolbar' },
          React.createElement('div', 
            { className: 'notion-toolbar-left' },
            React.createElement('span', 
              { className: 'notion-view-info' }, 
              `${data.length} 筆記錄`
            )
          ),
          React.createElement('div', 
            { className: 'notion-toolbar-right' },
            onColumnAdd && React.createElement('button', 
              { 
                className: 'notion-button',
                onClick: onColumnAdd
              }, 
              '+ 新增欄位'
            )
          )
        ),
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
                }, column.title)
              )
            )
          ),
          React.createElement('tbody', {},
            data.map((row, index) => 
              React.createElement('tr', {
                key: row.id,
                className: `notion-data-row ${selectedRowsSet.has(row.id) ? 'selected' : ''}`,
                onClick: () => onRowClick?.(row)
              },
                columnsWithWidths.map((column) => 
                  React.createElement('td', {
                    key: column.id,
                    className: 'notion-cell'
                  },
                    React.createElement('div', {
                      className: 'notion-cell-content'
                    }, renderCellContent(row, column))
                  )
                )
              )
            ),
            onRowAdd && React.createElement('tr', 
              { className: 'notion-add-row' },
              React.createElement('td', {
                colSpan: columnsWithWidths.length,
                className: 'notion-add-row-cell'
              },
                React.createElement('button', {
                  className: 'notion-add-row-button',
                  onClick: handleAddRow
                }, '+ 新增列')
              )
            )
          )
        )
      )
    ) as any;
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