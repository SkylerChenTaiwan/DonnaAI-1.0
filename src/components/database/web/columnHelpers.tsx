/**
 * TanStack Table Column Helpers
 */

import React from 'react';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { TableColumn } from '@/types/table';

// 定義通用的資料類型
export interface TableRowData {
  id: string;
  [key: string]: any;
}

// 建立 column helper
const columnHelper = createColumnHelper<TableRowData>();

/**
 * 將 TableColumn 格式轉換為 TanStack Table ColumnDef 格式
 */
export function convertToTanStackColumns(
  columns: TableColumn[]
): ColumnDef<TableRowData, any>[] {
  return columns.map(col => {
    // 使用 columnHelper 建立正確的 column definition
    if (col.render) {
      return columnHelper.accessor(col.key, {
        id: col.key,
        header: col.title,
        cell: info => col.render!(info.getValue()),
        enableSorting: col.sortable || false });
    }

    return columnHelper.accessor(col.key, {
      id: col.key,
      header: col.title,
      cell: info => info.getValue() || '-',
      enableSorting: col.sortable || false });
  });
}

/**
 * 建立選擇欄位
 */
export function createSelectColumn(): ColumnDef<TableRowData, any> {
  return columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ) });
}

/**
 * 建立操作欄位
 */
export function createActionsColumn(
  onEdit?: (row: TableRowData) => void,
  onDelete?: (row: TableRowData) => void
): ColumnDef<TableRowData, any> {
  return columnHelper.display({
    id: 'actions',
    header: '操作',
    cell: ({ row }) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {onEdit && (
          <button
            onClick={() => onEdit(row.original)}
            
          >
            編輯
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(row.original)}
            
          >
            刪除
          </button>
        )}
      </div>
    ) });
}