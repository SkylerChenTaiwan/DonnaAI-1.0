/**
 * 資料視覺化系統類型定義
 * 支援自然語言查詢轉換為圖表顯示
 */

// import { Timestamp } from 'firebase/firestore';

// === 基礎類型定義 ===

export type ChartType = 
  | 'bar'           // 長條圖
  | 'line'          // 折線圖
  | 'pie'           // 圓餅圖
  | 'scatter'       // 散點圖
  | 'grouped-bar'   // 分組長條圖
  | 'stacked-bar';  // 堆疊長條圖

export type DataType = 'customers' | 'records' | 'tasks' | 'aiUsage';

export type MetricType = 
  | 'count'         // 計數
  | 'sum'           // 總和
  | 'average'       // 平均
  | 'percentage'    // 百分比
  | 'duration';     // 時長

export type DimensionType = 
  | 'time'          // 時間維度
  | 'user'          // 用戶維度
  | 'team'          // 團隊維度
  | 'status'        // 狀態維度
  | 'type'          // 類型維度
  | 'priority';     // 優先級維度

// === 查詢相關類型 ===

/**
 * 自然語言查詢
 */
export interface NLQuery {
  id: string;
  query: string;
  timestamp: Date;
  userId: string;
  finalQuery?: string;  // 澄清後的完整查詢
  chartId?: string;     // 生成的圖表 ID
  organizationId: string;
  teamId?: string;
}

/**
 * 查詢解析結果
 */
export interface QueryInterpretation {
  entities: {
    dataType: DataType;
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    timeRange?: { 
      start: Date; 
      end: Date;
    };
  };
  suggestedChartType: ChartType;
  confidence: number;
  clarificationNeeded?: ClarificationRequest;
}

/**
 * 澄清請求
 */
export interface ClarificationRequest {
  fields: ClarificationField[];
}

/**
 * 澄清欄位定義
 */
export interface ClarificationField {
  name: string;
  label: string;
  type: 'select' | 'multiselect' | 'dateRange';
  options?: ClarificationOption[];
  defaultValue?: any;
  required?: boolean;
}

/**
 * 澄清選項
 */
export interface ClarificationOption {
  value: string;
  label: string;
  default?: boolean;
}

/**
 * 查詢會話狀態（簡化版，無對話歷史）
 */
export interface QuerySession {
  queryId: string;
  originalQuery: string;
  interpretation?: QueryInterpretation;
  clarificationForm?: ClarificationRequest;
  finalParameters?: any;
  status: 'processing' | 'clarifying' | 'generating' | 'completed' | 'error';
  error?: string;
}

// === 圖表相關類型 ===

/**
 * 圖表配置
 */
export interface ChartConfig {
  // 基本配置
  width?: number;
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  
  // 顏色配置
  colorScale?: string[];
  theme?: 'light' | 'dark';
  
  // 軸配置
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  
  // 互動配置
  enableZoom?: boolean;
  enableTooltip?: boolean;
  enableLegend?: boolean;
  
  // 動畫配置
  animate?: boolean;
  animationDuration?: number;
}

/**
 * 軸配置
 */
export interface AxisConfig {
  label?: string;
  tickFormat?: (value: any) => string;
  domain?: [number, number];
  tickCount?: number;
  style?: any;
}

/**
 * 圖表資料
 */
export interface ChartData {
  id: string;
  type: ChartType;
  data: any[];  // 實際資料格式依圖表類型而定
  config: ChartConfig;
  metadata: ChartMetadata;
  queryId: string;  // 關聯的查詢 ID
}

/**
 * 圖表元資料
 */
export interface ChartMetadata {
  title: string;
  description: string;
  generatedAt: Date;
  dataSource: DataType;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, any>;
  timeRange?: { start: Date; end: Date };
  recordCount: number;
}

// === 資料處理類型 ===

/**
 * 聚合選項
 */
export interface AggregationOptions {
  metric: MetricType;
  dimension: DimensionType;
  filters?: Record<string, any>;
  timeRange?: { start: Date; end: Date };
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

/**
 * 處理後的圖表資料點
 */
export interface DataPoint {
  x: any;  // X 軸值
  y: any;  // Y 軸值
  label?: string;
  value?: number;
  category?: string;
  metadata?: any;
}

/**
 * 圖表資料集
 */
export interface ChartDataset {
  label: string;
  data: DataPoint[];
  color?: string;
  style?: any;
}

// === Store 相關類型 ===

/**
 * 查詢 Store 狀態
 */
export interface QueryStoreState {
  // 當前查詢會話
  currentSession: QuerySession | null;
  
  // 查詢歷史（只儲存成功的）
  queryHistory: NLQuery[];
  
  // 快取的圖表
  cachedCharts: Map<string, ChartData>;
  
  // 載入狀態
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startQuery: (query: string) => Promise<void>;
  handleInterpretation: (interpretation: QueryInterpretation) => void;
  submitClarification: (formData: any) => Promise<void>;
  saveSuccessfulQuery: (finalQuery: string, chartId: string) => void;
  clearCurrentSession: () => void;
  loadQueryHistory: () => Promise<void>;
}

// === API 相關類型 ===

/**
 * Gemini API 查詢請求
 */
export interface GeminiQueryRequest {
  query: string;
  userRole: string;
  teamIds: string[];
  clarificationResponse?: any;
}

/**
 * Gemini API 查詢回應
 */
export interface GeminiQueryResponse {
  interpretation: QueryInterpretation;
  tokensUsed: number;
  processingTime: number;
}

// === 快速查詢範本 ===

export interface QueryTemplate {
  id: string;
  title: string;
  description: string;
  query: string;
  category: 'sales' | 'tasks' | 'meetings' | 'performance' | 'ai-usage';
  icon?: string;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'monthly-visits',
    title: '本月客戶拜訪',
    description: '查看團隊本月的客戶拜訪次數',
    query: '顯示本月每個業務員的客戶拜訪次數',
    category: 'sales'
  },
  {
    id: 'task-completion',
    title: '任務完成率',
    description: '比較不同時期的任務完成情況',
    query: '比較上季度和這季度的任務完成率',
    category: 'tasks'
  },
  {
    id: 'meeting-trends',
    title: '會議時長趨勢',
    description: '分析會議時長的變化趨勢',
    query: '最近30天的會議時長趨勢',
    category: 'meetings'
  },
  {
    id: 'team-performance',
    title: '團隊績效',
    description: '查看各團隊的綜合表現',
    query: '各團隊的客戶分佈圓餅圖',
    category: 'performance'
  },
  {
    id: 'ai-usage',
    title: 'AI 使用統計',
    description: '查看 AI 功能的使用情況',
    query: '顯示 AI 使用量的每週變化',
    category: 'ai-usage'
  }
];

// === 匯出相關類型 ===

export interface ExportOptions {
  format: 'png' | 'svg' | 'csv' | 'json';
  quality?: number;  // For PNG export
  includeMetadata?: boolean;
}