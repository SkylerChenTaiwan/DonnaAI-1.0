/**
 * Notion 風格資料庫表格主元件
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import '../web/styles/NotionDatabaseV4.css';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { 
  NotionTableProps, 
  CellPosition, 
  ColumnConfig, 
  FilterGroup, 
  Sort, 
  SearchConfig 
} from './types';
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
import { useKeyboardNavigation } from './managers/KeyboardNavigationManager';
import { FilterManager, createEmptyFilterGroup, useFilterManager } from './managers/FilterManager';
import { SortManager, useSortManager } from './managers/SortManager';
import { GroupManager, useGroupManager, createGroupConfig } from './managers/GroupManager';
import type { GroupConfig } from './types';
import { SearchManager, useSearch, createDefaultSearchConfig } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { SortPanel } from './components/SortPanel';
import { GroupPanel } from './components/GroupPanel';
import { SearchPanel } from './components/SearchPanel';
import { ColumnManager } from './components/ColumnManager';
import { SimpleColumnResize } from './components/SimpleColumnResize';

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
  
  // 表格 ID
  const tableId = useMemo(() => `notion-table-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Column management - 使用 useMemo 避免無限重新渲染
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // 初始化時就設定欄位寬度
    const widths: Record<string, number> = {};
    columns.forEach(col => {
      widths[col.id] = col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH;
    });
    return widths;
  });
  
  // 處理欄位寬度調整完成
  const handleResizeComplete = useCallback((newWidths: Record<string, number>) => {
    // 更新本地狀態
    setColumnWidths(newWidths);
    
    // 通知父組件
    if (onColumnReorder) {
      const updatedColumns = columns.map(col => ({
        ...col,
        width: newWidths[col.id] || col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH
      }));
      onColumnReorder(updatedColumns);
    }
  }, [columns, onColumnReorder]);
  
  // Selection management - 初始化為空，避免依賴外部 props
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  // === 新增功能狀態管理 ===
  
  // 過濾狀態
  const [filters, setFilters] = useState<FilterGroup>(() => createEmptyFilterGroup());
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterButtonRef, setFilterButtonRef] = useState<HTMLElement | null>(null);

  // 排序狀態
  const [sorts, setSorts] = useState<Sort[]>([]);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [sortButtonRef, setSortButtonRef] = useState<HTMLElement | null>(null);

  // 搜尋狀態
  const [searchConfig, setSearchConfig] = useState<SearchConfig>(() => createDefaultSearchConfig());
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchButtonRef, setSearchButtonRef] = useState<HTMLElement | null>(null);
  
  // 群組狀態
  const [groupConfig, setGroupConfig] = useState<GroupConfig | null>(null);
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [groupButtonRef, setGroupButtonRef] = useState<HTMLElement | null>(null);
  
  // 設定選單狀態
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [settingsButtonRef, setSettingsButtonRef] = useState<HTMLElement | null>(null);
  
  // 欄位管理狀態
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [columnManagerButtonRef, setColumnManagerButtonRef] = useState<HTMLElement | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(col => col.id));
  
  // 同步欄位寬度變更（只在欄位結構改變時）
  const prevColumnsRef = useRef(columns);
  useEffect(() => {
    // 檢查是否有新增的欄位
    const newColumns = columns.filter(col => 
      !prevColumnsRef.current.find(prev => prev.id === col.id)
    );
    
    if (newColumns.length > 0) {
      const widths: Record<string, number> = {};
      newColumns.forEach(col => {
        widths[col.id] = col.width || NOTION_DEFAULTS.DEFAULT_COLUMN_WIDTH;
      });
      setColumnWidths(prev => ({ ...prev, ...widths }));
    }
    
    prevColumnsRef.current = columns;
  }, [columns.length]); // 只依賴長度，不依賴整個陣列
  
  const selectedRowsSet = useMemo(
    () => new Set(selectedRows.length > 0 ? selectedRows : internalSelectedRows),
    [selectedRows, internalSelectedRows]
  );

  // === 資料轉換管道 ===
  
  // 1. 首先應用過濾
  const filteredData = useFilterManager(data, filters);
  
  // 2. 然後應用搜尋
  const { filteredData: searchedData, searchResults, searchManager } = useSearch(filteredData, searchConfig);
  
  // 3. 然後應用排序
  const sortedData = useSortManager(searchedData, sorts);
  
  // 4. 最後應用群組
  const groupManager = useMemo(() => new GroupManager(), []);
  const groupedData = useGroupManager(sortedData, groupConfig, columns);
  
  // 最終處理的資料 - 如果沒有群組，使用排序後的資料
  const processedData = sortedData;
  
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
    selectedCell,
    setSelectedCell,
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
  
  // 將 row/col 格式轉換為 rowId/columnKey 格式
  const convertPositionToCell = useCallback((position: CellPosition | null) => {
    if (!position || position.row >= processedData.length || position.col >= columns.length) {
      return null;
    }
    return {
      rowId: processedData[position.row].id,
      columnKey: columns[position.col].key,
    };
  }, [processedData, columns]);
  
  // 將 rowId/columnKey 格式轉換為 row/col 格式
  const convertCellToPosition = useCallback((cell: { rowId: string; columnKey: string } | null) => {
    if (!cell) return null;
    const row = processedData.findIndex(r => r.id === cell.rowId);
    const col = columns.findIndex(c => c.key === cell.columnKey);
    if (row === -1 || col === -1) return null;
    return { row, col };
  }, [processedData, columns]);
  
  // 設置鍵盤導航 - 使用處理後的資料
  const navigationManager = useKeyboardNavigation({
    currentCell: convertPositionToCell(selectedCell),
    editingCell: convertPositionToCell(editingCell),
    rows: processedData,
    columns: columns,
    onCellSelect: (cell) => {
      const position = convertCellToPosition(cell);
      if (position) {
        setSelectedCell(position);
      }
    },
    onCellEdit: (cell) => {
      const position = convertCellToPosition(cell);
      if (position) {
        setEditingCell(position);
      }
    },
    onCellUpdate: (rowId, columnKey, value) => {
      debouncedUpdate(rowId, columnKey, value);
    },
    onEditComplete: () => {
      setEditingCell(null);
    },
  });

  // === 新功能事件處理器 ===

  // 過濾事件處理器
  const handleFilterButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔍 過濾按鈕被點擊');
    setFilterButtonRef(event.currentTarget);
    setIsFilterPanelOpen(true);
    console.log('🔍 過濾面板狀態設為 true');
  }, []);

  const handleFilterPanelClose = useCallback(() => {
    setIsFilterPanelOpen(false);
    setFilterButtonRef(null);
  }, []);

  // 排序事件處理器
  const handleSortButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('📊 排序按鈕被點擊');
    setSortButtonRef(event.currentTarget);
    setIsSortPanelOpen(true);
    console.log('📊 排序面板狀態設為 true');
  }, []);

  const handleSortPanelClose = useCallback(() => {
    setIsSortPanelOpen(false);
    setSortButtonRef(null);
  }, []);

  // 搜尋事件處理器
  const handleSearchButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setSearchButtonRef(event.currentTarget);
    setIsSearchPanelOpen(true);
  }, []);
  
  const handleSearchPanelClose = useCallback(() => {
    setIsSearchPanelOpen(false);
  }, []);

  // 群組事件處理器
  const handleGroupButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('👥 群組按鈕被點擊');
    setGroupButtonRef(event.currentTarget);
    setIsGroupPanelOpen(true);
  }, []);

  const handleGroupPanelClose = useCallback(() => {
    setIsGroupPanelOpen(false);
    setGroupButtonRef(null);
  }, []);

  // 設定選單事件處理器
  const handleSettingsButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('⚙️ 設定選單按鈕被點擊');
    setSettingsButtonRef(event.currentTarget);
    setIsSettingsMenuOpen(true);
  }, []);

  const handleSettingsMenuClose = useCallback(() => {
    setIsSettingsMenuOpen(false);
    setSettingsButtonRef(null);
  }, []);

  // 從設定選單觸發的事件處理器
  const handleFilterFromMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔍 從設定選單觸發過濾');
    setFilterButtonRef(event.currentTarget);
    setIsFilterPanelOpen(true);
    setIsSettingsMenuOpen(false); // 關閉設定選單
  }, []);

  const handleSortFromMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('📊 從設定選單觸發排序');
    setSortButtonRef(event.currentTarget);
    setIsSortPanelOpen(true);
    setIsSettingsMenuOpen(false); // 關閉設定選單
  }, []);

  // 統計資訊
  const statsInfo = useMemo(() => {
    const activeFilters = filters.filters.filter(f => 
      'isActive' in f ? f.isActive : true
    ).length;
    const activeSorts = sorts.length;
    const isSearching = !!searchConfig.query.trim();
    
    return {
      totalRows: data.length,
      filteredRows: processedData.length,
      activeFilters,
      activeSorts,
      isSearching,
      hasTransformations: activeFilters > 0 || activeSorts > 0 || isSearching,
    };
  }, [filters.filters, sorts.length, searchConfig.query, data.length, processedData.length]);
  
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
      const allIds = processedData.map(row => row.id);
      setInternalSelectedRows(new Set(allIds));
      onSelectionChange?.(allIds);
    } else {
      setInternalSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  }, [processedData, onSelectionChange]);
  
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
    console.log('🎯 NotionTable handleAddRow 被調用');
    console.log('🎯 onRowAdd 是否存在:', !!onRowAdd);
    
    if (!onRowAdd) {
      console.error('❌ onRowAdd 函數未定義');
      return;
    }

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
    
    console.log('🎯 調用 onRowAdd（不傳遞資料，讓 DatabaseScreen 創建草稿行）');
    onRowAdd();
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
          // 左側：只有視圖標籤
          React.createElement('div', 
            { className: 'notion-toolbar-left' },
            // 視圖標籤
            React.createElement('div', 
              { className: 'notion-view-tab active' },
              React.createElement('span', { className: 'notion-view-icon' }, NotionIcons.table()),
              ' 表格'
            )
          ),
          // 右側功能按鈕
          React.createElement('div', 
            { className: 'notion-toolbar-right' },
            // 過濾按鈕
            React.createElement('button', 
              { 
                className: `notion-button ${statsInfo.activeFilters > 0 ? 'notion-button-active' : ''}`,
                onClick: handleFilterButtonClick,
                title: `過濾 ${statsInfo.activeFilters > 0 ? `(${statsInfo.activeFilters} 個條件)` : ''}`
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.filter()),
              '過濾',
              statsInfo.activeFilters > 0 && React.createElement('span', {
                className: 'notion-button-badge'
              }, statsInfo.activeFilters.toString())
            ),
            // 排序按鈕
            React.createElement('button', 
              { 
                className: `notion-button ${statsInfo.activeSorts > 0 ? 'notion-button-active' : ''}`,
                onClick: handleSortButtonClick,
                title: `排序 ${statsInfo.activeSorts > 0 ? `(${statsInfo.activeSorts} 個規則)` : ''}`
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.sort()),
              '排序',
              statsInfo.activeSorts > 0 && React.createElement('span', {
                className: 'notion-button-badge'
              }, statsInfo.activeSorts.toString())
            ),
            // 群組按鈕
            React.createElement('button', 
              { 
                className: `notion-button ${groupConfig ? 'notion-button-active' : ''}`,
                onClick: handleGroupButtonClick,
                title: `群組 ${groupConfig ? `(按 ${columns.find(c => c.key === groupConfig.columnKey)?.title})` : ''}`
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.group()),
              '群組',
              groupConfig && React.createElement('span', {
                className: 'notion-button-badge'
              }, '1')
            ),
            // 搜尋按鈕
            React.createElement('button', 
              { 
                className: `notion-button ${statsInfo.isSearching ? 'notion-button-active' : ''}`,
                onClick: handleSearchButtonClick,
                title: statsInfo.isSearching ? `搜尋中: "${searchConfig.query}"` : '搜尋'
              },
              React.createElement('span', { className: 'notion-button-icon' }, NotionIcons.search()),
              '搜尋',
              statsInfo.isSearching && React.createElement('span', {
                className: 'notion-button-badge'
              }, '✓')
            ),
            React.createElement('button', 
              { 
                ref: (el) => setColumnManagerButtonRef(el),
                className: 'notion-button',
                onClick: () => setIsColumnManagerOpen(!isColumnManagerOpen),
                title: '自訂屬性'
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
        // 表格寬度調整管理器
        React.createElement(SimpleColumnResize, {
          tableId,
          onWidthsChange: handleResizeComplete
        }),
        
        // 顯示表格
        React.createElement('table', 
          { 
            id: tableId,
            className: 'notion-database-table' 
          },
          React.createElement('thead', {},
            React.createElement('tr', 
              { className: 'notion-header-row' },
              columnsWithWidths.filter(col => visibleColumns.includes(col.id)).map((column) => 
                React.createElement('th', {
                  key: column.id,
                  className: 'notion-header-cell',
                  'data-column': column.key,
                  'data-column-id': column.id,
                  style: { 
                    '--col-width': `var(--col-${column.id}-width, ${column.width}px)`,
                    position: 'relative' 
                  } as React.CSSProperties
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
                  ),
                  // 新增欄位寬度調整器
                  column.resizable !== false && React.createElement('div', {
                    className: 'notion-column-resizer',
                    'data-column-id': column.id
                  })
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
            // 如果有群組，渲染群組結構
            groupConfig && groupedData.length > 0 ? 
              groupedData.map((group, groupIndex) => [
                // 群組標題行
                React.createElement('tr', {
                  key: `group-${group.groupKey}`,
                  className: `notion-group-header ${group.collapsed ? 'collapsed' : ''}`,
                  onClick: () => {
                    const newConfig = groupManager.toggleGroupCollapse(groupConfig, group.groupKey);
                    setGroupConfig(newConfig);
                  }
                },
                  React.createElement('td', {
                    colSpan: columnsWithWidths.length + 1,
                    style: { padding: 0 }
                  },
                    React.createElement('div', {
                      style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }
                    },
                      React.createElement('span', {
                        className: 'notion-group-collapse-icon'
                      }, '▼'),
                      React.createElement('span', {
                        className: 'notion-group-title'
                      }, group.label),
                      React.createElement('span', {
                        className: 'notion-group-count'
                      }, `(${group.count})`)
                    )
                  )
                ),
                // 群組內的資料行（如果未折疊）
                !group.collapsed && group.items.map((row: any, index: number) => 
                  React.createElement('tr', {
                    key: row.id,
                    className: `notion-data-row ${selectedRowsSet.has(row.id) ? 'selected' : ''}`,
                    onClick: () => onRowClick?.(row)
                  },
                    columnsWithWidths.filter(col => visibleColumns.includes(col.id)).map((column) => 
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
                // 如果群組是空的且未折疊，顯示空訊息
                !group.collapsed && group.items.length === 0 && React.createElement('tr', {
                  key: `empty-${group.groupKey}`
                },
                  React.createElement('td', {
                    colSpan: columnsWithWidths.length + 1,
                    className: 'notion-group-empty-message'
                  }, '此群組沒有資料')
                )
              ]).flat() :
              // 沒有群組時，直接渲染資料
              processedData.length > 0 && processedData.map((row, index) => 
                React.createElement('tr', {
                  key: row.id,
                  className: `notion-data-row ${selectedRowsSet.has(row.id) ? 'selected' : ''}`,
                  onClick: () => onRowClick?.(row)
                },
                  columnsWithWidths.filter(col => visibleColumns.includes(col.id)).map((column) => 
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
            (groupConfig ? groupedData.length === 0 : processedData.length === 0) && React.createElement('tr',
              { className: 'notion-empty-row' },
              React.createElement('td', {
                colSpan: columnsWithWidths.length + 1,
                style: { height: '100px', border: 'none' }
              },
                // 顯示適當的空狀態訊息
                React.createElement('div', {
                  style: { 
                    textAlign: 'center', 
                    color: '#9b9a97', 
                    fontStyle: 'italic',
                    padding: '20px'
                  }
                }, 
                  statsInfo.hasTransformations && data.length > 0 
                    ? '沒有符合條件的資料' 
                    : '沒有資料'
                )
              )
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
        ),

        // === 面板組件 ===
        
        // 過濾面板
        React.createElement(FilterPanel, {
          isOpen: isFilterPanelOpen,
          onClose: handleFilterPanelClose,
          columns,
          currentFilters: filters,
          onFiltersChange: setFilters,
          anchorEl: filterButtonRef
        }),

        // 排序面板
        React.createElement(SortPanel, {
          isOpen: isSortPanelOpen,
          onClose: handleSortPanelClose,
          columns,
          currentSorts: sorts,
          onSortsChange: setSorts,
          anchorEl: sortButtonRef
        }),

        // 群組面板
        React.createElement(GroupPanel, {
          isOpen: isGroupPanelOpen,
          onClose: handleGroupPanelClose,
          columns,
          currentGroup: groupConfig,
          onGroupChange: setGroupConfig,
          anchorEl: groupButtonRef
        }),
        
        // 搜尋面板
        React.createElement(SearchPanel, {
          isOpen: isSearchPanelOpen,
          onClose: handleSearchPanelClose,
          searchConfig,
          onSearchChange: setSearchConfig,
          columns,
          anchorEl: searchButtonRef
        }),
        
        // 欄位管理面板
        React.createElement(ColumnManager, {
          isOpen: isColumnManagerOpen,
          onClose: () => setIsColumnManagerOpen(false),
          columns,
          visibleColumns,
          onVisibilityChange: setVisibleColumns,
          onColumnReorder,
          onColumnUpdate: (columnId, updates) => {
            // 這裡需要父元件支援欄位更新
            console.log('更新欄位:', columnId, updates);
          },
          anchorEl: columnManagerButtonRef
        }),

        // 設定選單
        isSettingsMenuOpen && React.createElement('div', {
          className: 'notion-settings-menu-overlay',
          onClick: (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
              handleSettingsMenuClose();
            }
          }
        },
          React.createElement('div', {
            className: 'notion-settings-menu',
            style: settingsButtonRef ? getSettingsMenuPosition(settingsButtonRef) : undefined
          },
            React.createElement('div', {
              className: 'notion-settings-menu-header'
            }, '視圖設定'),
            React.createElement('div', {
              className: 'notion-settings-menu-content'
            },
              React.createElement('button', {
                className: `notion-settings-menu-item ${statsInfo.activeFilters > 0 ? 'active' : ''}`,
                onClick: handleFilterFromMenu
              },
                React.createElement('span', { className: 'notion-menu-item-icon' }, NotionIcons.filter()),
                '過濾',
                statsInfo.activeFilters > 0 && React.createElement('span', {
                  className: 'notion-menu-item-badge'
                }, statsInfo.activeFilters.toString())
              ),
              React.createElement('button', {
                className: `notion-settings-menu-item ${statsInfo.activeSorts > 0 ? 'active' : ''}`,
                onClick: handleSortFromMenu
              },
                React.createElement('span', { className: 'notion-menu-item-icon' }, NotionIcons.sort()),
                '排序',
                statsInfo.activeSorts > 0 && React.createElement('span', {
                  className: 'notion-menu-item-badge'
                }, statsInfo.activeSorts.toString())
              ),
              React.createElement('button', {
                className: 'notion-settings-menu-item',
                onClick: () => console.log('群組（未實作）')
              },
                React.createElement('span', { className: 'notion-menu-item-icon' }, NotionIcons.group()),
                '群組'
              ),
              React.createElement('div', {
                className: 'notion-settings-menu-divider'
              }),
            )
          )
        ),

        // 統計資訊（開發模式顯示）
        process.env.NODE_ENV === 'development' && statsInfo.hasTransformations && React.createElement('div', {
          style: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }
        }, `顯示 ${statsInfo.filteredRows} / ${statsInfo.totalRows} 筆資料`)
      )
    ) as any;
  }

  // React Native 空狀態
  if (processedData.length === 0) {
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
        items={processedData}
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

// === 輔助函數 ===

function getSettingsMenuPosition(anchorEl: HTMLElement): React.CSSProperties {
  const rect = anchorEl.getBoundingClientRect();
  return {
    position: 'absolute',
    top: rect.bottom + 8,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: 1000,
  };
}