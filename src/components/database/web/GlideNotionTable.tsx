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

    return [actionColumn, ...dataColumns];
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
    setIsAddingRow(true);
    setTempRowData({});
    // 滾動到底部
    setTimeout(() => {
      gridRef.current?.scrollTo(0, displayData.length, 'vertical', 0, 0, {
        vAlign: 'end',
      });
    }, 100);
  }, [displayData.length]);

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
    
    return false;
  }, []);

  return (
    <div className="glide-notion-table-wrapper">
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
          rightElement={
            <div className="notion-add-row-container">
              {!isAddingRow ? (
                <button
                  className="notion-add-row-button"
                  onClick={handleAddRow}
                >
                  <Icon name="add" size={16} />
                  <span>新增列</span>
                </button>
              ) : (
                <div className="notion-new-row-actions">
                  <button
                    className="notion-button notion-button-primary"
                    onClick={handleSaveNewRow}
                  >
                    儲存
                  </button>
                  <button
                    className="notion-button"
                    onClick={handleCancelNewRow}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          }
          rightElementProps={{
            sticky: true,
            fill: false,
          }}
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
      </div>
      
      {/* 底部新增欄位按鈕 */}
      <div className="notion-table-footer">
        <button className="notion-add-column-button">
          <Icon name="add" size={14} />
          <span>新增欄位</span>
        </button>
      </div>
      
      <style>{`
        .glide-notion-table-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fbfbfa;
          padding: 60px;
        }
        
        .glide-notion-table-container {
          flex: 1;
          background: white;
          border: 1px solid #eeeeec;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
        }
        
        .dvn-header {
          font-weight: 600 !important;
          background: #f7f6f3 !important;
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