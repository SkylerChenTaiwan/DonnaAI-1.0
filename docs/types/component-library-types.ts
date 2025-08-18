/**
 * @fileoverview DonnaAI 元件庫完整型別系統架構
 * @version 1.0.0
 * @description 企業級元件庫的嚴格型別定義，確保型別安全和開發效率
 */

// ============================================================================
// 品牌型別 (Branded Types) - 用於強型別識別符
// ============================================================================

type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;
export type ComponentId = Brand<string, 'ComponentId'>;
export type ThemeId = Brand<string, 'ThemeId'>;
export type FormId = Brand<string, 'FormId'>;
export type TableId = Brand<string, 'TableId'>;

// ============================================================================
// 設計系統 Tokens 型別定義
// ============================================================================

/**
 * 顏色系統型別定義
 */
export interface ColorTokens {
  // 主要色彩
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // 主色
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 中性色
  neutral: {
    0: string;    // 純白
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
    1000: string; // 純黑
  };
  
  // 語義色彩
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
    successLight: string;
    warningLight: string;
    errorLight: string;
    infoLight: string;
  };
}

/**
 * 間距系統型別
 */
export type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
export type SpacingToken = `${SpacingScale}px` | `${SpacingScale}rem`;

/**
 * 字體系統型別
 */
export interface TypographyTokens {
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
  };
  fontSize: {
    xs: string;    // 12px
    sm: string;    // 14px
    base: string;  // 16px
    lg: string;    // 18px
    xl: string;    // 20px
    '2xl': string; // 24px
    '3xl': string; // 30px
    '4xl': string; // 36px
    '5xl': string; // 48px
  };
  fontWeight: {
    thin: 100;
    light: 300;
    normal: 400;
    medium: 500;
    semibold: 600;
    bold: 700;
    extrabold: 800;
    black: 900;
  };
  lineHeight: {
    none: 1;
    tight: 1.25;
    snug: 1.375;
    normal: 1.5;
    relaxed: 1.625;
    loose: 2;
  };
}

/**
 * 陰影系統型別
 */
export interface ShadowTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/**
 * 動畫時間型別
 */
export interface AnimationTokens {
  duration: {
    instant: 0;
    fast: 150;
    base: 250;
    slow: 350;
    slower: 500;
    slowest: 1000;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
  };
}

/**
 * 響應式斷點型別
 */
export interface BreakpointTokens {
  xs: 0;
  sm: 640;
  md: 768;
  lg: 1024;
  xl: 1280;
  '2xl': 1536;
}

/**
 * 圓角系統型別
 */
export interface RadiusTokens {
  none: '0';
  sm: '0.125rem';
  base: '0.25rem';
  md: '0.375rem';
  lg: '0.5rem';
  xl: '0.75rem';
  '2xl': '1rem';
  '3xl': '1.5rem';
  full: '9999px';
}

// ============================================================================
// 基礎元件型別定義
// ============================================================================

/**
 * Button 元件型別定義
 */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColorScheme = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  colorScheme?: ButtonColorScheme;
  isLoading?: boolean;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'data-testid'?: string;
}

/**
 * Input 元件型別定義
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  pattern?: string;
  validate?: (value: string) => boolean | string;
}

export interface InputProps extends InputValidation {
  type?: InputType;
  size?: InputSize;
  variant?: InputVariant;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

/**
 * Card 元件型別定義
 */
export type CardVariant = 'elevated' | 'outline' | 'filled' | 'unstyled';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  size?: CardSize;
  isHoverable?: boolean;
  isPressable?: boolean;
  isDisabled?: boolean;
  shadow?: keyof ShadowTokens;
  borderRadius?: keyof RadiusTokens;
  padding?: SpacingScale;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Modal 元件型別定義
 */
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPlacement = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  placement?: ModalPlacement;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  lockFocusAcrossFrames?: boolean;
  blockScrollOnMount?: boolean;
  allowPinchZoom?: boolean;
  autoFocus?: boolean;
  returnFocusOnClose?: boolean;
  preserveScrollBarGap?: boolean;
  motionPreset?: 'slideInBottom' | 'slideInRight' | 'scale' | 'none';
  isCentered?: boolean;
  scrollBehavior?: 'inside' | 'outside';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

/**
 * Select 元件型別定義
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value?: T | T[];
  defaultValue?: T | T[];
  onChange?: (value: T | T[]) => void;
  onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  isMultiple?: boolean;
  isSearchable?: boolean;
  isCreatable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
  errorMessage?: string;
  helperText?: string;
  size?: InputSize;
  variant?: InputVariant;
  maxMenuHeight?: number;
  closeMenuOnSelect?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

// ============================================================================
// 專業元件型別架構
// ============================================================================

/**
 * NotionTable 型別定義
 */
export type CellType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup';

export interface TableColumn<T = any> {
  id: string;
  name: string;
  type: CellType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  isResizable?: boolean;
  isSortable?: boolean;
  isFilterable?: boolean;
  isEditable?: boolean;
  isHidden?: boolean;
  isPinned?: 'left' | 'right' | false;
  options?: SelectOption[];
  formula?: string;
  relation?: {
    tableId: TableId;
    columnId: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  };
  rollup?: {
    relationColumnId: string;
    targetColumnId: string;
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median';
  };
  validation?: {
    required?: boolean;
    unique?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any, row: T) => boolean | string;
  };
  render?: (value: any, row: T, column: TableColumn<T>) => React.ReactNode;
  editRender?: (value: any, row: T, column: TableColumn<T>, onChange: (value: any) => void) => React.ReactNode;
}

export interface TableRow<T = any> {
  id: string;
  data: T;
  isSelected?: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  isDirty?: boolean;
  errors?: Record<string, string>;
  children?: TableRow<T>[];
}

export interface TableEditState<T = any> {
  editingCells: Map<string, Map<string, any>>; // rowId -> columnId -> value
  dirtyRows: Set<string>;
  errors: Map<string, Map<string, string>>; // rowId -> columnId -> error
  history: Array<{
    type: 'edit' | 'add' | 'delete';
    timestamp: number;
    data: any;
  }>;
  canUndo: boolean;
  canRedo: boolean;
}

export interface NotionTableProps<T = any> {
  tableId: TableId;
  columns: TableColumn<T>[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onCellEdit?: (rowId: string, columnId: string, value: any) => void;
  onRowAdd?: (row: T) => void;
  onRowDelete?: (rowId: string) => void;
  onRowsReorder?: (sourceIndex: number, destinationIndex: number) => void;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnReorder?: (sourceIndex: number, destinationIndex: number) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  showToolbar?: boolean;
  showFooter?: boolean;
  enableVirtualization?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  emptyState?: React.ReactNode;
  'data-testid'?: string;
}

/**
 * Chart 元件型別定義
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar' | 'heatmap' | 'treemap' | 'funnel' | 'gauge';

export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  z?: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  type?: ChartType;
  color?: string;
  visible?: boolean;
  yAxisId?: string;
  stack?: string;
  smooth?: boolean;
  area?: boolean;
  symbol?: 'circle' | 'square' | 'triangle' | 'diamond' | 'none';
  symbolSize?: number;
  lineStyle?: {
    width?: number;
    type?: 'solid' | 'dashed' | 'dotted';
  };
  areaStyle?: {
    opacity?: number;
    gradient?: boolean;
  };
}

export interface ChartAxis {
  id?: string;
  type?: 'value' | 'category' | 'time' | 'log';
  position?: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  min?: number | 'auto';
  max?: number | 'auto';
  tickInterval?: number;
  tickFormat?: (value: any) => string;
  gridLines?: boolean;
  visible?: boolean;
}

export interface ChartLegend {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  orientation?: 'horizontal' | 'vertical';
  itemGap?: number;
  formatter?: (name: string) => string;
}

export interface ChartTooltip {
  show?: boolean;
  trigger?: 'item' | 'axis' | 'none';
  formatter?: (params: any) => string | React.ReactNode;
  position?: 'auto' | [number, number] | ((point: [number, number]) => [number, number]);
}

export interface ChartProps {
  type: ChartType;
  series: ChartSeries[];
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis | ChartAxis[];
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
  theme?: 'light' | 'dark' | 'auto';
  colors?: string[];
  animation?: boolean;
  animationDuration?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  onDataClick?: (data: ChartDataPoint, seriesId: string) => void;
  onLegendClick?: (seriesId: string) => void;
  exportOptions?: {
    enabled?: boolean;
    formats?: ('png' | 'svg' | 'pdf')[];
  };
  'data-testid'?: string;
}

/**
 * OrganizationChart 型別定義
 */
export interface OrgChartNode {
  id: string;
  parentId?: string;
  name: string;
  title?: string;
  department?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  level?: number;
  expanded?: boolean;
  metadata?: Record<string, any>;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface OrgChartEdge {
  source: string;
  target: string;
  type?: 'direct' | 'dotted' | 'none';
  label?: string;
  style?: {
    color?: string;
    width?: number;
  };
}

export type OrgChartLayout = 'tree' | 'radial' | 'force' | 'hierarchy' | 'matrix';
export type OrgChartOrientation = 'vertical' | 'horizontal';

export interface OrganizationChartProps {
  nodes: OrgChartNode[];
  edges?: OrgChartEdge[];
  layout?: OrgChartLayout;
  orientation?: OrgChartOrientation;
  nodeWidth?: number;
  nodeHeight?: number;
  levelGap?: number;
  siblingGap?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  showMinimap?: boolean;
  collapsible?: boolean;
  onNodeClick?: (node: OrgChartNode) => void;
  onNodeDoubleClick?: (node: OrgChartNode) => void;
  onNodeExpand?: (nodeId: string, expanded: boolean) => void;
  renderNode?: (node: OrgChartNode) => React.ReactNode;
  'data-testid'?: string;
}

/**
 * AIQueryInterface 型別定義
 */
export type AIMessageRole = 'user' | 'assistant' | 'system' | 'function';
export type AIModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro' | 'custom';

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: Date;
  tokens?: number;
  model?: AIModelType;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  metadata?: {
    citations?: string[];
    confidence?: number;
    processingTime?: number;
  };
}

export interface AIContext {
  sessionId: string;
  userId: UserId;
  organizationId?: OrganizationId;
  contextType: 'general' | 'data-analysis' | 'code-generation' | 'document-qa';
  activeDataSources?: Array<{
    id: string;
    type: 'database' | 'file' | 'api';
    name: string;
  }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface AIQueryInterfaceProps {
  context: AIContext;
  messages?: AIMessage[];
  onSendMessage?: (message: string) => Promise<AIMessage>;
  onClearContext?: () => void;
  onExportChat?: () => void;
  enableVoiceInput?: boolean;
  enableFileUpload?: boolean;
  enableCodeExecution?: boolean;
  suggestedQueries?: string[];
  placeholder?: string;
  isLoading?: boolean;
  error?: string;
  maxMessageLength?: number;
  showTypingIndicator?: boolean;
  renderMessage?: (message: AIMessage) => React.ReactNode;
  'data-testid'?: string;
}

// ============================================================================
// 表單和驗證型別
// ============================================================================

/**
 * 表單欄位型別
 */
export type FieldType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'date' | 'time' | 'datetime' | 
                        'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch' | 'slider' | 'range' |
                        'textarea' | 'richtext' | 'markdown' | 'code' | 'json' |
                        'file' | 'image' | 'color' | 'rating' | 'tags';

/**
 * 驗證規則型別
 */
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData: Record<string, any>) => boolean | Promise<boolean>;
}

/**
 * 表單欄位定義
 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  validation?: ValidationRule[];
  dependencies?: Array<{
    field: string;
    condition: (value: any) => boolean;
    action: 'show' | 'hide' | 'enable' | 'disable' | 'setValue';
    value?: any;
  }>;
  options?: SelectOption[];
  multiple?: boolean;
  accept?: string; // for file input
  maxSize?: number; // for file input
  rows?: number; // for textarea
  min?: number; // for number, slider, range
  max?: number; // for number, slider, range
  step?: number; // for number, slider, range
  format?: string; // for date/time
  language?: string; // for code
}

/**
 * 表單狀態型別
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  submitCount: number;
}

/**
 * 表單元件 Props
 */
export interface FormProps {
  formId: FormId;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onChange?: (values: Record<string, any>) => void;
  onValidate?: (values: Record<string, any>) => Record<string, string> | Promise<Record<string, string>>;
  layout?: 'vertical' | 'horizontal' | 'inline';
  columns?: 1 | 2 | 3 | 4;
  showRequiredIndicator?: boolean;
  showErrorSummary?: boolean;
  submitOnEnter?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  renderField?: (field: FormField, props: any) => React.ReactNode;
  'data-testid'?: string;
}

// ============================================================================
// 互動和事件型別
// ============================================================================

/**
 * 鍵盤快捷鍵型別
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description?: string;
  global?: boolean;
  preventDefault?: boolean;
}

/**
 * 手勢型別
 */
export type GestureType = 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'rotate' | 'pan';

export interface GestureEvent {
  type: GestureType;
  target: HTMLElement;
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  rotation?: number;
  velocity?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * 拖放型別
 */
export interface DragDropContext {
  isDragging: boolean;
  draggedItem: any;
  draggedFrom: string;
  draggedOver?: string;
  dropZones: string[];
}

export interface DraggableProps {
  draggableId: string;
  index: number;
  isDragDisabled?: boolean;
  children: (provided: any, snapshot: any) => React.ReactNode;
}

export interface DroppableProps {
  droppableId: string;
  type?: string;
  direction?: 'vertical' | 'horizontal';
  isDropDisabled?: boolean;
  children: (provided: any, snapshot: any) => React.ReactNode;
}

/**
 * 動畫和轉場型別
 */
export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'flip' | 'bounce' | 'custom';
export type AnimationTiming = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export interface AnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  timing?: AnimationTiming;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  keyframes?: Record<string, any>[];
}

// ============================================================================
// 無障礙 (Accessibility) 型別
// ============================================================================

/**
 * ARIA 屬性型別
 */
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-details'?: string;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-hidden'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-modal'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-placeholder'?: string;
  'aria-pressed'?: boolean | 'mixed';
  'aria-readonly'?: boolean;
  'aria-required'?: boolean;
  'aria-selected'?: boolean;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
  'aria-errormessage'?: string;
  'aria-flowto'?: string;
  'aria-grabbed'?: boolean;
  'aria-keyshortcuts'?: string;
  'aria-owns'?: string;
  'aria-relevant'?: 'additions' | 'additions removals' | 'additions text' | 'all' | 'removals' | 'removals additions' | 'removals text' | 'text' | 'text additions' | 'text removals';
  'aria-roledescription'?: string;
}

/**
 * 焦點管理型別
 */
export interface FocusManagement {
  focusTrap?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  focusLock?: boolean;
  initialFocus?: string | HTMLElement;
  finalFocus?: string | HTMLElement;
  onFocusEnter?: () => void;
  onFocusLeave?: () => void;
}

// ============================================================================
// 主題和樣式型別
// ============================================================================

/**
 * 主題配置型別
 */
export interface ThemeConfig {
  id: ThemeId;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingScale[];
  shadows: ShadowTokens;
  radius: RadiusTokens;
  animations: AnimationTokens;
  breakpoints: BreakpointTokens;
  components?: Record<string, ComponentStyleOverride>;
}

/**
 * 元件樣式覆寫型別
 */
export interface ComponentStyleOverride {
  baseStyle?: Record<string, any>;
  sizes?: Record<string, Record<string, any>>;
  variants?: Record<string, Record<string, any>>;
  defaultProps?: Record<string, any>;
}

/**
 * CSS-in-JS 樣式型別
 */
export type StyleProp = React.CSSProperties | ((theme: ThemeConfig) => React.CSSProperties);

/**
 * 響應式樣式型別
 */
export type ResponsiveValue<T> = T | Partial<Record<keyof BreakpointTokens, T>>;

export interface ResponsiveStyleProps {
  display?: ResponsiveValue<React.CSSProperties['display']>;
  width?: ResponsiveValue<React.CSSProperties['width']>;
  height?: ResponsiveValue<React.CSSProperties['height']>;
  margin?: ResponsiveValue<SpacingScale>;
  padding?: ResponsiveValue<SpacingScale>;
  fontSize?: ResponsiveValue<keyof TypographyTokens['fontSize']>;
  flexDirection?: ResponsiveValue<React.CSSProperties['flexDirection']>;
  gridTemplateColumns?: ResponsiveValue<string>;
}

// ============================================================================
// 進階型別模式
// ============================================================================

/**
 * 條件型別 - 用於動態 Props
 */
export type ConditionalProps<T, K extends keyof T> = T[K] extends true
  ? T & Required<Pick<T, K>>
  : T;

/**
 * 排除型別 - 用於互斥 Props
 */
export type ExclusiveProps<T, K extends keyof T, U extends keyof T> = 
  | (Pick<T, K> & { [P in U]?: never })
  | (Pick<T, U> & { [P in K]?: never });

/**
 * 映射型別 - 用於主題變體
 */
export type ThemeVariantMap<T extends string> = {
  [K in T]: {
    backgroundColor: string;
    color: string;
    borderColor?: string;
    hoverBackgroundColor?: string;
    hoverColor?: string;
  };
};

/**
 * 模板字面量型別 - 用於 CSS 類別
 */
export type UtilityClass = `${'' | 'm' | 'p'}${'t' | 'r' | 'b' | 'l' | 'x' | 'y' | ''}-${SpacingScale}`;
export type ColorClass = `${'' | 'bg' | 'text' | 'border'}-${keyof ColorTokens['semantic'] | 'primary' | 'neutral'}`;

/**
 * 遞迴型別 - 用於樹狀結構
 */
export interface TreeNode<T = any> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
  parent?: TreeNode<T>;
  level: number;
  path: string[];
}

/**
 * 聯合判別型別 - 用於狀態機
 */
export type ComponentState<T extends string = string> = 
  | { status: 'idle'; data?: never; error?: never }
  | { status: 'loading'; data?: never; error?: never }
  | { status: 'success'; data: T; error?: never }
  | { status: 'error'; data?: never; error: Error };

// ============================================================================
// 型別守衛和工具函數
// ============================================================================

/**
 * 型別守衛函數
 */
export const isUserId = (value: any): value is UserId => {
  return typeof value === 'string' && value.startsWith('user_');
};

export const isOrganizationId = (value: any): value is OrganizationId => {
  return typeof value === 'string' && value.startsWith('org_');
};

export const isComponentId = (value: any): value is ComponentId => {
  return typeof value === 'string' && value.startsWith('comp_');
};

export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 型別斷言函數
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is not defined');
  }
}

/**
 * 型別轉換工具
 */
export const toUserId = (value: string): UserId => {
  if (!value.startsWith('user_')) {
    throw new Error('Invalid user ID format');
  }
  return value as UserId;
};

export const toOrganizationId = (value: string): OrganizationId => {
  if (!value.startsWith('org_')) {
    throw new Error('Invalid organization ID format');
  }
  return value as OrganizationId;
};

/**
 * 深度只讀型別
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly U[]
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * 深度部分型別
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * 提取 Props 型別
 */
export type PropsOf<C extends keyof JSX.IntrinsicElements | React.ComponentType<any>> = 
  C extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[C]
    : C extends React.ComponentType<infer P>
    ? P
    : never;

/**
 * Omit 分發型別
 */
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

// ============================================================================
// 型別測試
// ============================================================================

/**
 * 編譯時型別測試
 */
export type Expect<T extends true> = T;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
export type NotEqual<X, Y> = Equal<X, Y> extends true ? false : true;

// 型別測試範例
type _TestButtonVariant = Expect<Equal<ButtonVariant, 'solid' | 'outline' | 'ghost' | 'soft' | 'link'>>;
type _TestUserId = Expect<NotEqual<UserId, string>>;
type _TestBrandTypes = Expect<NotEqual<UserId, OrganizationId>>;

// ============================================================================
// 匯出索引
// ============================================================================

export type {
  // Re-export all types for convenient imports
  ButtonProps,
  InputProps,
  CardProps,
  ModalProps,
  SelectProps,
  NotionTableProps,
  ChartProps,
  OrganizationChartProps,
  AIQueryInterfaceProps,
  FormProps,
  ThemeConfig,
  AnimationConfig,
  AriaAttributes,
};

// ============================================================================
// 版本和元資料
// ============================================================================

export const TYPE_SYSTEM_VERSION = '1.0.0';
export const TYPE_SYSTEM_LAST_UPDATED = '2024-01-20';
export const TYPE_SYSTEM_COMPATIBILITY = {
  typescript: '>=5.0.0',
  react: '>=18.0.0',
  'react-native': '>=0.72.0',
};