/**
 * TanStack Table 的 Notion 風格封裝 Hook
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  RowSelectionState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { TanStackTableColumn, TableData, UseNotionTableReturn } from '../../shared/tableTypes';

interface UseNotionTableProps<T extends TableData> {
  data: T[];
  columns: TanStackTableColumn<T>[];
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

export const useNotionTable = <T extends TableData>({
  data,
  columns,
  enableRowSelection = true,
  enableMultiRowSelection = true,
  enableSorting = true,
  enableFiltering = true,
}: UseNotionTableProps<T>): UseNotionTableReturn<T> => {
  // 狀態管理
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // 轉換欄位定義為 TanStack Table 格式
  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => ({
      id: col.id,
      accessorKey: col.accessorKey,
      header: col.header,
      cell: col.cell,
      size: col.size,
      enableSorting: col.enableSorting !== false && enableSorting,
      enableResizing: col.enableResizing !== false,
    }));
  }, [columns, enableSorting]);

  // 建立 TanStack Table 實例
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      rowSelection: selectedRows,
      sorting,
      columnFilters,
    },
    onRowSelectionChange: setSelectedRows,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    enableRowSelection,
    enableMultiRowSelection,
    getRowId: (row) => row.id,
  });

  return {
    table,
    selectedRows,
    setSelectedRows,
    sorting,
    setSorting,
  };
};