/**
 * Glide Data Grid 實作的 Notion 風格資料庫表格
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  DataEditor,
  GridColumn,
  GridCell,
  GridCellKind,
  Theme,
  CompactSelection,
  EditableGridCell,
  Rectangle,
  Item,
  DataEditorRef,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { TableColumn } from '@/types/table';
import { Icon } from '@/components/common/Icon';

interface GlideNotionTableProps {
  data: any[];
  columns: TableColumn[];
  onAddRow?: (rowData?: Record<string, any>) => void | Promise<void>;
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>;
  onRowPress?: (item: any) => void;
  multiSelectMode?: boolean;
  selectedItems?: string[];
  onSelect?: (selectedIds: string[]) => void;
}

// Notion 風格主題
const notionTheme: Partial<Theme> = {
  accentColor: '#0070f3',
  accentFg: '#ffffff',
  accentLight: '#e3f1ff',
  bgCell: '#ffffff',
  bgCellMedium: '#f7f6f3',
  bgHeader: '#ffffff',
  bgHeaderHasFocus: '#f7f6f3',
  bgHeaderHovered: '#f7f6f3',
  bgIconHeader: '#f7f6f3',
  bgSearchResult: '#fff3a3',
  borderColor: '#e9e9e7',
  cellHorizontalPadding: 8,
  cellVerticalPadding: 5,
  editorFontSize: '13px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fgIconHeader: '#37352f',
  headerFontStyle: '600 13px',
  headerIconSize: 16,
  lineHeight: 1.5,
  linkColor: '#0070f3',
  textDark: '#37352f',
  textGroupHeader: '#787774',
  textHeader: '#37352f',
  textLight: '#b4b4b3',
  textMedium: '#787774',
};

export const GlideNotionTable: React.FC<GlideNotionTableProps> = ({
  data,
  columns,
  onAddRow,
  onUpdateCell,
  onRowPress,
  multiSelectMode = false,
  selectedItems = [],
  onSelect,
}) => {
  const gridRef = useRef<DataEditorRef>(null);
  const [selection, setSelection] = useState<CompactSelection>(() => {
    // 初始化選擇狀態
    const rows = CompactSelection.empty();
    if (multiSelectMode && selectedItems.length > 0) {
      selectedItems.forEach(id => {
        const index = data.findIndex(item => item.id === id);
        if (index >= 0) {
          rows.add(index);
        }
      });
    }
    return {
      columns: CompactSelection.empty(),
      rows,
    };
  });

  // 轉換欄位定義為 Glide Grid 格式，支援調整寬度
  const gridColumns: GridColumn[] = useMemo(() => {
    const dataColumns = columns.map(col => ({
      id: col.key,
      title: col.title,
      width: col.width || 180,
      minWidth: 100,
      maxWidth: 400,
      icon: undefined,
      hasMenu: false,
      grow: 0,
    }));

    // 新增欄位按鈕
    const addColumnColumn: GridColumn = {
      id: '__add_column__',
      title: '',
      width: 40,
      icon: 'headerPlus' as any,
      hasMenu: false,
      grow: 0,
    };

    return [...dataColumns, addColumnColumn];
  }, [columns]);

  // 取得儲存格資料
  const getCellContent = useCallback((cell: Item): GridCell => {
    const [col, row] = cell;

    // 新增欄位按鈕
    if (col === columns.length) {
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: false,
      };
    }

    const column = columns[col];
    const rowData = data[row];
    
    if (!column || !rowData) {
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: false,
      };
    }

    const value = rowData[column.key] || '';
    
    // 根據欄位類型返回不同的儲存格
    switch (column.type) {
      case 'number':
        return {
          kind: GridCellKind.Number,
          data: Number(value) || 0,
          displayData: String(value),
          allowOverlay: true,
          readonly: !onUpdateCell,
        };
      
      case 'boolean':
        return {
          kind: GridCellKind.Boolean,
          data: Boolean(value),
          allowOverlay: false,
          readonly: !onUpdateCell,
        };
      
      case 'date':
        return {
          kind: GridCellKind.Text,
          data: value,
          displayData: value ? new Date(value).toLocaleDateString('zh-TW') : '',
          allowOverlay: true,
          readonly: !onUpdateCell,
        };
      
      case 'select':
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          readonly: !onUpdateCell,
          data: {
            kind: 'select-cell',
            value: value,
            options: column.options || [],
          },
        };
      
      case 'tags':
      case 'multiselect':
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          readonly: !onUpdateCell,
          data: {
            kind: 'tags-cell',
            value: Array.isArray(value) ? value : value ? [value] : [],
            options: column.options || [],
          },
        };
      
      default:
        return {
          kind: GridCellKind.Text,
          data: String(value),
          displayData: String(value),
          allowOverlay: true,
          readonly: !onUpdateCell,
        };
    }
  }, [columns, data, onUpdateCell]);

  // 處理儲存格編輯
  const onCellEdited = useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, row] = cell;
    if (col === columns.length) return; // 新增欄位按鈕不可編輯

    const column = columns[col];
    const rowData = data[row];
    
    if (!column || !rowData || !onUpdateCell) return;

    let value: any;
    switch (newValue.kind) {
      case GridCellKind.Text:
        value = newValue.data;
        break;
      case GridCellKind.Number:
        value = newValue.data;
        break;
      case GridCellKind.Boolean:
        value = newValue.data;
        break;
      case GridCellKind.Custom:
        value = newValue.data.value;
        break;
      default:
        value = newValue.data;
    }

    onUpdateCell(rowData.id, column.key, value);
  }, [columns, data, onUpdateCell]);

  // 處理列點擊
  const onItemHovered = useCallback((args: any) => {
    if (args.kind === 'header' && args.location[0] === columns.length) {
      // 點擊新增欄位按鈕
      console.log('Add new column');
    }
  }, [columns.length]);

  // 處理選擇變更
  const onSelectionChanged = useCallback((newSelection: CompactSelection) => {
    setSelection(newSelection);
    
    if (multiSelectMode && onSelect) {
      const selectedRows: string[] = [];
      for (let i = 0; i < data.length; i++) {
        if (newSelection.rows.hasIndex(i)) {
          selectedRows.push(data[i].id);
        }
      }
      onSelect(selectedRows);
    }
  }, [data, multiSelectMode, onSelect]);

  // 處理新增列
  const handleAddRow = useCallback(() => {
    if (onAddRow) {
      onAddRow({});
    }
  }, [onAddRow]);

  // 自訂儲存格渲染
  const drawCell = useCallback((args: any) => {
    const { cell, rect, ctx, theme } = args;
    
    if (cell.data?.kind === 'select-cell') {
      // 繪製下拉選單
      const value = cell.data.value;
      ctx.fillStyle = theme.bgCellMedium;
      ctx.fillRect(rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8);
      ctx.fillStyle = theme.textDark;
      ctx.font = theme.baseFontStyle;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(value || '選擇...', rect.x + 8, rect.y + rect.height / 2);
      return true;
    }
    
    if (cell.data?.kind === 'tags-cell') {
      // 繪製標籤
      const tags = cell.data.value;
      ctx.fillStyle = theme.textDark;
      ctx.font = theme.baseFontStyle;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const text = tags.length > 0 ? tags.join(', ') : '新增標籤...';
      ctx.fillText(text, rect.x + 8, rect.y + rect.height / 2);
      return true;
    }
    
    return false;
  }, []);

  // 自訂標題渲染
  const drawHeader = useCallback((args: any) => {
    const { ctx, rect, column, theme } = args;
    
    if (column.id === '__add_column__') {
      // 繪製新增欄位按鈕
      ctx.fillStyle = theme.textLight;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', rect.x + rect.width / 2, rect.y + rect.height / 2);
      return true;
    }
    
    return false;
  }, []);

  return (
    <div className="glide-notion-table-wrapper">
      <div className="glide-notion-table-content">
        <div className="glide-notion-table-container">
          <DataEditor
            ref={gridRef}
            theme={notionTheme}
            columns={gridColumns}
            rows={data.length}
            getCellContent={getCellContent}
            onCellEdited={onCellEdited}
            onColumnResize={(column, newSize) => {
              console.log(`Column ${column.id} resized to ${newSize}`);
            }}
            rowMarkers={multiSelectMode ? 'checkbox' : 'number'}
            rowSelectionMode={multiSelectMode ? 'multi' : 'none'}
            selection={selection}
            onSelectionChanged={onSelectionChanged}
            onItemHovered={onItemHovered}
            smoothScrollX={true}
            smoothScrollY={true}
            rowHeight={36}
            headerHeight={36}
            freezeColumns={0}
            getCellsForSelection={true}
            drawCell={drawCell}
            drawHeader={drawHeader}
            keybindings={{
              search: true,
              downFill: true,
              rightFill: true,
              clear: true,
              copy: true,
              paste: true,
              selectAll: true,
              selectRow: true,
              selectColumn: true,
            }}
            onRowAppended={onAddRow ? handleAddRow : undefined}
            trailingRowOptions={{
              hint: '新增列...',
              tint: '#787774',
              targetColumn: 0,
            }}
          />
        </div>
        
        {/* 功能列 - 置右 */}
        <div className="notion-table-actions">
          <button className="notion-action-button">
            <Icon name="filter" size={14} />
            <span>篩選</span>
          </button>
          <button className="notion-action-button">
            <Icon name="sort" size={14} />
            <span>排序</span>
          </button>
          <button className="notion-action-button">
            <Icon name="search" size={14} />
            <span>搜尋</span>
          </button>
          <div className="notion-action-separator" />
          <button className="notion-new-button">
            新增
          </button>
        </div>
      </div>
      
      <style>{`
        .glide-notion-table-wrapper {
          width: 100%;
          min-height: 100vh;
          background: white;
          padding: 60px 96px;
        }
        
        .glide-notion-table-content {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }
        
        .glide-notion-table-container {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          background: white;
          margin-top: 24px;
        }
        
        .notion-table-actions {
          position: absolute;
          top: -36px;
          right: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .notion-action-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: none;
          background: transparent;
          color: #787774;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.1s ease;
        }
        
        .notion-action-button:hover {
          background: #f7f6f3;
          color: #37352f;
        }
        
        .notion-action-separator {
          width: 1px;
          height: 16px;
          background: #e9e9e7;
          margin: 0 4px;
        }
        
        .notion-new-button {
          padding: 4px 12px;
          border: none;
          background: #0070f3;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.1s ease;
        }
        
        .notion-new-button:hover {
          background: #0051cc;
        }
        
        /* 覆蓋 Glide Grid 預設樣式 */
        .dvn-underlay {
          background: white !important;
        }
        
        .dvn-scroll-inner {
          background: white !important;
          min-width: 100%;
        }
        
        .dvn-cell {
          font-size: 13px !important;
          border-right: 1px solid #e9e9e7 !important;
          border-bottom: 1px solid #e9e9e7 !important;
        }
        
        .dvn-header {
          font-weight: 500 !important;
          font-size: 13px !important;
          color: #787774 !important;
          background: white !important;
          border-bottom: 1px solid #e9e9e7 !important;
          border-right: 1px solid #e9e9e7 !important;
        }
        
        /* 移除容器邊框 */
        .dvn-container {
          border: none !important;
        }
        
        /* 確保表格有最小寬度 */
        .glide-data-editor {
          min-width: 100%;
        }
        
        /* 列標記樣式 */
        .dvn-marker {
          background: #fbfbfa !important;
          border-right: 1px solid #e9e9e7 !important;
          color: #b4b4b3 !important;
          font-size: 12px !important;
        }
        
        /* 編輯器樣式 */
        .gdg-growing-entry {
          border: 2px solid #0070f3 !important;
          border-radius: 4px !important;
          font-size: 13px !important;
          padding: 4px 8px !important;
        }
        
        /* 選擇框樣式 */
        .dvn-checkbox {
          accent-color: #0070f3;
        }
        
        /* 新增列提示樣式 */
        .dvn-trailing-row {
          color: #b4b4b3 !important;
          font-style: normal !important;
        }
      `}</style>
    </div>
  );
};