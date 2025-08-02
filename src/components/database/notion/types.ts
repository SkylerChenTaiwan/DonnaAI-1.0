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

// === 過濾相關類型定義 ===

export type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'date_is' | 'date_before' | 'date_after'
  | 'checkbox_checked' | 'checkbox_unchecked'
  | 'select_is' | 'select_is_not'
  | 'multi_select_contains' | 'multi_select_not_contains';

export interface Filter {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: any;
  isActive: boolean;
}

export interface FilterGroup {
  id: string;
  operator: 'and' | 'or';
  filters: (Filter | FilterGroup)[];
}

// === 排序相關類型定義 ===

export interface Sort {
  columnKey: string;
  direction: 'asc' | 'desc';
  priority: number; // 支援多層排序，數字越小優先級越高
}

// === 分組相關類型定義 ===

export interface Group {
  columnKey: string;
  collapsed: Set<string>; // 收合的組別 ID
}

export interface GroupedData {
  groupKey: string;
  groupValue: any;
  groupLabel: string;
  items: TableData[];
  aggregations?: GroupAggregations;
  isCollapsed: boolean;
}

export interface GroupAggregations {
  count: number;
  sum?: number;
  avg?: number;
  min?: any;
  max?: any;
}

// === 搜尋相關類型定義 ===

export interface SearchConfig {
  query: string;
  columns: string[]; // 要搜尋的欄位，空陣列表示搜尋所有欄位
  caseSensitive: boolean;
  highlightMatches: boolean;
}

export interface SearchResult {
  rowId: string;
  columnKey: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

// === UI 面板相關類型定義 ===

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  currentFilters: FilterGroup;
  onFiltersChange: (filters: FilterGroup) => void;
  anchorEl?: HTMLElement | null;
}

export interface SortPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  currentSorts: Sort[];
  onSortsChange: (sorts: Sort[]) => void;
  anchorEl?: HTMLElement | null;
}

export interface GroupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  currentGroup: Group | null;
  onGroupChange: (group: Group | null) => void;
  anchorEl?: HTMLElement | null;
}

export interface SearchBarProps {
  searchConfig: SearchConfig;
  onSearchChange: (config: SearchConfig) => void;
  columns: ColumnConfig[];
  placeholder?: string;
}

// === 管理器相關類型定義 ===

export interface FilterManagerOptions {
  enableNestedGroups?: boolean;
  maxNestingLevel?: number;
  debugMode?: boolean;
}

export interface SortManagerOptions {
  preserveGrouping?: boolean;
  nullsFirst?: boolean;
  stableSort?: boolean;
}

export interface GroupManagerOptions {
  enableAggregations?: boolean;
  defaultCollapsed?: boolean;
  aggregationTypes?: ('count' | 'sum' | 'avg' | 'min' | 'max')[];
}

// === 資料轉換相關類型定義 ===

export interface DataTransformContext {
  originalData: TableData[];
  filteredData: TableData[];
  sortedData: TableData[];
  groupedData: GroupedData[] | null;
  searchResults: SearchResult[];
  isFiltered: boolean;
  isSorted: boolean;
  isGrouped: boolean;
  isSearching: boolean;
}