/**
 * Notion 風格表格元件 V6 - 修復 TanStack Table 顯示問題
 */

import React, { useState, useMemo } from 'react';
import { Platform, View, Text } from 'react-native';
import { NotionIcons } from './NotionIcons';
import { FilterPanel } from './components/FilterPanel';
import { SortPanel } from './components/SortPanel';
import { GroupPanel } from './components/GroupPanel';
import { ColumnManager } from './components/ColumnManager';
import { SearchBar } from './components/SearchBar';
import '../web/styles/NotionDatabaseV4.css';

interface NotionTableV6Props {
  data: any[];
  columns: any[];
  onCellUpdate?: (rowId: string, columnKey: string, value: any) => void;
  onRowClick?: (row: any) => void;
  onRowAdd?: () => void;
  onColumnAdd?: () => void;
  onColumnReorder?: (columns: any[]) => void;
  multiSelect?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  activeTab?: string;
}

export const NotionTableV6: React.FC<NotionTableV6Props> = ({
  data = [],
  columns: inputColumns = [],
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
  activeTab,
}) => {
  // 狀態管理
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    inputColumns.map(col => col.id)
  );
  
  // 各種面板狀態
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // 按鈕引用
  const [filterButtonRef, setFilterButtonRef] = useState<HTMLElement | null>(null);
  const [sortButtonRef, setSortButtonRef] = useState<HTMLElement | null>(null);
  const [groupButtonRef, setGroupButtonRef] = useState<HTMLElement | null>(null);
  const [columnManagerButtonRef, setColumnManagerButtonRef] = useState<HTMLElement | null>(null);

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

  // 過濾可見欄位
  const visibleColumnsData = useMemo(() => {
    return inputColumns.filter(col => visibleColumns.includes(col.id));
  }, [inputColumns, visibleColumns]);

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
          width: columnSizing[col.id] || col.width || 180,
        }));
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
    <div className="notion-database-container">
      <div className="notion-database-wrapper">
        {/* 工具列 - Notion 風格 */}
        <div className="notion-view-bar">
          <div className="notion-view-tabs">
            <div className="notion-view-tab active">
              <span className="notion-view-icon">⊞</span>
              <span>表格</span>
            </div>
          </div>
          
          <div className="notion-view-actions">
            <button
              ref={(el) => setSortButtonRef(el)}
              className="notion-icon-button"
              onClick={() => setIsSortPanelOpen(true)}
              title="排序"
            >
              ↕
            </button>
            
            <button
              ref={(el) => setFilterButtonRef(el)}
              className="notion-icon-button"
              onClick={() => setIsFilterPanelOpen(true)}
              title="過濾"
            >
              ⊕
            </button>
            
            <button
              className="notion-text-button notion-button-primary"
              onClick={onRowAdd}
            >
              新建
            </button>
            
            <button
              ref={(el) => setColumnManagerButtonRef(el)}
              className="notion-icon-button"
              onClick={() => setIsColumnManagerOpen(true)}
              title="更多選項"
            >
              ⋯
            </button>
          </div>
        </div>

      {/* 表格容器 */}
      <div className="notion-table-container">
        <table className="notion-database-table">
          <thead>
            <tr className="notion-header-row">
              {visibleColumnsData.map(column => (
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
                <td colSpan={visibleColumnsData.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                  載入中...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleColumnsData.length + 1} style={{ textAlign: 'center', padding: 40 }}>
                  錯誤：{error.message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnsData.length + 1} style={{ textAlign: 'center', padding: 40 }}>
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
                  {visibleColumnsData.map(column => (
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
              <td colSpan={visibleColumnsData.length + 1} className="notion-add-row-cell">
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

      {/* 各種面板 */}
      {isFilterPanelOpen && (
        <FilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          anchorEl={filterButtonRef}
          filters={{ operator: 'and', filters: [] }}
          onFiltersChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isSortPanelOpen && (
        <SortPanel
          isOpen={isSortPanelOpen}
          onClose={() => setIsSortPanelOpen(false)}
          anchorEl={sortButtonRef}
          sorts={[]}
          onSortsChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isGroupPanelOpen && (
        <GroupPanel
          isOpen={isGroupPanelOpen}
          onClose={() => setIsGroupPanelOpen(false)}
          anchorEl={groupButtonRef}
          groupConfig={null}
          onGroupChange={() => {}}
          columns={inputColumns}
        />
      )}

      {isColumnManagerOpen && (
        <ColumnManager
          isOpen={isColumnManagerOpen}
          onClose={() => setIsColumnManagerOpen(false)}
          anchorEl={columnManagerButtonRef}
          columns={inputColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={setVisibleColumns}
          onColumnReorder={onColumnReorder || (() => {})}
        />
      )}

      </div>
    </div>
  );
};