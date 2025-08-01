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
  CustomCell,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { TableColumn } from '@/types/table';
import { Icon } from '@/components/common/Icon';
import { NotionColors, NotionFonts, NotionSpacing, NotionStyles } from './NotionTheme';

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
  accentColor: NotionColors.blue,
  accentFg: NotionColors.bgDefault,
  accentLight: NotionColors.blueLight,
  bgCell: NotionColors.bgDefault,
  bgCellMedium: NotionColors.bgGray,
  bgHeader: NotionColors.bgDefault,
  bgHeaderHasFocus: NotionColors.bgGray,
  bgHeaderHovered: NotionColors.bgGray,
  bgIconHeader: NotionColors.bgDefault,
  bgSearchResult: NotionColors.yellowBg,
  borderColor: NotionColors.border,
  cellHorizontalPadding: 8,
  cellVerticalPadding: 5,
  editorFontSize: NotionFonts.sizeBody,
  fontFamily: NotionFonts.family,
  fgIconHeader: NotionColors.default,
  headerFontStyle: `${NotionFonts.weightMedium} ${NotionFonts.sizeBody}`,
  headerIconSize: 16,
  lineHeight: NotionFonts.lineHeightBody,
  linkColor: NotionColors.blue,
  textDark: NotionColors.default,
  textGroupHeader: NotionColors.gray,
  textHeader: NotionColors.gray,
  textLight: NotionColors.lightGray,
  textMedium: NotionColors.gray,
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

  // 轉換欄位定義為 Glide Grid 格式
  const gridColumns: GridColumn[] = useMemo(() => {
    return columns.map(col => ({
      id: col.key,
      title: col.title,
      width: col.width || 180,
      icon: undefined,
      hasMenu: false,
      grow: 1, // 允許欄位伸展
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
        // 將選項值轉換為顯示文字
        const displayValue = value === 'meeting' ? '會議' : value === 'call' ? '通話' : value;
        return {
          kind: GridCellKind.Text,
          data: displayValue || '',
          displayData: displayValue || '',
          allowOverlay: true,
          readonly: !onUpdateCell,
        };
      
      case 'tags':
      case 'multiselect':
        return {
          kind: GridCellKind.Text,
          data: Array.isArray(value) ? value.join(', ') : value || '',
          displayData: Array.isArray(value) ? value.join(', ') : value || '',
          allowOverlay: true,
          readonly: !onUpdateCell,
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
  const onCellClicked = useCallback((cell: Item, event: any) => {
    const [col, row] = cell;
    const rowData = data[row];
    if (rowData && onRowPress && !multiSelectMode) {
      onRowPress(rowData);
    }
  }, [data, onRowPress, multiSelectMode]);

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
  const drawCell = useCallback((args: any, drawContent: () => void) => {
    const { ctx, cell, rect, theme, col, row } = args;
    const column = columns[col];
    const rowData = data[row];
    
    if (!column || !rowData) {
      drawContent();
      return;
    }
    
    const value = rowData[column.key] || '';
    
    // 根據欄位類型自訂渲染
    if (column.type === 'select' && value) {
      // 清除預設背景
      ctx.fillStyle = NotionColors.bgDefault;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      
      // 渲染選擇標籤
      const text = value === 'meeting' ? '會議' : value === 'call' ? '通話' : value;
      const bgColor = value === 'meeting' ? NotionColors.blueBg : NotionColors.greenBg;
      const textColor = value === 'meeting' ? NotionColors.blue : NotionColors.green;
      
      const padding = 4;
      const fontSize = parseInt(NotionFonts.sizeSmall);
      ctx.font = `${NotionFonts.weightNormal} ${fontSize}px ${NotionFonts.family}`;
      const metrics = ctx.measureText(text);
      const tagWidth = metrics.width + padding * 2;
      const tagHeight = fontSize + padding;
      
      const x = rect.x + 8;
      const y = rect.y + (rect.height - tagHeight) / 2;
      
      // 繪製標籤背景
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(x, y, tagWidth, tagHeight, 3);
      ctx.fill();
      
      // 繪製文字
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + padding, y + tagHeight / 2);
    } else {
      // 使用預設渲染
      drawContent();
    }
  }, [columns, data]);

  return (
    <div className="glide-notion-table-wrapper">
      <div className="glide-notion-table-header">
        <div className="notion-table-title">
          <Icon name="table" size={20} />
          <span>表格</span>
        </div>
        <div className="notion-table-actions">
          <button className="notion-property-button">
            <Icon name="add" size={14} />
            <span>新增屬性</span>
          </button>
        </div>
      </div>
      <div className="glide-notion-table-container">
        <DataEditor
          ref={gridRef}
          theme={notionTheme}
          columns={gridColumns}
          rows={data.length}
          getCellContent={getCellContent}
          onCellEdited={onCellEdited}
          onCellClicked={onCellClicked}
          onColumnResize={(column, newSize) => {
            console.log(`Column ${column.id} resized to ${newSize}`);
          }}
          rowMarkers={multiSelectMode ? 'checkbox' : 'none'}
          rowSelectionMode={multiSelectMode ? 'multi' : 'none'}
          selection={selection}
          onSelectionChanged={onSelectionChanged}
          smoothScrollX={true}
          smoothScrollY={true}
          rowHeight={parseInt(NotionSpacing.rowHeight)}
          headerHeight={parseInt(NotionSpacing.headerHeight)}
          freezeColumns={0}
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
            tint: NotionColors.lightGray,
            targetColumn: 0,
          }}
        />
      </div>
      
      <style>{`
        .glide-notion-table-wrapper {
          width: 100%;
          background: ${NotionColors.bgDefault};
        }
        
        .glide-notion-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${NotionSpacing.sm} 0;
          margin-bottom: ${NotionSpacing.xs};
        }
        
        .notion-table-title {
          display: flex;
          align-items: center;
          gap: ${NotionSpacing.sm};
          color: ${NotionColors.default};
          font-size: ${NotionFonts.sizeBody};
          font-weight: ${NotionFonts.weightMedium};
        }
        
        .glide-notion-table-container {
          width: 100%;
          background: ${NotionColors.bgDefault};
          border: 1px solid ${NotionColors.border};
          border-radius: ${NotionStyles.borderRadius};
          overflow: hidden;
        }
        
        .notion-table-actions {
          display: flex;
          align-items: center;
        }
        
        .notion-property-button {
          display: inline-flex;
          align-items: center;
          gap: ${NotionSpacing.xs};
          padding: ${NotionSpacing.xs} ${NotionSpacing.sm};
          border: none;
          background: transparent;
          color: ${NotionColors.gray};
          font-size: ${NotionFonts.sizeSmall};
          font-weight: ${NotionFonts.weightNormal};
          cursor: pointer;
          border-radius: ${NotionStyles.borderRadius};
          transition: ${NotionStyles.transition};
        }
        
        .notion-property-button:hover {
          background: ${NotionColors.bgGray};
          color: ${NotionColors.default};
        }
        
        /* 覆蓋 Glide Grid 預設樣式 */
        .dvn-underlay {
          background: ${NotionColors.bgDefault} !important;
        }
        
        .dvn-scroll-inner {
          background: ${NotionColors.bgDefault} !important;
          min-width: 100%;
        }
        
        .dvn-cell {
          font-size: ${NotionFonts.sizeBody} !important;
          color: ${NotionColors.default} !important;
          border-right: 1px solid ${NotionColors.border} !important;
          border-bottom: 1px solid ${NotionColors.border} !important;
          background: ${NotionColors.bgDefault} !important;
        }
        
        .dvn-header {
          font-weight: ${NotionFonts.weightMedium} !important;
          font-size: ${NotionFonts.sizeBody} !important;
          color: ${NotionColors.gray} !important;
          background: ${NotionColors.bgDefault} !important;
          border-bottom: 1px solid ${NotionColors.border} !important;
          border-right: 1px solid ${NotionColors.border} !important;
        }
        
        /* 移除容器邊框 */
        .dvn-container {
          border: none !important;
        }
        
        /* 懸停效果 */
        .dvn-cell-hovered {
          background: ${NotionColors.bgGray} !important;
        }
        
        /* 確保表格有最小寬度 */
        .glide-data-editor {
          min-width: 100%;
        }
        
        /* 移除列標記（Notion 不顯示行號） */
        .dvn-marker {
          display: none !important;
        }
        
        /* 調整選擇框樣式 */
        .dvn-checkbox-marker {
          background: ${NotionColors.bgDefault} !important;
          border-right: 1px solid ${NotionColors.border} !important;
          padding: 0 ${NotionSpacing.sm} !important;
        }
        
        /* 編輯器樣式 */
        .gdg-growing-entry {
          border: 2px solid ${NotionColors.blue} !important;
          border-radius: ${NotionStyles.borderRadius} !important;
          font-size: ${NotionFonts.sizeBody} !important;
          padding: ${NotionSpacing.xs} ${NotionSpacing.sm} !important;
          font-family: ${NotionFonts.family} !important;
        }
        
        /* 選擇框樣式 */
        .dvn-checkbox {
          accent-color: ${NotionColors.blue};
        }
        
        /* 新增列提示樣式 */
        .dvn-trailing-row {
          color: ${NotionColors.lightGray} !important;
          font-style: normal !important;
          background: ${NotionColors.bgDefault} !important;
        }
        
        .dvn-trailing-row:hover {
          background: ${NotionColors.bgGray} !important;
        }
        
        /* 確保沒有奇怪的背景色塊 */
        .gdg-cell-background,
        .gdg-cell-layer,
        .dvn-cell-layer {
          display: none !important;
        }
        
        /* 確保資料編輯器佔滿容器 */
        .dvn-data-editor {
          width: 100% !important;
          height: auto !important;
          min-height: 400px !important;
        }
        
        /* 移除所有奇怪的背景 */
        .dvn-cell canvas {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};