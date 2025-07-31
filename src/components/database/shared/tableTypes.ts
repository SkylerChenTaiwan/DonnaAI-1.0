/**
 * 共用表格型別定義
 * 支援 TanStack Table 和現有 NotionStyleTableV2
 */

import { TableColumn } from '@/types/table';

// TanStack Table 專用型別
export interface TanStackTableColumn<T = any> {
  id: string;
  accessorKey?: string;
  header: string | ((context: any) => React.ReactNode);
  cell?: (context: any) => React.ReactNode;
  size?: number;
  sortable?: boolean;
  filterable?: boolean;
  enableSorting?: boolean;
  enableResizing?: boolean;
}

export interface TanStackTableProps<T = any> {
  data: T[];
  columns: TanStackTableColumn<T>[];
  onAddRow?: (rowData?: Record<string, any>) => void | Promise<void>;
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>;
  onColumnsReorder?: (columns: TanStackTableColumn<T>[]) => void;
  onRowPress?: (item: T) => void;
  multiSelectMode?: boolean;
  selectedItems?: string[];
  onSelect?: (selectedIds: string[]) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  sortConfig?: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
  enableColumnDrag?: boolean;
}

// 儲存格編輯器型別
export interface NotionCellProps {
  value: any;
  onChange?: (value: any) => void | Promise<void>;
  type?: 'text' | 'number' | 'email' | 'phone' | 'multiline' | 'select';
  placeholder?: string;
  disabled?: boolean;
  options?: string[]; // 用於 select 類型
}

// 核取方塊型別
export interface NotionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
}

// 表格狀態型別
export interface TableState {
  selectedRows: Record<string, boolean>;
  sortBy: Array<{
    id: string;
    desc: boolean;
  }>;
  filters: Array<{
    id: string;
    value: any;
  }>;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
}

// 拖放事件型別
export interface DragEndEvent {
  active: {
    id: string;
  };
  over: {
    id: string;
  } | null;
}

// 表格 Hook 回傳型別
export interface UseNotionTableReturn<T = any> {
  table: any; // TanStack Table instance
  selectedRows: Record<string, boolean>;
  setSelectedRows: (updater: any) => void;
  sorting: Array<{ id: string; desc: boolean }>;
  setSorting: (sorting: any) => void;
}

// 欄位生成器參數型別
export interface ColumnGeneratorProps {
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>;
  onColumnsReorder?: (columns: TanStackTableColumn[]) => void;
  activeTab: 'customers' | 'records' | 'tasks';
}

// 現有表格資料型別整合
export interface TableData extends Record<string, any> {
  id: string;
}

// 統一的表格 Props 型別（向後相容）
export interface UnifiedTableProps extends TanStackTableProps {
  // 額外的通用屬性
  className?: string;
  style?: React.CSSProperties;
}