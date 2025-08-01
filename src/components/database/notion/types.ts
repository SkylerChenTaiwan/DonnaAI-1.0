/**
 * Notion 資料庫元件共用類型定義
 */

export type CellState = 'default' | 'hover' | 'selected' | 'editing';

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellStateContext {
  state: CellState;
  data: any;
  column: ColumnConfig;
  rowId: string;
}

export interface ColumnConfig {
  id: string;
  key: string;
  title: string;
  type: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  editable?: boolean;
  options?: SelectOption[]; // for select/multiselect types
  format?: string; // for date/number types
}

export type ColumnType = 
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'tags'
  | 'relation';

export interface SelectOption {
  id: string;
  value: string;
  label: string;
  color?: string;
}

export interface TableData {
  id: string;
  [key: string]: any;
}

export interface NotionTableProps {
  data: TableData[];
  columns: ColumnConfig[];
  onCellUpdate?: (rowId: string, columnKey: string, value: any) => void | Promise<void>;
  onRowClick?: (row: TableData) => void;
  onRowAdd?: (data: Partial<TableData>) => void | Promise<void>;
  onColumnAdd?: () => void;
  onColumnReorder?: (columns: ColumnConfig[]) => void;
  multiSelect?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
}

export interface EditorProps<T = any> {
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  column: ColumnConfig;
  autoFocus?: boolean;
}

export interface NavigationContext {
  currentCell: CellPosition;
  selection: CellSelection;
  editingCell: CellPosition | null;
}

export interface CellSelection {
  start: CellPosition;
  end: CellPosition;
  cells: Set<string>; // "row-col" format
}

export interface VirtualScrollerProps {
  items: any[];
  rowHeight: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  renderRow: (item: any, index: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface KeyBinding {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  handler: (context: NavigationContext) => void;
}

export interface DragDropContext {
  dragType: 'column' | 'row' | null;
  dragIndex: number | null;
  dropIndex: number | null;
  isDragging: boolean;
}