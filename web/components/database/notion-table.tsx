/**
 * PRP-125: Notion 風格資料庫管理系統 - 主表格元件
 * 
 * @description 核心表格元件，提供 Notion 風格的資料編輯體驗
 * @version 1.0.0
 * @date 2025-08-19
 * 
 * 主要功能：
 * - TanStack Table v8 核心整合
 * - 內聯編輯支援
 * - 虛擬滾動準備
 * - 拖拽排序準備
 * - 多欄位類型支援
 */

'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  Row as TanStackRow,
  Header,
  Cell
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// 從 Phase 1 型別定義匯入
import type {
  Table as TableType,
  Row,
  Field,
  CellValue,
  NotionTableProps,
  TableConfig,
  EditingState,
  CellReference,
  SelectionState,
  FilterState,
  SortState,
  TableError,
  DataChange
} from '@/docs/types/database-table-types';

/**
 * 預設表格配置
 */
const DEFAULT_CONFIG: TableConfig = {
  virtualScrolling: true,
  batchSize: 50,
  autoSave: true,
  autoSaveDelay: 1000,
  realtimeSync: true,
  maxRows: 50000,
  enableDragDrop: true,
  enableResize: true,
  enableKeyboardNavigation: true,
  enableContextMenu: true,
  enableUndoRedo: true,
  maxUndoSteps: 100,
  performanceMode: 'normal'
};

/**
 * 編輯中儲存格的視覺指示器
 */
const EditingIndicator: React.FC<{ userId: string; userColor: string }> = ({ 
  userId, 
  userColor 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
    style={{ backgroundColor: userColor }}
    title={`${userId} 正在編輯`}
  />
);

/**
 * 儲存格編輯元件
 */
interface EditableCellProps {
  cell: Cell<Row, unknown>;
  field: Field;
  value: CellValue;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (value: CellValue) => void;
  onCancelEdit: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  cell,
  field,
  value,
  isEditing,
  onStartEdit,
  onEndEdit,
  onCancelEdit
}) => {
  const [localValue, setLocalValue] = useState<CellValue>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onEndEdit(localValue);
        break;
      case 'Escape':
        e.preventDefault();
        onCancelEdit();
        break;
      case 'Tab':
        e.preventDefault();
        onEndEdit(localValue);
        // TODO: 移動到下一個儲存格
        break;
    }
  }, [localValue, onEndEdit, onCancelEdit]);

  const handleBlur = useCallback(() => {
    onEndEdit(localValue);
  }, [localValue, onEndEdit]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit();
  }, [onStartEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-full h-full"
      >
        <input
          ref={inputRef}
          type={field.type === 'number' ? 'number' : 'text'}
          value={localValue as string || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full h-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none bg-white shadow-sm"
        />
      </motion.div>
    );
  }

  return (
    <div
      className="w-full h-full px-2 py-1 cursor-pointer hover:bg-gray-50 flex items-center"
      onDoubleClick={handleDoubleClick}
    >
      <span className="text-sm text-gray-900 truncate">
        {value?.toString() || ''}
      </span>
    </div>
  );
};

/**
 * 表格標頭元件
 */
interface TableHeaderProps {
  header: Header<Row, unknown>;
  field: Field;
  onSort?: () => void;
  onFilter?: () => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ 
  header, 
  field, 
  onSort, 
  onFilter 
}) => {
  return (
    <div className="flex items-center justify-between w-full h-full px-3 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 truncate">
          {field.name}
        </span>
        {field.required && (
          <span className="text-red-500 text-xs">*</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onSort && (
          <button
            onClick={onSort}
            className="p-1 hover:bg-gray-200 rounded"
            title="排序"
          >
            ↕️
          </button>
        )}
        {onFilter && (
          <button
            onClick={onFilter}
            className="p-1 hover:bg-gray-200 rounded"
            title="篩選"
          >
            🔍
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 主要 NotionTable 元件
 */
export const NotionTable: React.FC<NotionTableProps> = ({
  table: tableData,
  config = {},
  onDataChange,
  onSchemaChange,
  onSelectionChange,
  onError,
  customRenderers,
  localization,
  theme,
  className,
  style
}) => {
  // 合併配置
  const finalConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  // 狀態管理
  const [editingState, setEditingState] = useState<EditingState>({
    editingCell: null,
    mode: 'none',
    originalValue: null,
    currentValue: null,
    hasChanges: false,
    validationState: { isValidating: false },
    history: []
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    mode: 'single',
    selectedCells: new Set(),
    selectedRows: new Set(),
    selectedColumns: new Set()
  });

  // TanStack Table 欄位定義
  const columns = useMemo<ColumnDef<Row>[]>(() => {
    return tableData.schema.fields.map((field) => ({
      id: field.id,
      accessorKey: `data.${field.id}`,
      header: ({ header }) => (
        <TableHeader
          header={header}
          field={field}
          onSort={() => {
            // TODO: 實作排序邏輯
            console.log('Sort field:', field.id);
          }}
          onFilter={() => {
            // TODO: 實作篩選邏輯
            console.log('Filter field:', field.id);
          }}
        />
      ),
      cell: ({ cell, row }) => {
        const cellRef: CellReference = {
          rowId: row.original.id,
          fieldId: field.id,
          rowIndex: row.index,
          columnIndex: cell.column.getIndex()
        };

        const isEditing = editingState.editingCell?.rowId === row.original.id &&
                         editingState.editingCell?.fieldId === field.id;

        return (
          <EditableCell
            cell={cell}
            field={field}
            value={row.original.data[field.id]}
            isEditing={isEditing}
            onStartEdit={() => {
              setEditingState({
                editingCell: cellRef,
                mode: 'cell',
                originalValue: row.original.data[field.id],
                currentValue: row.original.data[field.id],
                hasChanges: false,
                validationState: { isValidating: false },
                startedAt: new Date(),
                history: []
              });
            }}
            onEndEdit={(value) => {
              // 更新資料
              const updatedRow = {
                ...row.original,
                data: {
                  ...row.original.data,
                  [field.id]: value
                },
                updatedAt: new Date()
              };

              // 通知父元件資料變更
              if (onDataChange) {
                const change: DataChange = {
                  type: 'update',
                  target: 'cell',
                  targetId: `${row.original.id}-${field.id}`,
                  oldValue: editingState.originalValue,
                  newValue: value,
                  timestamp: new Date()
                };
                onDataChange([change]);
              }

              // 清除編輯狀態
              setEditingState({
                editingCell: null,
                mode: 'none',
                originalValue: null,
                currentValue: null,
                hasChanges: false,
                validationState: { isValidating: false },
                history: []
              });
            }}
            onCancelEdit={() => {
              setEditingState({
                editingCell: null,
                mode: 'none',
                originalValue: null,
                currentValue: null,
                hasChanges: false,
                validationState: { isValidating: false },
                history: []
              });
            }}
          />
        );
      },
      size: field.width || 150,
      minSize: 50,
      maxSize: 500
    }));
  }, [tableData.schema.fields, editingState, onDataChange]);

  // TanStack Table 實例
  const reactTable = useReactTable({
    data: tableData.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableColumnResizing: finalConfig.enableResize,
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageSize: finalConfig.batchSize
      }
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        // 處理資料更新的回調
        console.log('Update data:', { rowIndex, columnId, value });
      }
    }
  });

  // 鍵盤導航處理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!finalConfig.enableKeyboardNavigation) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        // TODO: 實作鍵盤導航邏輯
        break;
      case 'F2':
        e.preventDefault();
        // TODO: 啟動編輯模式
        break;
      case 'Escape':
        e.preventDefault();
        // 取消編輯或清除選擇
        if (editingState.mode !== 'none') {
          setEditingState({
            editingCell: null,
            mode: 'none',
            originalValue: null,
            currentValue: null,
            hasChanges: false,
            validationState: { isValidating: false },
            history: []
          });
        }
        break;
    }
  }, [finalConfig.enableKeyboardNavigation, editingState.mode]);

  return (
    <div 
      className={cn(
        "notion-table w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white",
        className
      )}
      style={style}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 表格容器 */}
      <div className="overflow-auto h-full">
        <table className="w-full">
          {/* 表格標頭 */}
          <thead className="sticky top-0 z-10">
            {reactTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left border-r border-gray-200 last:border-r-0"
                    style={{ 
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="relative">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        
                        {/* 欄位調整大小控制 */}
                        {finalConfig.enableResize && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                              header.column.getIsResizing() && "bg-blue-500"
                            )}
                          />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* 表格主體 */}
          <tbody>
            <AnimatePresence>
              {reactTable.getRowModel().rows.map(row => (
                <motion.tr
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    selectionState.selectedRows.has(row.original.id) && "bg-blue-50"
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="border-r border-gray-100 last:border-r-0 h-12 relative"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      
                      {/* 編輯指示器 */}
                      {editingState.editingCell?.rowId === row.original.id &&
                       editingState.editingCell?.fieldId === cell.column.id && (
                        <EditingIndicator 
                          userId="current-user" 
                          userColor="#3b82f6" 
                        />
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* 分頁控制 */}
      {tableData.rows.length > finalConfig.batchSize && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            顯示 {reactTable.getState().pagination.pageIndex * finalConfig.batchSize + 1} 到{' '}
            {Math.min(
              (reactTable.getState().pagination.pageIndex + 1) * finalConfig.batchSize,
              tableData.rows.length
            )}{' '}
            項，共 {tableData.rows.length} 項
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => reactTable.previousPage()}
              disabled={!reactTable.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            <span className="text-sm text-gray-600">
              第 {reactTable.getState().pagination.pageIndex + 1} 頁，共{' '}
              {reactTable.getPageCount()} 頁
            </span>
            <button
              onClick={() => reactTable.nextPage()}
              disabled={!reactTable.getCanNextPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotionTable;