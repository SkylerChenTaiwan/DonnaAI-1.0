/**
 * PRP-125: Notion-style Database Management System - 完整型別定義系統
 * 
 * @description 此檔案包含 Notion 風格資料庫管理系統的所有 TypeScript 型別定義
 * @version 1.0.0
 * @date 2025-08-18
 * @author typescript-type-guardian
 * 
 * 型別系統設計原則：
 * - 嚴格型別安全：避免 any，確保編譯時型別檢查
 * - 組合優於繼承：使用介面組合和 Union 型別
 * - 欄位類型泛型：支援自訂欄位類型擴展
 * - 效能優化：型別設計考慮虛擬滾動效能
 * - 整合相容：與 AI 查詢系統型別整合
 */

// ============================================================================
// 匯入依賴型別
// ============================================================================

import type {
  User,
  UserRole,
  UserPermissions,
} from '../../web/types/user.types';

import type {
  AIQuery,
  QueryResult,
  DataRow,
  ColumnDefinition as AIColumnDefinition,
  FilterOperator,
  QueryFilter as AIQueryFilter,
  TimeRange,
  AggregationType,
  ChartType,
  ChartConfig as AIChartConfig,
} from './ai-query-data-models';

// ============================================================================
// 1. 核心資料庫型別 (Core Database Types)
// ============================================================================

/**
 * 資料庫 - 最上層的資料庫結構
 */
export interface Database {
  /** 資料庫 ID */
  id: string;
  /** 資料庫名稱 */
  name: string;
  /** 資料庫描述 */
  description?: string;
  /** 組織 ID */
  organizationId: string;
  /** 擁有者 ID */
  ownerId: string;
  /** 資料表列表 */
  tables: Table[];
  /** 資料庫設定 */
  settings: DatabaseSettings;
  /** 資料庫權限 */
  permissions: DatabasePermissions;
  /** 資料庫中繼資料 */
  metadata: DatabaseMetadata;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
  /** 版本號 */
  version: number;
}

/**
 * 資料庫設定
 */
export interface DatabaseSettings {
  /** 預設檢視 */
  defaultView: ViewType;
  /** 主題設定 */
  theme: DatabaseTheme;
  /** 時區 */
  timezone: string;
  /** 語言 */
  locale: string;
  /** 日期格式 */
  dateFormat: string;
  /** 數字格式 */
  numberFormat: string;
  /** 貨幣 */
  currency: string;
  /** 自動儲存 */
  autoSave: boolean;
  /** 即時同步 */
  realtimeSync: boolean;
  /** 版本控制 */
  versionControl: boolean;
  /** 最大資料列數 */
  maxRows?: number;
  /** 最大表格數 */
  maxTables?: number;
}

/**
 * 資料庫主題
 */
export interface DatabaseTheme {
  /** 主色調 */
  primaryColor: string;
  /** 強調色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
  /** 文字色 */
  textColor: string;
  /** 邊框色 */
  borderColor: string;
  /** 暗色模式 */
  darkMode?: boolean;
}

/**
 * 資料庫中繼資料
 */
export interface DatabaseMetadata {
  /** 總資料列數 */
  totalRows: number;
  /** 總資料大小（位元組） */
  totalSize: number;
  /** 最後存取時間 */
  lastAccessedAt?: Date;
  /** 最後修改者 */
  lastModifiedBy?: string;
  /** 標籤 */
  tags?: string[];
  /** 自訂屬性 */
  customProperties?: Record<string, unknown>;
}

/**
 * 資料表 - 表格結構和欄位定義
 */
export interface Table {
  /** 表格 ID */
  id: string;
  /** 資料庫 ID */
  databaseId: string;
  /** 表格名稱 */
  name: string;
  /** 表格描述 */
  description?: string;
  /** 表格圖示 */
  icon?: string;
  /** 欄位結構 */
  schema: TableSchema;
  /** 資料列 */
  rows: Row[];
  /** 檢視配置 */
  views: TableView[];
  /** 表格設定 */
  settings: TableSettings;
  /** 表格權限 */
  permissions: TablePermissions;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
  /** 版本號 */
  version: number;
}

/**
 * 表格結構定義
 */
export interface TableSchema {
  /** 欄位列表 */
  fields: Field[];
  /** 主鍵欄位 */
  primaryKey: string;
  /** 索引 */
  indexes?: TableIndex[];
  /** 關聯 */
  relations?: TableRelation[];
  /** 限制條件 */
  constraints?: TableConstraint[];
  /** 觸發器 */
  triggers?: TableTrigger[];
}

/**
 * 表格索引
 */
export interface TableIndex {
  /** 索引名稱 */
  name: string;
  /** 索引欄位 */
  fields: string[];
  /** 是否唯一 */
  unique?: boolean;
  /** 索引類型 */
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

/**
 * 表格關聯
 */
export interface TableRelation {
  /** 關聯名稱 */
  name: string;
  /** 關聯類型 */
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  /** 來源欄位 */
  sourceField: string;
  /** 目標表格 */
  targetTable: string;
  /** 目標欄位 */
  targetField: string;
  /** 刪除規則 */
  onDelete?: 'cascade' | 'restrict' | 'set-null';
  /** 更新規則 */
  onUpdate?: 'cascade' | 'restrict';
}

/**
 * 表格限制條件
 */
export interface TableConstraint {
  /** 限制名稱 */
  name: string;
  /** 限制類型 */
  type: 'unique' | 'check' | 'not-null';
  /** 欄位 */
  fields: string[];
  /** 條件表達式 */
  expression?: string;
}

/**
 * 表格觸發器
 */
export interface TableTrigger {
  /** 觸發器名稱 */
  name: string;
  /** 觸發事件 */
  event: 'insert' | 'update' | 'delete';
  /** 觸發時機 */
  timing: 'before' | 'after';
  /** 執行函數 */
  action: string;
  /** 條件 */
  condition?: string;
}

/**
 * 表格設定
 */
export interface TableSettings {
  /** 預設排序 */
  defaultSort?: SortConfig[];
  /** 預設篩選 */
  defaultFilters?: FilterConfig[];
  /** 可見欄位 */
  visibleFields?: string[];
  /** 欄位順序 */
  fieldOrder?: string[];
  /** 列高度 */
  rowHeight: RowHeight;
  /** 是否顯示列號 */
  showRowNumbers?: boolean;
  /** 是否啟用拖拽 */
  enableDragDrop?: boolean;
  /** 是否啟用批量操作 */
  enableBulkOperations?: boolean;
  /** 是否啟用內聯編輯 */
  enableInlineEditing?: boolean;
  /** 虛擬滾動配置 */
  virtualScrolling?: VirtualScrollConfig;
}

/**
 * 列高度選項
 */
export type RowHeight = 'compact' | 'default' | 'tall' | 'extra-tall';

/**
 * 表格檢視
 */
export interface TableView {
  /** 檢視 ID */
  id: string;
  /** 檢視名稱 */
  name: string;
  /** 檢視類型 */
  type: ViewType;
  /** 檢視配置 */
  config: ViewConfig;
  /** 是否為預設檢視 */
  isDefault?: boolean;
  /** 是否為個人檢視 */
  isPersonal?: boolean;
  /** 擁有者 ID */
  ownerId?: string;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
}

/**
 * 檢視類型
 */
export type ViewType = 
  | 'table'      // 表格檢視
  | 'board'      // 看板檢視
  | 'calendar'   // 行事曆檢視
  | 'gallery'    // 畫廊檢視
  | 'list'       // 列表檢視
  | 'timeline'   // 時間軸檢視
  | 'chart'      // 圖表檢視
  | 'form';      // 表單檢視

/**
 * 檢視配置
 */
export interface ViewConfig {
  /** 篩選條件 */
  filters?: FilterConfig[];
  /** 排序配置 */
  sorts?: SortConfig[];
  /** 分組配置 */
  groupBy?: GroupConfig;
  /** 顯示欄位 */
  visibleFields?: string[];
  /** 欄位寬度 */
  fieldWidths?: Record<string, number>;
  /** 特定檢視設定 */
  viewSpecific?: Record<string, unknown>;
}

/**
 * 分組配置
 */
export interface GroupConfig {
  /** 分組欄位 */
  field: string;
  /** 排序方向 */
  direction?: 'asc' | 'desc';
  /** 是否摺疊 */
  collapsed?: string[];
}

/**
 * 資料列 - 資料列結構和內容
 */
export interface Row {
  /** 列 ID */
  id: string;
  /** 表格 ID */
  tableId: string;
  /** 資料內容 */
  data: Record<string, CellValue>;
  /** 列中繼資料 */
  metadata: RowMetadata;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
  /** 建立者 */
  createdBy: string;
  /** 更新者 */
  updatedBy: string;
  /** 版本號 */
  version: number;
  /** 是否已刪除（軟刪除） */
  deleted?: boolean;
  /** 刪除時間 */
  deletedAt?: Date;
}

/**
 * 列中繼資料
 */
export interface RowMetadata {
  /** 列索引 */
  index?: number;
  /** 列狀態 */
  status?: RowStatus;
  /** 標籤 */
  tags?: string[];
  /** 評論數 */
  commentCount?: number;
  /** 附件數 */
  attachmentCount?: number;
  /** 是否已鎖定 */
  locked?: boolean;
  /** 鎖定者 */
  lockedBy?: string;
  /** 鎖定時間 */
  lockedAt?: Date;
  /** 自訂屬性 */
  customProperties?: Record<string, unknown>;
}

/**
 * 列狀態
 */
export type RowStatus = 
  | 'draft'      // 草稿
  | 'active'     // 活躍
  | 'archived'   // 已歸檔
  | 'locked';    // 已鎖定

/**
 * 儲存格 - 儲存格資料和狀態
 */
export interface Cell {
  /** 列 ID */
  rowId: string;
  /** 欄位 ID */
  fieldId: string;
  /** 儲存格值 */
  value: CellValue;
  /** 儲存格狀態 */
  state: CellState;
  /** 驗證結果 */
  validation?: ValidationResult;
  /** 編輯歷史 */
  history?: CellHistory[];
  /** 評論 */
  comments?: CellComment[];
  /** 附件 */
  attachments?: CellAttachment[];
}

/**
 * 儲存格值類型
 */
export type CellValue = 
  | string
  | number
  | boolean
  | Date
  | string[]           // 多選
  | RichTextValue      // 富文本
  | FileValue[]        // 檔案
  | RelationValue[]    // 關聯
  | FormulaValue       // 公式
  | RollupValue        // 匯總
  | null
  | undefined;

/**
 * 富文本值
 */
export interface RichTextValue {
  /** 純文字 */
  text: string;
  /** HTML 內容 */
  html?: string;
  /** Markdown 內容 */
  markdown?: string;
  /** 提及 */
  mentions?: Mention[];
}

/**
 * 提及
 */
export interface Mention {
  /** 類型 */
  type: 'user' | 'page' | 'date';
  /** ID */
  id: string;
  /** 顯示文字 */
  text: string;
}

/**
 * 檔案值
 */
export interface FileValue {
  /** 檔案 ID */
  id: string;
  /** 檔案名稱 */
  name: string;
  /** 檔案大小 */
  size: number;
  /** MIME 類型 */
  mimeType: string;
  /** 檔案 URL */
  url: string;
  /** 縮圖 URL */
  thumbnailUrl?: string;
  /** 上傳時間 */
  uploadedAt: Date;
  /** 上傳者 */
  uploadedBy: string;
}

/**
 * 關聯值
 */
export interface RelationValue {
  /** 關聯列 ID */
  rowId: string;
  /** 關聯表格 ID */
  tableId: string;
  /** 顯示值 */
  displayValue: string;
}

/**
 * 公式值
 */
export interface FormulaValue {
  /** 公式表達式 */
  formula: string;
  /** 計算結果 */
  result: unknown;
  /** 錯誤訊息 */
  error?: string;
}

/**
 * 匯總值
 */
export interface RollupValue {
  /** 關聯欄位 */
  relationField: string;
  /** 目標欄位 */
  targetField: string;
  /** 聚合函數 */
  aggregation: AggregationType;
  /** 結果 */
  result: unknown;
}

/**
 * 儲存格狀態
 */
export interface CellState {
  /** 是否正在編輯 */
  isEditing: boolean;
  /** 編輯者 */
  editingBy?: string;
  /** 是否已變更 */
  isDirty: boolean;
  /** 是否有錯誤 */
  hasError: boolean;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否已選中 */
  isSelected: boolean;
  /** 是否已高亮 */
  isHighlighted: boolean;
}

/**
 * 儲存格歷史
 */
export interface CellHistory {
  /** 變更 ID */
  id: string;
  /** 舊值 */
  oldValue: CellValue;
  /** 新值 */
  newValue: CellValue;
  /** 變更者 */
  changedBy: string;
  /** 變更時間 */
  changedAt: Date;
  /** 變更原因 */
  reason?: string;
}

/**
 * 儲存格評論
 */
export interface CellComment {
  /** 評論 ID */
  id: string;
  /** 評論內容 */
  content: string;
  /** 評論者 */
  authorId: string;
  /** 評論時間 */
  createdAt: Date;
  /** 是否已解決 */
  resolved?: boolean;
  /** 回覆 */
  replies?: CellComment[];
}

/**
 * 儲存格附件
 */
export interface CellAttachment {
  /** 附件 ID */
  id: string;
  /** 檔案資訊 */
  file: FileValue;
  /** 附加說明 */
  description?: string;
  /** 附加者 */
  attachedBy: string;
  /** 附加時間 */
  attachedAt: Date;
}

// ============================================================================
// 2. 欄位類型系統 (Field Type System)
// ============================================================================

/**
 * 欄位基礎介面
 */
export interface Field {
  /** 欄位 ID */
  id: string;
  /** 欄位名稱 */
  name: string;
  /** 欄位類型 */
  type: FieldType;
  /** 欄位描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否唯一 */
  unique?: boolean;
  /** 是否為主鍵 */
  isPrimary?: boolean;
  /** 預設值 */
  defaultValue?: unknown;
  /** 驗證規則 */
  validation?: ValidationRule[];
  /** 欄位設定 */
  settings?: FieldSettings;
  /** 欄位權限 */
  permissions?: FieldPermissions;
  /** 欄位順序 */
  order?: number;
  /** 欄位寬度 */
  width?: number;
  /** 是否隱藏 */
  hidden?: boolean;
  /** 是否凍結 */
  frozen?: boolean;
}

/**
 * 欄位類型
 */
export type FieldType = 
  | 'text'           // 文字
  | 'number'         // 數字
  | 'date'           // 日期
  | 'select'         // 單選
  | 'multiSelect'    // 多選
  | 'checkbox'       // 核取方塊
  | 'url'            // 網址
  | 'email'          // 電子郵件
  | 'phone'          // 電話
  | 'currency'       // 貨幣
  | 'percent'        // 百分比
  | 'rating'         // 評分
  | 'file'           // 檔案
  | 'relation'       // 關聯
  | 'formula'        // 公式
  | 'rollup'         // 匯總
  | 'createdTime'    // 建立時間
  | 'createdBy'      // 建立者
  | 'lastEditedTime' // 最後編輯時間
  | 'lastEditedBy'   // 最後編輯者
  | 'autoNumber'     // 自動編號
  | 'barcode'        // 條碼
  | 'button'         // 按鈕
  | 'collaborator'   // 協作者
  | 'count'          // 計數
  | 'lookup';        // 查找

/**
 * 欄位設定基礎介面
 */
export interface FieldSettings {
  /** 格式設定 */
  format?: FormatSettings;
  /** 顯示設定 */
  display?: DisplaySettings;
}

/**
 * 格式設定
 */
export interface FormatSettings {
  /** 日期格式 */
  dateFormat?: string;
  /** 時間格式 */
  timeFormat?: string;
  /** 數字格式 */
  numberFormat?: string;
  /** 貨幣符號 */
  currencySymbol?: string;
  /** 小數位數 */
  precision?: number;
  /** 千分位符號 */
  thousandsSeparator?: boolean;
}

/**
 * 顯示設定
 */
export interface DisplaySettings {
  /** 顯示為 */
  displayAs?: string;
  /** 顏色 */
  color?: string;
  /** 圖示 */
  icon?: string;
  /** 對齊方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否自動換行 */
  wrap?: boolean;
}

/**
 * 文字欄位
 */
export interface TextField extends Field {
  type: 'text';
  settings?: TextFieldSettings;
}

export interface TextFieldSettings extends FieldSettings {
  /** 最小長度 */
  minLength?: number;
  /** 最大長度 */
  maxLength?: number;
  /** 正則表達式 */
  pattern?: string;
  /** 是否多行 */
  multiline?: boolean;
  /** 是否富文本 */
  richText?: boolean;
}

/**
 * 數字欄位
 */
export interface NumberField extends Field {
  type: 'number';
  settings?: NumberFieldSettings;
}

export interface NumberFieldSettings extends FieldSettings {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步進值 */
  step?: number;
  /** 單位 */
  unit?: string;
}

/**
 * 日期欄位
 */
export interface DateField extends Field {
  type: 'date';
  settings?: DateFieldSettings;
}

export interface DateFieldSettings extends FieldSettings {
  /** 最小日期 */
  minDate?: Date | string;
  /** 最大日期 */
  maxDate?: Date | string;
  /** 是否包含時間 */
  includeTime?: boolean;
  /** 時區 */
  timezone?: string;
}

/**
 * 選擇欄位
 */
export interface SelectField extends Field {
  type: 'select';
  settings?: SelectFieldSettings;
}

export interface SelectFieldSettings extends FieldSettings {
  /** 選項列表 */
  options: SelectOption[];
  /** 是否允許自訂 */
  allowCustom?: boolean;
  /** 預設選項 */
  defaultOption?: string;
}

/**
 * 多選欄位
 */
export interface MultiSelectField extends Field {
  type: 'multiSelect';
  settings?: MultiSelectFieldSettings;
}

export interface MultiSelectFieldSettings extends FieldSettings {
  /** 選項列表 */
  options: SelectOption[];
  /** 是否允許自訂 */
  allowCustom?: boolean;
  /** 最大選擇數 */
  maxSelections?: number;
  /** 最小選擇數 */
  minSelections?: number;
}

/**
 * 選項定義
 */
export interface SelectOption {
  /** 選項 ID */
  id: string;
  /** 選項標籤 */
  label: string;
  /** 選項顏色 */
  color?: string;
  /** 選項圖示 */
  icon?: string;
  /** 是否停用 */
  disabled?: boolean;
  /** 排序順序 */
  order?: number;
}

/**
 * 核取方塊欄位
 */
export interface CheckboxField extends Field {
  type: 'checkbox';
  settings?: CheckboxFieldSettings;
}

export interface CheckboxFieldSettings extends FieldSettings {
  /** 勾選標籤 */
  checkedLabel?: string;
  /** 未勾選標籤 */
  uncheckedLabel?: string;
  /** 勾選圖示 */
  checkedIcon?: string;
  /** 未勾選圖示 */
  uncheckedIcon?: string;
}

/**
 * 關聯欄位
 */
export interface RelationField extends Field {
  type: 'relation';
  settings?: RelationFieldSettings;
}

export interface RelationFieldSettings extends FieldSettings {
  /** 關聯表格 */
  relatedTableId: string;
  /** 關聯類型 */
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  /** 顯示欄位 */
  displayField?: string;
  /** 是否允許建立 */
  allowCreate?: boolean;
  /** 是否允許連結 */
  allowLink?: boolean;
}

/**
 * 公式欄位
 */
export interface FormulaField extends Field {
  type: 'formula';
  settings?: FormulaFieldSettings;
}

export interface FormulaFieldSettings extends FieldSettings {
  /** 公式表達式 */
  formula: string;
  /** 結果類型 */
  resultType: FieldType;
  /** 引用欄位 */
  referencedFields?: string[];
  /** 是否即時計算 */
  realtime?: boolean;
}

/**
 * 匯總欄位
 */
export interface RollupField extends Field {
  type: 'rollup';
  settings?: RollupFieldSettings;
}

export interface RollupFieldSettings extends FieldSettings {
  /** 關聯欄位 */
  relationFieldId: string;
  /** 目標欄位 */
  targetFieldId: string;
  /** 聚合函數 */
  aggregation: AggregationType;
  /** 篩選條件 */
  filter?: FilterConfig;
}

// ============================================================================
// 3. 互動操作型別 (Interaction Types)
// ============================================================================

/**
 * 編輯狀態管理
 */
export interface EditingState {
  /** 正在編輯的儲存格 */
  editingCell: CellReference | null;
  /** 編輯模式 */
  mode: EditMode;
  /** 原始值 */
  originalValue: CellValue;
  /** 當前值 */
  currentValue: CellValue;
  /** 是否有變更 */
  hasChanges: boolean;
  /** 驗證狀態 */
  validationState: ValidationState;
  /** 編輯開始時間 */
  startedAt?: Date;
  /** 編輯歷史 */
  history: EditAction[];
}

/**
 * 儲存格參考
 */
export interface CellReference {
  /** 列 ID */
  rowId: string;
  /** 欄位 ID */
  fieldId: string;
  /** 列索引 */
  rowIndex?: number;
  /** 欄索引 */
  columnIndex?: number;
}

/**
 * 編輯模式
 */
export type EditMode = 
  | 'none'        // 無編輯
  | 'cell'        // 儲存格編輯
  | 'row'         // 整列編輯
  | 'column'      // 整欄編輯
  | 'bulk';       // 批量編輯

/**
 * 編輯動作
 */
export interface EditAction {
  /** 動作類型 */
  type: 'insert' | 'delete' | 'replace' | 'format';
  /** 位置 */
  position?: number;
  /** 值 */
  value?: unknown;
  /** 時間戳記 */
  timestamp: Date;
}

/**
 * 拖拽操作狀態
 */
export interface DragDropState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽類型 */
  dragType: DragType | null;
  /** 拖拽來源 */
  dragSource: DragSource | null;
  /** 拖拽目標 */
  dropTarget: DropTarget | null;
  /** 拖拽資料 */
  dragData: unknown;
  /** 預覽元素 */
  preview?: DragPreview;
  /** 有效放置區域 */
  validDropZones: string[];
}

/**
 * 拖拽類型
 */
export type DragType = 
  | 'row'          // 列拖拽
  | 'column'       // 欄拖拽
  | 'cell'         // 儲存格拖拽
  | 'file'         // 檔案拖拽
  | 'text';        // 文字拖拽

/**
 * 拖拽來源
 */
export interface DragSource {
  /** 元素 ID */
  id: string;
  /** 元素類型 */
  type: DragType;
  /** 索引 */
  index?: number;
  /** 資料 */
  data?: unknown;
}

/**
 * 放置目標
 */
export interface DropTarget {
  /** 元素 ID */
  id: string;
  /** 元素類型 */
  type: DragType;
  /** 索引 */
  index?: number;
  /** 位置 */
  position?: 'before' | 'after' | 'inside';
}

/**
 * 拖拽預覽
 */
export interface DragPreview {
  /** 預覽內容 */
  content: string | HTMLElement;
  /** 偏移 */
  offset?: { x: number; y: number };
  /** 樣式 */
  style?: Record<string, string>;
}

/**
 * 選擇狀態
 */
export interface SelectionState {
  /** 選擇模式 */
  mode: SelectionMode;
  /** 選中的儲存格 */
  selectedCells: Set<string>;
  /** 選中的列 */
  selectedRows: Set<string>;
  /** 選中的欄 */
  selectedColumns: Set<string>;
  /** 選擇範圍 */
  selectionRange?: SelectionRange;
  /** 上次選擇 */
  lastSelection?: CellReference;
  /** 選擇錨點 */
  anchorCell?: CellReference;
}

/**
 * 選擇模式
 */
export type SelectionMode = 
  | 'single'       // 單選
  | 'multiple'     // 多選
  | 'range'        // 範圍選擇
  | 'column'       // 欄選擇
  | 'row';         // 列選擇

/**
 * 選擇範圍
 */
export interface SelectionRange {
  /** 開始儲存格 */
  start: CellReference;
  /** 結束儲存格 */
  end: CellReference;
  /** 包含的儲存格 */
  cells?: CellReference[];
}

/**
 * 篩選狀態
 */
export interface FilterState {
  /** 篩選器列表 */
  filters: FilterConfig[];
  /** 快速篩選 */
  quickFilter?: string;
  /** 進階篩選 */
  advancedFilter?: AdvancedFilter;
  /** 篩選後的列 ID */
  filteredRowIds?: string[];
  /** 篩選統計 */
  filterStats?: FilterStats;
}

/**
 * 篩選配置
 */
export interface FilterConfig {
  /** 篩選器 ID */
  id: string;
  /** 欄位 ID */
  fieldId: string;
  /** 運算子 */
  operator: FilterOperator;
  /** 篩選值 */
  value: unknown;
  /** 是否啟用 */
  enabled?: boolean;
  /** 邏輯運算子 */
  logicalOperator?: 'AND' | 'OR';
}

/**
 * 進階篩選
 */
export interface AdvancedFilter {
  /** 篩選群組 */
  groups: FilterGroup[];
  /** 群組邏輯 */
  groupLogic: 'AND' | 'OR';
}

/**
 * 篩選群組
 */
export interface FilterGroup {
  /** 群組 ID */
  id: string;
  /** 篩選條件 */
  conditions: FilterConfig[];
  /** 條件邏輯 */
  conditionLogic: 'AND' | 'OR';
}

/**
 * 篩選統計
 */
export interface FilterStats {
  /** 總列數 */
  totalRows: number;
  /** 篩選後列數 */
  filteredRows: number;
  /** 隱藏列數 */
  hiddenRows: number;
  /** 篩選百分比 */
  filterPercentage: number;
}

/**
 * 排序狀態
 */
export interface SortState {
  /** 排序配置 */
  sorts: SortConfig[];
  /** 排序後的列 ID */
  sortedRowIds?: string[];
}

/**
 * 排序配置
 */
export interface SortConfig {
  /** 欄位 ID */
  fieldId: string;
  /** 排序方向 */
  direction: 'asc' | 'desc';
  /** 優先順序 */
  priority?: number;
  /** 空值處理 */
  nullsFirst?: boolean;
}

// ============================================================================
// 4. 表格元件型別 (Table Component Types)
// ============================================================================

/**
 * Notion 表格元件屬性
 */
export interface NotionTableProps {
  /** 表格資料 */
  table: Table;
  /** 配置 */
  config?: TableConfig;
  /** 資料變更回調 */
  onDataChange?: (changes: DataChange[]) => void;
  /** 結構變更回調 */
  onSchemaChange?: (schema: TableSchema) => void;
  /** 選擇變更回調 */
  onSelectionChange?: (selection: SelectionState) => void;
  /** 錯誤處理 */
  onError?: (error: TableError) => void;
  /** 自訂渲染器 */
  customRenderers?: CustomRenderers;
  /** 本地化配置 */
  localization?: LocalizationConfig;
  /** 主題 */
  theme?: TableTheme;
  /** 類名 */
  className?: string;
  /** 樣式 */
  style?: CSSProperties;
}

/**
 * 表格配置
 */
export interface TableConfig {
  /** 虛擬滾動 */
  virtualScrolling?: boolean;
  /** 批次大小 */
  batchSize?: number;
  /** 自動儲存 */
  autoSave?: boolean;
  /** 自動儲存延遲 */
  autoSaveDelay?: number;
  /** 即時同步 */
  realtimeSync?: boolean;
  /** 最大列數 */
  maxRows?: number;
  /** 啟用拖拽 */
  enableDragDrop?: boolean;
  /** 啟用調整大小 */
  enableResize?: boolean;
  /** 啟用鍵盤導航 */
  enableKeyboardNavigation?: boolean;
  /** 啟用右鍵選單 */
  enableContextMenu?: boolean;
  /** 啟用復原重做 */
  enableUndoRedo?: boolean;
  /** 最大復原步驟 */
  maxUndoSteps?: number;
  /** 效能模式 */
  performanceMode?: 'normal' | 'fast' | 'extreme';
}

/**
 * 資料變更
 */
export interface DataChange {
  /** 變更類型 */
  type: 'create' | 'update' | 'delete';
  /** 目標類型 */
  target: 'row' | 'cell' | 'field';
  /** 目標 ID */
  targetId: string;
  /** 舊值 */
  oldValue?: unknown;
  /** 新值 */
  newValue?: unknown;
  /** 變更時間 */
  timestamp: Date;
  /** 變更者 */
  userId?: string;
}

/**
 * 表格錯誤
 */
export interface TableError {
  /** 錯誤類型 */
  type: TableErrorType;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤代碼 */
  code?: string;
  /** 錯誤詳情 */
  details?: unknown;
  /** 是否可恢復 */
  recoverable?: boolean;
}

/**
 * 表格錯誤類型
 */
export type TableErrorType = 
  | 'validation'    // 驗證錯誤
  | 'permission'    // 權限錯誤
  | 'network'       // 網路錯誤
  | 'sync'          // 同步錯誤
  | 'limit'         // 限制錯誤
  | 'unknown';      // 未知錯誤

/**
 * 自訂渲染器
 */
export interface CustomRenderers {
  /** 儲存格渲染器 */
  cellRenderer?: CellRenderer;
  /** 標頭渲染器 */
  headerRenderer?: HeaderRenderer;
  /** 列渲染器 */
  rowRenderer?: RowRenderer;
  /** 編輯器渲染器 */
  editorRenderer?: EditorRenderer;
}

/**
 * 儲存格渲染器
 */
export type CellRenderer = (props: CellRendererProps) => ReactElement;

export interface CellRendererProps {
  /** 儲存格資料 */
  cell: Cell;
  /** 欄位定義 */
  field: Field;
  /** 列資料 */
  row: Row;
  /** 是否編輯中 */
  isEditing: boolean;
  /** 是否選中 */
  isSelected: boolean;
  /** 編輯回調 */
  onEdit?: (value: CellValue) => void;
}

/**
 * 標頭渲染器
 */
export type HeaderRenderer = (props: HeaderRendererProps) => ReactElement;

export interface HeaderRendererProps {
  /** 欄位定義 */
  field: Field;
  /** 排序狀態 */
  sortState?: SortConfig;
  /** 篩選狀態 */
  filterState?: FilterConfig;
  /** 排序回調 */
  onSort?: (field: Field) => void;
  /** 篩選回調 */
  onFilter?: (field: Field) => void;
}

/**
 * 列渲染器
 */
export type RowRenderer = (props: RowRendererProps) => ReactElement;

export interface RowRendererProps {
  /** 列資料 */
  row: Row;
  /** 列索引 */
  index: number;
  /** 是否選中 */
  isSelected: boolean;
  /** 選擇回調 */
  onSelect?: (row: Row) => void;
}

/**
 * 編輯器渲染器
 */
export type EditorRenderer = (props: EditorRendererProps) => ReactElement;

export interface EditorRendererProps {
  /** 欄位定義 */
  field: Field;
  /** 當前值 */
  value: CellValue;
  /** 變更回調 */
  onChange: (value: CellValue) => void;
  /** 提交回調 */
  onSubmit: () => void;
  /** 取消回調 */
  onCancel: () => void;
}

/**
 * 可編輯儲存格元件屬性
 */
export interface EditableCellProps {
  /** 儲存格資料 */
  cell: Cell;
  /** 欄位定義 */
  field: Field;
  /** 列索引 */
  rowIndex: number;
  /** 欄索引 */
  columnIndex: number;
  /** 是否編輯中 */
  isEditing: boolean;
  /** 編輯回調 */
  onEdit: (value: CellValue) => void;
  /** 驗證回調 */
  onValidate?: (value: CellValue) => ValidationResult;
  /** 開始編輯回調 */
  onStartEdit?: () => void;
  /** 結束編輯回調 */
  onEndEdit?: () => void;
}

/**
 * 欄位渲染器元件屬性
 */
export interface FieldRendererProps {
  /** 欄位定義 */
  field: Field;
  /** 值 */
  value: CellValue;
  /** 模式 */
  mode: 'view' | 'edit';
  /** 變更回調 */
  onChange?: (value: CellValue) => void;
  /** 錯誤 */
  error?: string;
  /** 停用 */
  disabled?: boolean;
  /** 唯讀 */
  readOnly?: boolean;
}

/**
 * 欄位管理元件屬性
 */
export interface ColumnManagerProps {
  /** 表格結構 */
  schema: TableSchema;
  /** 新增欄位回調 */
  onAddField: (field: Field) => void;
  /** 更新欄位回調 */
  onUpdateField: (id: string, field: Partial<Field>) => void;
  /** 刪除欄位回調 */
  onDeleteField: (id: string) => void;
  /** 重新排序回調 */
  onReorderFields: (oldIndex: number, newIndex: number) => void;
  /** 調整寬度回調 */
  onResizeField: (id: string, width: number) => void;
}

/**
 * 批量操作元件屬性
 */
export interface BulkOperationsProps {
  /** 選中的列 */
  selectedRows: Row[];
  /** 批量編輯回調 */
  onBulkEdit: (updates: Partial<Row>) => void;
  /** 批量刪除回調 */
  onBulkDelete: () => void;
  /** 批量匯出回調 */
  onBulkExport: (format: ExportFormat) => void;
  /** 批量匯入回調 */
  onBulkImport: (data: Row[]) => void;
  /** 清除選擇回調 */
  onClearSelection: () => void;
}

// ============================================================================
// 5. 虛擬滾動型別 (Virtual Scrolling Types)
// ============================================================================

/**
 * 虛擬滾動配置
 */
export interface VirtualScrollConfig {
  /** 項目高度 */
  itemHeight: number | ((index: number) => number);
  /** 緩衝數量 */
  overscan?: number;
  /** 滾動閾值 */
  scrollThreshold?: number;
  /** 緩衝項目數 */
  bufferedItems?: number;
  /** 預載策略 */
  preloadStrategy?: 'none' | 'next' | 'all';
  /** 滾動方向 */
  direction?: 'vertical' | 'horizontal' | 'both';
  /** 估計項目大小 */
  estimatedItemSize?: number;
  /** 快取大小 */
  cacheSize?: number;
}

/**
 * 列虛擬化器
 */
export interface RowVirtualizer {
  /** 可見範圍 */
  visibleRange: VisibleRange;
  /** 虛擬項目 */
  virtualItems: VirtualItem[];
  /** 總大小 */
  totalSize: number;
  /** 滾動到索引 */
  scrollToIndex: (index: number, options?: ScrollOptions) => void;
  /** 滾動到偏移 */
  scrollToOffset: (offset: number, options?: ScrollOptions) => void;
  /** 測量項目 */
  measureItem: (index: number) => void;
  /** 重置 */
  reset: () => void;
}

/**
 * 虛擬項目
 */
export interface VirtualItem {
  /** 索引 */
  index: number;
  /** 開始位置 */
  start: number;
  /** 結束位置 */
  end: number;
  /** 大小 */
  size: number;
  /** 鍵值 */
  key: string | number;
  /** 是否可見 */
  isVisible: boolean;
}

/**
 * 滾動狀態
 */
export interface ScrollState {
  /** 滾動位置 */
  scrollTop: number;
  /** 滾動左側位置 */
  scrollLeft: number;
  /** 滾動高度 */
  scrollHeight: number;
  /** 滾動寬度 */
  scrollWidth: number;
  /** 客戶端高度 */
  clientHeight: number;
  /** 客戶端寬度 */
  clientWidth: number;
  /** 是否正在滾動 */
  isScrolling: boolean;
  /** 滾動方向 */
  scrollDirection?: 'up' | 'down' | 'left' | 'right';
  /** 滾動速度 */
  scrollVelocity?: number;
}

/**
 * 可見範圍
 */
export interface VisibleRange {
  /** 開始索引 */
  startIndex: number;
  /** 結束索引 */
  endIndex: number;
  /** 開始列 */
  startRow?: number;
  /** 結束列 */
  endRow?: number;
  /** 開始欄 */
  startColumn?: number;
  /** 結束欄 */
  endColumn?: number;
}

/**
 * 滾動選項
 */
export interface ScrollOptions {
  /** 對齊方式 */
  align?: 'start' | 'center' | 'end' | 'auto';
  /** 平滑滾動 */
  smooth?: boolean;
  /** 偏移量 */
  offset?: number;
}

// ============================================================================
// 6. 資料同步型別 (Data Synchronization Types)
// ============================================================================

/**
 * 同步狀態
 */
export interface SyncState {
  /** 同步狀態 */
  status: SyncStatus;
  /** 最後同步時間 */
  lastSyncedAt?: Date;
  /** 待同步變更 */
  pendingChanges: PendingChange[];
  /** 同步錯誤 */
  errors: SyncError[];
  /** 同步進度 */
  progress?: SyncProgress;
  /** 連線狀態 */
  connectionState: ConnectionState;
}

/**
 * 同步狀態類型
 */
export type SyncStatus = 
  | 'idle'          // 閒置
  | 'syncing'       // 同步中
  | 'synced'        // 已同步
  | 'error'         // 錯誤
  | 'offline';      // 離線

/**
 * 待同步變更
 */
export interface PendingChange {
  /** 變更 ID */
  id: string;
  /** 變更類型 */
  type: 'create' | 'update' | 'delete';
  /** 目標 */
  target: string;
  /** 資料 */
  data: unknown;
  /** 建立時間 */
  createdAt: Date;
  /** 重試次數 */
  retryCount?: number;
}

/**
 * 同步錯誤
 */
export interface SyncError {
  /** 錯誤 ID */
  id: string;
  /** 變更 ID */
  changeId: string;
  /** 錯誤類型 */
  type: 'conflict' | 'validation' | 'permission' | 'network' | 'unknown';
  /** 錯誤訊息 */
  message: string;
  /** 錯誤時間 */
  occurredAt: Date;
  /** 是否可重試 */
  retryable?: boolean;
}

/**
 * 同步進度
 */
export interface SyncProgress {
  /** 總項目數 */
  total: number;
  /** 已完成數 */
  completed: number;
  /** 失敗數 */
  failed: number;
  /** 進度百分比 */
  percentage: number;
  /** 預估剩餘時間 */
  estimatedTimeRemaining?: number;
}

/**
 * 連線狀態
 */
export type ConnectionState = 
  | 'connected'     // 已連線
  | 'connecting'    // 連線中
  | 'disconnected'  // 已斷線
  | 'reconnecting'; // 重新連線中

/**
 * 衝突解決
 */
export interface ConflictResolution {
  /** 策略 */
  strategy: ConflictStrategy;
  /** 衝突資料 */
  conflictData?: ConflictData;
  /** 解決方式 */
  resolution?: Resolution;
  /** 解決時間 */
  resolvedAt?: Date;
  /** 解決者 */
  resolvedBy?: string;
}

/**
 * 衝突策略
 */
export type ConflictStrategy = 
  | 'last-write-wins'  // 最後寫入優先
  | 'first-write-wins' // 首次寫入優先
  | 'merge'            // 合併
  | 'manual'           // 手動
  | 'custom';          // 自訂

/**
 * 衝突資料
 */
export interface ConflictData {
  /** 本地值 */
  localValue: unknown;
  /** 遠端值 */
  remoteValue: unknown;
  /** 基礎值 */
  baseValue?: unknown;
  /** 衝突欄位 */
  conflictFields?: string[];
}

/**
 * 解決方式
 */
export interface Resolution {
  /** 選擇的值 */
  selectedValue: 'local' | 'remote' | 'merged';
  /** 合併後的值 */
  mergedValue?: unknown;
  /** 解決說明 */
  comment?: string;
}

/**
 * 變更追蹤
 */
export interface ChangeTracker {
  /** 追蹤 ID */
  id: string;
  /** 變更列表 */
  changes: TrackedChange[];
  /** 開始追蹤時間 */
  startedAt: Date;
  /** 最後變更時間 */
  lastChangedAt?: Date;
  /** 變更數量 */
  changeCount: number;
  /** 是否啟用 */
  enabled: boolean;
}

/**
 * 追蹤的變更
 */
export interface TrackedChange {
  /** 變更 ID */
  id: string;
  /** 變更類型 */
  type: ChangeType;
  /** 路徑 */
  path: string[];
  /** 舊值 */
  oldValue?: unknown;
  /** 新值 */
  newValue?: unknown;
  /** 變更時間 */
  timestamp: Date;
  /** 變更者 */
  userId?: string;
  /** 變更原因 */
  reason?: string;
}

/**
 * 變更類型
 */
export type ChangeType = 
  | 'add'     // 新增
  | 'update'  // 更新
  | 'delete'  // 刪除
  | 'move'    // 移動
  | 'rename'; // 重新命名

/**
 * 即時更新
 */
export interface RealtimeUpdate {
  /** 更新 ID */
  id: string;
  /** 更新類型 */
  type: UpdateType;
  /** 資料 */
  data: unknown;
  /** 來源使用者 */
  userId: string;
  /** 時間戳記 */
  timestamp: Date;
  /** 影響範圍 */
  scope?: UpdateScope;
}

/**
 * 更新類型
 */
export type UpdateType = 
  | 'cell-update'    // 儲存格更新
  | 'row-insert'     // 列插入
  | 'row-delete'     // 列刪除
  | 'field-add'      // 欄位新增
  | 'field-update'   // 欄位更新
  | 'field-delete'   // 欄位刪除
  | 'cursor-move'    // 游標移動
  | 'selection';     // 選擇變更

/**
 * 更新範圍
 */
export interface UpdateScope {
  /** 表格 ID */
  tableId?: string;
  /** 列 ID */
  rowIds?: string[];
  /** 欄位 ID */
  fieldIds?: string[];
  /** 儲存格參考 */
  cells?: CellReference[];
}

// ============================================================================
// 7. 權限和安全型別 (Permission and Security Types)
// ============================================================================

/**
 * 資料庫權限
 */
export interface DatabasePermissions {
  /** 擁有者 */
  owner: string;
  /** 公開存取 */
  publicAccess?: AccessLevel;
  /** 使用者權限 */
  userPermissions?: UserPermission[];
  /** 群組權限 */
  groupPermissions?: GroupPermission[];
  /** 角色權限 */
  rolePermissions?: RolePermission[];
}

/**
 * 表格權限
 */
export interface TablePermissions {
  /** 可檢視 */
  canView: boolean;
  /** 可編輯 */
  canEdit: boolean;
  /** 可刪除 */
  canDelete: boolean;
  /** 可分享 */
  canShare: boolean;
  /** 可匯出 */
  canExport: boolean;
  /** 可管理結構 */
  canManageSchema: boolean;
  /** 欄位權限 */
  fieldPermissions?: FieldPermissions[];
  /** 列權限 */
  rowPermissions?: RowPermissions;
}

/**
 * 欄位權限
 */
export interface FieldPermissions {
  /** 欄位 ID */
  fieldId: string;
  /** 可檢視 */
  canView: boolean;
  /** 可編輯 */
  canEdit: boolean;
  /** 可刪除 */
  canDelete: boolean;
}

/**
 * 列權限
 */
export interface RowPermissions {
  /** 權限規則 */
  rules: RowPermissionRule[];
  /** 預設權限 */
  defaultPermission: AccessLevel;
}

/**
 * 列權限規則
 */
export interface RowPermissionRule {
  /** 規則 ID */
  id: string;
  /** 條件 */
  condition: FilterConfig;
  /** 權限等級 */
  permission: AccessLevel;
  /** 優先順序 */
  priority?: number;
}

/**
 * 存取等級
 */
export type AccessLevel = 
  | 'none'      // 無權限
  | 'view'      // 檢視
  | 'comment'   // 評論
  | 'edit'      // 編輯
  | 'admin';    // 管理

/**
 * 使用者權限
 */
export interface UserPermission {
  /** 使用者 ID */
  userId: string;
  /** 權限等級 */
  permission: AccessLevel;
  /** 授予時間 */
  grantedAt?: Date;
  /** 授予者 */
  grantedBy?: string;
  /** 過期時間 */
  expiresAt?: Date;
}

/**
 * 群組權限
 */
export interface GroupPermission {
  /** 群組 ID */
  groupId: string;
  /** 權限等級 */
  permission: AccessLevel;
  /** 授予時間 */
  grantedAt?: Date;
  /** 授予者 */
  grantedBy?: string;
}

/**
 * 角色權限
 */
export interface RolePermission {
  /** 角色 */
  role: UserRole;
  /** 權限等級 */
  permission: AccessLevel;
}

/**
 * 列層級安全
 */
export interface RowLevelSecurity {
  /** 啟用 */
  enabled: boolean;
  /** 規則 */
  rules: SecurityRule[];
  /** 策略 */
  policy: 'allow' | 'deny';
}

/**
 * 安全規則
 */
export interface SecurityRule {
  /** 規則 ID */
  id: string;
  /** 規則名稱 */
  name: string;
  /** 條件 */
  condition: FilterConfig;
  /** 動作 */
  action: 'allow' | 'deny';
  /** 優先順序 */
  priority: number;
  /** 適用角色 */
  roles?: UserRole[];
}

/**
 * 編輯權限
 */
export interface EditPermission {
  /** 可建立 */
  canCreate: boolean;
  /** 可更新 */
  canUpdate: boolean;
  /** 可刪除 */
  canDelete: boolean;
  /** 可批量編輯 */
  canBulkEdit: boolean;
  /** 可復原 */
  canUndo: boolean;
  /** 可重做 */
  canRedo: boolean;
  /** 編輯限制 */
  restrictions?: EditRestriction[];
}

/**
 * 編輯限制
 */
export interface EditRestriction {
  /** 限制類型 */
  type: 'time' | 'count' | 'field' | 'value';
  /** 限制值 */
  value: unknown;
  /** 錯誤訊息 */
  message?: string;
}

// ============================================================================
// 8. 輔助型別和工具 (Helper Types and Utilities)
// ============================================================================

/**
 * 驗證規則
 */
export interface ValidationRule {
  /** 規則類型 */
  type: ValidationType;
  /** 規則值 */
  value?: unknown;
  /** 錯誤訊息 */
  message?: string;
  /** 嚴重程度 */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * 驗證類型
 */
export type ValidationType = 
  | 'required'      // 必填
  | 'unique'        // 唯一
  | 'min'           // 最小值
  | 'max'           // 最大值
  | 'minLength'     // 最小長度
  | 'maxLength'     // 最大長度
  | 'pattern'       // 正則表達式
  | 'email'         // 電子郵件
  | 'url'           // 網址
  | 'custom';       // 自訂

/**
 * 驗證結果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤列表 */
  errors?: ValidationError[];
  /** 警告列表 */
  warnings?: ValidationWarning[];
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  /** 欄位 */
  field?: string;
  /** 規則 */
  rule?: ValidationRule;
  /** 訊息 */
  message: string;
  /** 值 */
  value?: unknown;
}

/**
 * 驗證警告
 */
export interface ValidationWarning {
  /** 欄位 */
  field?: string;
  /** 訊息 */
  message: string;
  /** 建議 */
  suggestion?: string;
}

/**
 * 驗證狀態
 */
export interface ValidationState {
  /** 是否正在驗證 */
  isValidating: boolean;
  /** 驗證結果 */
  result?: ValidationResult;
  /** 最後驗證時間 */
  lastValidatedAt?: Date;
}

/**
 * 本地化配置
 */
export interface LocalizationConfig {
  /** 語言 */
  locale: string;
  /** 翻譯 */
  translations: Record<string, string>;
  /** 日期格式 */
  dateFormat?: string;
  /** 數字格式 */
  numberFormat?: string;
  /** 貨幣格式 */
  currencyFormat?: string;
}

/**
 * 表格主題
 */
export interface TableTheme {
  /** 顏色 */
  colors?: ThemeColors;
  /** 間距 */
  spacing?: ThemeSpacing;
  /** 字型 */
  typography?: ThemeTypography;
  /** 邊框 */
  borders?: ThemeBorders;
  /** 陰影 */
  shadows?: ThemeShadows;
  /** 動畫 */
  animations?: ThemeAnimations;
}

/**
 * 主題顏色
 */
export interface ThemeColors {
  /** 主色 */
  primary?: string;
  /** 次要色 */
  secondary?: string;
  /** 成功色 */
  success?: string;
  /** 警告色 */
  warning?: string;
  /** 錯誤色 */
  error?: string;
  /** 資訊色 */
  info?: string;
  /** 背景色 */
  background?: string;
  /** 表面色 */
  surface?: string;
  /** 文字色 */
  text?: string;
  /** 邊框色 */
  border?: string;
  /** 停用色 */
  disabled?: string;
}

/**
 * 主題間距
 */
export interface ThemeSpacing {
  /** 單位 */
  unit?: number;
  /** 儲存格內距 */
  cellPadding?: string;
  /** 列間距 */
  rowGap?: string;
  /** 欄間距 */
  columnGap?: string;
}

/**
 * 主題字型
 */
export interface ThemeTypography {
  /** 字型家族 */
  fontFamily?: string;
  /** 字型大小 */
  fontSize?: string;
  /** 字型粗細 */
  fontWeight?: string | number;
  /** 行高 */
  lineHeight?: string | number;
}

/**
 * 主題邊框
 */
export interface ThemeBorders {
  /** 邊框寬度 */
  width?: string;
  /** 邊框樣式 */
  style?: string;
  /** 邊框顏色 */
  color?: string;
  /** 圓角 */
  radius?: string;
}

/**
 * 主題陰影
 */
export interface ThemeShadows {
  /** 小陰影 */
  sm?: string;
  /** 中陰影 */
  md?: string;
  /** 大陰影 */
  lg?: string;
  /** 極大陰影 */
  xl?: string;
}

/**
 * 主題動畫
 */
export interface ThemeAnimations {
  /** 持續時間 */
  duration?: string;
  /** 緩動函數 */
  easing?: string;
  /** 啟用動畫 */
  enabled?: boolean;
}

/**
 * 匯出格式
 */
export type ExportFormat = 
  | 'csv'
  | 'excel'
  | 'json'
  | 'pdf'
  | 'markdown'
  | 'html';

/**
 * 匯出選項
 */
export interface ExportOptions {
  /** 格式 */
  format: ExportFormat;
  /** 包含標頭 */
  includeHeaders?: boolean;
  /** 包含中繼資料 */
  includeMetadata?: boolean;
  /** 欄位 */
  fields?: string[];
  /** 篩選 */
  filter?: FilterConfig[];
  /** 排序 */
  sort?: SortConfig[];
  /** 檔案名稱 */
  filename?: string;
  /** 編碼 */
  encoding?: string;
}

/**
 * 匯入選項
 */
export interface ImportOptions {
  /** 格式 */
  format: 'csv' | 'excel' | 'json';
  /** 映射 */
  mapping?: FieldMapping[];
  /** 驗證 */
  validate?: boolean;
  /** 覆寫 */
  overwrite?: boolean;
  /** 批次大小 */
  batchSize?: number;
  /** 編碼 */
  encoding?: string;
}

/**
 * 欄位映射
 */
export interface FieldMapping {
  /** 來源欄位 */
  source: string;
  /** 目標欄位 */
  target: string;
  /** 轉換 */
  transform?: (value: unknown) => unknown;
}

// ============================================================================
// 9. 型別守衛 (Type Guards)
// ============================================================================

/**
 * 檢查是否為表格
 */
export function isTable(obj: unknown): obj is Table {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'schema' in obj &&
    'rows' in obj
  );
}

/**
 * 檢查是否為列
 */
export function isRow(obj: unknown): obj is Row {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'data' in obj &&
    'metadata' in obj
  );
}

/**
 * 檢查是否為儲存格
 */
export function isCell(obj: unknown): obj is Cell {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'rowId' in obj &&
    'fieldId' in obj &&
    'value' in obj
  );
}

/**
 * 檢查是否為欄位
 */
export function isField(obj: unknown): obj is Field {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj
  );
}

/**
 * 檢查欄位類型
 */
export function isFieldType<T extends Field>(
  field: Field,
  type: FieldType
): field is T {
  return field.type === type;
}

// ============================================================================
// 10. 常數定義 (Constants)
// ============================================================================

/**
 * 預設表格配置
 */
export const DEFAULT_TABLE_CONFIG: TableConfig = {
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
  performanceMode: 'normal',
};

/**
 * 預設虛擬滾動配置
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 36,
  overscan: 10,
  scrollThreshold: 100,
  bufferedItems: 20,
  preloadStrategy: 'next',
  direction: 'vertical',
  estimatedItemSize: 36,
  cacheSize: 100,
};

/**
 * 預設表格設定
 */
export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  rowHeight: 'default',
  showRowNumbers: false,
  enableDragDrop: true,
  enableBulkOperations: true,
  enableInlineEditing: true,
};

/**
 * 預設欄位寬度
 */
export const DEFAULT_FIELD_WIDTH = 150;

/**
 * 最大欄位寬度
 */
export const MAX_FIELD_WIDTH = 500;

/**
 * 最小欄位寬度
 */
export const MIN_FIELD_WIDTH = 50;

/**
 * 預設列高度
 */
export const ROW_HEIGHTS: Record<RowHeight, number> = {
  compact: 28,
  default: 36,
  tall: 48,
  'extra-tall': 64,
};

/**
 * 效能模式設定
 */
export const PERFORMANCE_MODES = {
  normal: {
    batchSize: 50,
    overscan: 10,
    cacheSize: 100,
  },
  fast: {
    batchSize: 100,
    overscan: 5,
    cacheSize: 200,
  },
  extreme: {
    batchSize: 200,
    overscan: 2,
    cacheSize: 500,
  },
} as const;

/**
 * 鍵盤快捷鍵
 */
export const KEYBOARD_SHORTCUTS = {
  // 編輯
  startEdit: ['Enter', 'F2'],
  cancelEdit: ['Escape'],
  saveEdit: ['Enter', 'Tab'],
  
  // 導航
  moveUp: ['ArrowUp'],
  moveDown: ['ArrowDown'],
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  moveToStart: ['Home'],
  moveToEnd: ['End'],
  pageUp: ['PageUp'],
  pageDown: ['PageDown'],
  
  // 選擇
  selectAll: ['Ctrl+A', 'Cmd+A'],
  selectRow: ['Shift+Space'],
  selectColumn: ['Ctrl+Space', 'Cmd+Space'],
  extendSelection: ['Shift+Arrow'],
  
  // 操作
  copy: ['Ctrl+C', 'Cmd+C'],
  cut: ['Ctrl+X', 'Cmd+X'],
  paste: ['Ctrl+V', 'Cmd+V'],
  undo: ['Ctrl+Z', 'Cmd+Z'],
  redo: ['Ctrl+Y', 'Cmd+Y', 'Ctrl+Shift+Z', 'Cmd+Shift+Z'],
  delete: ['Delete', 'Backspace'],
  
  // 其他
  find: ['Ctrl+F', 'Cmd+F'],
  replace: ['Ctrl+H', 'Cmd+H'],
  save: ['Ctrl+S', 'Cmd+S'],
} as const;

// ============================================================================
// React 型別定義 (React Type Definitions)
// ============================================================================

// React 相關型別定義（避免直接匯入 React 以維持純型別檔案）
export interface ReactElement {
  type: any;
  props: any;
  key: string | number | null;
}

export interface CSSProperties {
  [key: string]: string | number | undefined;
}

// ============================================================================
// 匯出所有型別 (Export All Types)
// ============================================================================

// 所有介面和型別都已在定義時使用 export 關鍵字匯出
// TypeScript 會自動處理所有的型別匯出