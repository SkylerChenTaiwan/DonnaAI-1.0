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
  bgHeader: '#f7f6f3',
  bgHeaderHasFocus: '#eeeeec',
  bgHeaderHovered: '#eeeeec',
  bgIconHeader: '#f7f6f3',
  bgSearchResult: '#fff3a3',
  borderColor: '#eeeeec',
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

  // 新增列的臨時資料
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [tempRowData, setTempRowData] = useState<Record<string, any>>({});

  // 合併顯示資料（包含新增列）
  const displayData = useMemo(() => {
    if (isAddingRow) {
      return [...data, { id: '__temp__', ...tempRowData }];
    }
    return data;
  }, [data, isAddingRow, tempRowData]);

  // 轉換欄位定義為 Glide Grid 格式，支援調整寬度
  const gridColumns: GridColumn[] = useMemo(() => {
    // 新增操作欄
    const actionColumn: GridColumn = {
      id: '__actions__',
      title: '',
      width: 40,
      icon: undefined,
      hasMenu: false,
      grow: 0,
    };

    const dataColumns = columns.map(col => ({
      id: col.key,
      title: col.title,
      width: col.width || 150,
      minWidth: 80,
      maxWidth: 500,
      icon: undefined,
      hasMenu: true,
      grow: col.type === 'text' ? 1 : 0,
    }));

    // 新增欄位按鈕
    const addColumnColumn: GridColumn = {
      id: '__add_column__',
      title: '+',
      width: 40,
      icon: undefined,
      hasMenu: false,
      grow: 0,
    };

    return [actionColumn, ...dataColumns, addColumnColumn];
  }, [columns]);

  // 取得儲存格資料
  const getCellContent = useCallback((cell: Item): GridCell => {
    const [col, row] = cell;
    
    // 操作欄
    if (col === 0) {
      return {
        kind: GridCellKind.Custom,
        allowOverlay: false,
        data: {
          kind: 'action-cell',
          row: row,
        },
      };
    }

    // 新增欄位按鈕
    if (col === gridColumns.length - 1) {
      return {
        kind: GridCellKind.Custom,
        allowOverlay: false,
        data: {
          kind: 'add-column-cell',
        },
      };
    }

    const columnIndex = col - 1; // 減去操作欄
    const column = columns[columnIndex];
    const rowData = displayData[row];
    
    if (!column || !rowData) {
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: false,
      };
    }

    const value = rowData[column.key] || '';
    const isNewRow = rowData.id === '__temp__';
    
    // 根據欄位類型返回不同的儲存格
    switch (column.type) {
      case 'number':
        return {
          kind: GridCellKind.Number,
          data: Number(value) || 0,
          displayData: String(value),
          allowOverlay: true,
          readonly: !onUpdateCell && !isNewRow,
        };
      
      case 'boolean':
        return {
          kind: GridCellKind.Boolean,
          data: Boolean(value),
          allowOverlay: false,
          readonly: !onUpdateCell && !isNewRow,
        };
      
      case 'date':
        return {
          kind: GridCellKind.Text,
          data: value,
          displayData: value ? new Date(value).toLocaleDateString('zh-TW') : '',
          allowOverlay: true,
          readonly: !onUpdateCell && !isNewRow,
        };
      
      case 'select':
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          readonly: !onUpdateCell && !isNewRow,
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
          readonly: !onUpdateCell && !isNewRow,
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
          readonly: !onUpdateCell && !isNewRow,
        };
    }
  }, [columns, displayData, onUpdateCell]);

  // 處理儲存格編輯
  const onCellEdited = useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, row] = cell;
    if (col === 0) return; // 操作欄不可編輯

    const columnIndex = col - 1;
    const column = columns[columnIndex];
    const rowData = displayData[row];
    
    if (!column || !rowData) return;

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

    // 如果是新增列
    if (rowData.id === '__temp__') {
      setTempRowData(prev => ({
        ...prev,
        [column.key]: value,
      }));
    } else if (onUpdateCell) {
      onUpdateCell(rowData.id, column.key, value);
    }
  }, [columns, displayData, onUpdateCell]);

  // 處理列點擊
  const onItemHovered = useCallback((args: any) => {
    if (args.kind === 'cell' && args.location[0] === 0) {
      // 點擊操作欄
      const row = args.location[1];
      const rowData = displayData[row];
      if (rowData && rowData.id !== '__temp__' && onRowPress) {
        onRowPress(rowData);
      }
    }
  }, [displayData, onRowPress]);

  // 處理選擇變更
  const onSelectionChanged = useCallback((newSelection: CompactSelection) => {
    setSelection(newSelection);
    
    if (multiSelectMode && onSelect) {
      const selectedRows: string[] = [];
      for (let i = 0; i < displayData.length; i++) {
        if (newSelection.rows.hasIndex(i) && displayData[i].id !== '__temp__') {
          selectedRows.push(displayData[i].id);
        }
      }
      onSelect(selectedRows);
    }
  }, [displayData, multiSelectMode, onSelect]);

  // 處理新增列
  const handleAddRow = useCallback(() => {
    if (onAddRow) {
      onAddRow({});
    }
  }, [onAddRow]);

  // 儲存新增列
  const handleSaveNewRow = useCallback(async () => {
    if (onAddRow) {
      await onAddRow(tempRowData);
      setIsAddingRow(false);
      setTempRowData({});
    }
  }, [onAddRow, tempRowData]);

  // 取消新增列
  const handleCancelNewRow = useCallback(() => {
    setIsAddingRow(false);
    setTempRowData({});
  }, []);

  // 自訂儲存格渲染
  const drawCell = useCallback((args: any) => {
    const { cell, rect, ctx, theme } = args;
    
    if (cell.data?.kind === 'action-cell') {
      // 繪製操作按鈕
      ctx.fillStyle = theme.textMedium;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⋮', rect.x + rect.width / 2, rect.y + rect.height / 2);
      return true;
    }
    
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
    
    if (cell.data?.kind === 'add-column-cell') {
      // 繪製新增欄位按鈕
      ctx.fillStyle = theme.textLight;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', rect.x + rect.width / 2, rect.y + rect.height / 2);
      return true;
    }
    
    return false;
  }, []);

  return (
    <div className="glide-notion-table-wrapper">
      <div className="glide-notion-table-header">
        <h1 className="notion-table-title">新資料庫</h1>
        <div className="notion-table-toolbar">
          <button className="notion-view-button">
            <Icon name="list" size={14} />
            <span>表格</span>
          </button>
          <button className="notion-toolbar-button">
            <Icon name="filter" size={14} />
          </button>
          <button className="notion-toolbar-button">
            <Icon name="sort" size={14} />
          </button>
          <button className="notion-toolbar-button">
            <Icon name="search" size={14} />
          </button>
          <div className="notion-toolbar-separator" />
          <button className="notion-new-button">
            新增
          </button>
        </div>
      </div>
      <div className="glide-notion-table-container">
        <DataEditor
          ref={gridRef}
          theme={notionTheme}
          columns={gridColumns}
          rows={displayData.length}
          getCellContent={getCellContent}
          onCellEdited={onCellEdited}
          onColumnResize={(column, newSize) => {
            // 欄位大小調整回調
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
          freezeColumns={1} // 凍結操作欄
          getCellsForSelection={true}
          drawCell={drawCell}
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
            targetColumn: 1, // 跳過操作欄
          }}
        />
      </div>
      
      
      <style>{`
        .glide-notion-table-wrapper {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: white;
          padding: 0 96px;
        }
        
        .glide-notion-table-header {
          padding: 40px 0 20px;
        }
        
        .notion-table-title {
          font-size: 40px;
          font-weight: 700;
          color: #37352f;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }
        
        .notion-table-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
        
        .notion-view-button,
        .notion-toolbar-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border: none;
          background: transparent;
          color: #787774;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.1s ease;
        }
        
        .notion-view-button:hover,
        .notion-toolbar-button:hover {
          background: #f7f6f3;
          color: #37352f;
        }
        
        .notion-toolbar-separator {
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
        
        .glide-notion-table-container {
          flex: 1;
          background: white;
          margin-bottom: 100px;
        }
        
        .notion-add-row-container {
          padding: 8px 16px;
          border-left: 1px solid #eeeeec;
          background: #fbfbfa;
        }
        
        .notion-add-row-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: #787774;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .notion-add-row-button:hover {
          color: #37352f;
          background: #f7f6f3;
          border-radius: 6px;
        }
        
        .notion-new-row-actions {
          display: flex;
          gap: 8px;
        }
        
        .notion-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border: 1px solid #eeeeec;
          border-radius: 4px;
          background: white;
          color: #37352f;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .notion-button:hover {
          background: #f7f6f3;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .notion-button-primary {
          background: #0070f3;
          border-color: #0070f3;
          color: white;
        }
        
        .notion-button-primary:hover {
          background: #0051cc;
          border-color: #0051cc;
        }
        
        .notion-table-footer {
          display: flex;
          align-items: center;
          padding: 16px 0;
        }
        
        .notion-add-column-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: #787774;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s ease;
          border-radius: 6px;
        }
        
        .notion-add-column-button:hover {
          color: #37352f;
          background: #f7f6f3;
        }
        
        /* 覆蓋 Glide Grid 預設樣式 */
        .dvn-underlay {
          background: white !important;
        }
        
        .dvn-scroll-inner {
          background: white !important;
        }
        
        .dvn-cell {
          font-size: 13px !important;
          border-right: 1px solid #e9e9e7 !important;
        }
        
        .dvn-header {
          font-weight: 600 !important;
          background: white !important;
          border-bottom: 1px solid #e9e9e7 !important;
          border-right: 1px solid #e9e9e7 !important;
        }
        
        /* 移除容器邊框 */
        .dvn-container {
          border: none !important;
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
      `}</style>
    </div>
  );
};