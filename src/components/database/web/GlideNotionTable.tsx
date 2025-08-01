/**
 * Glide Data Grid 實作的 Notion 風格資料庫表格
 */

import React, { useState, useCallback, useMemo } from 'react';
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
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { TableColumn } from '@/types/table';

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
  const [selection, setSelection] = useState<CompactSelection>({
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
  });

  // 轉換欄位定義為 Glide Grid 格式
  const gridColumns: GridColumn[] = useMemo(() => {
    return columns.map(col => ({
      id: col.key,
      title: col.title,
      width: 150,
      icon: undefined,
      hasMenu: true,
      grow: 1,
    }));
  }, [columns]);

  // 取得儲存格資料
  const getCellContent = useCallback((cell: Item): GridCell => {
    const [col, row] = cell;
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
        };
      
      case 'boolean':
        return {
          kind: GridCellKind.Boolean,
          data: Boolean(value),
          allowOverlay: false,
        };
      
      case 'date':
        return {
          kind: GridCellKind.Text,
          data: value,
          displayData: value ? new Date(value).toLocaleDateString('zh-TW') : '',
          allowOverlay: true,
        };
      
      default:
        return {
          kind: GridCellKind.Text,
          data: String(value),
          displayData: String(value),
          allowOverlay: true,
        };
    }
  }, [columns, data]);

  // 處理儲存格編輯
  const onCellEdited = useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, row] = cell;
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
      default:
        value = newValue.data;
    }

    onUpdateCell(rowData.id, column.key, value);
  }, [columns, data, onUpdateCell]);

  // 處理列點擊
  const onRowClicked = useCallback((row: number) => {
    const rowData = data[row];
    if (rowData && onRowPress) {
      onRowPress(rowData);
    }
  }, [data, onRowPress]);

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
      onAddRow();
    }
  }, [onAddRow]);

  return (
    <div className="glide-notion-table-wrapper">
      <div className="glide-notion-table-toolbar">
        <button 
          className="notion-button notion-button-primary"
          onClick={handleAddRow}
        >
          <span className="notion-icon">+</span>
          新增
        </button>
        <div className="notion-table-info">
          {data.length} 筆資料
          {multiSelectMode && selectedItems.length > 0 && (
            <span className="notion-selected-count">
              已選擇 {selectedItems.length} 筆
            </span>
          )}
        </div>
      </div>
      
      <DataEditor
        theme={notionTheme}
        columns={gridColumns}
        rows={data.length}
        getCellContent={getCellContent}
        onCellEdited={onCellEdited}
        onRowAppended={onAddRow ? handleAddRow : undefined}
        rowMarkers={multiSelectMode ? 'checkbox' : 'number'}
        rowSelectionMode={multiSelectMode ? 'multi' : 'none'}
        selection={selection}
        onSelectionChanged={onSelectionChanged}
        onItemHovered={(args) => {
          if (args.kind === 'row') {
            onRowClicked(args.location[1]);
          }
        }}
        smoothScrollX={true}
        smoothScrollY={true}
        rowHeight={36}
        headerHeight={36}
        freezeColumns={0}
        getCellsForSelection={true}
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
      />
      
      <style>{`
        .glide-notion-table-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fbfbfa;
        }
        
        .glide-notion-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 60px;
          background: white;
          border-bottom: 1px solid #eeeeec;
        }
        
        .notion-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #eeeeec;
          border-radius: 6px;
          background: white;
          color: #37352f;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .notion-button:hover {
          background: #f7f6f3;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .notion-button-primary {
          background: #37352f;
          border-color: #37352f;
          color: white;
        }
        
        .notion-button-primary:hover {
          background: #2e2c28;
          border-color: #2e2c28;
        }
        
        .notion-icon {
          font-size: 16px;
          line-height: 1;
        }
        
        .notion-table-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #787774;
        }
        
        .notion-selected-count {
          padding: 4px 8px;
          background: #e3f1ff;
          color: #0070f3;
          border-radius: 4px;
          font-weight: 500;
        }
        
        /* 覆蓋 Glide Grid 預設樣式 */
        .dvn-underlay {
          background: #fbfbfa !important;
        }
        
        .dvn-scroll-inner {
          background: white !important;
        }
        
        .dvn-cell {
          font-size: 13px !important;
        }
        
        .dvn-header {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};