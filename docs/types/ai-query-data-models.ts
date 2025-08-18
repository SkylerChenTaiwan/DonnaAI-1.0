/**
 * PRP-124: AI 驅動分析查詢介面 - 完整型別定義系統
 * 
 * @description 此檔案包含 AI 驅動分析查詢介面的所有 TypeScript 型別定義
 * @version 1.0.0
 * @date 2025-08-18
 * @author typescript-type-guardian
 * 
 * 型別系統設計原則：
 * - 嚴格型別安全：避免 any，使用嚴格的型別檢查
 * - 組合優於繼承：使用介面組合和 Union 型別
 * - 前後端一致：確保 API 介面型別前後端一致
 * - 可擴展性：設計易於擴展的型別結構
 * - 錯誤處理：完整的錯誤型別覆蓋
 */

// ============================================================================
// 1. 核心查詢型別 (Core Query Types)
// ============================================================================

/**
 * AI 查詢請求 - 使用者自然語言查詢的資料結構
 */
export interface AIQuery {
  /** 查詢 ID */
  id: string;
  /** 使用者 ID */
  userId: string;
  /** 組織 ID */
  organizationId: string;
  /** 自然語言查詢內容 */
  query: string;
  /** 查詢語言 */
  language: 'zh-TW' | 'zh-CN' | 'en-US' | 'ja-JP';
  /** 查詢上下文 */
  context?: QueryContext;
  /** 查詢選項 */
  options?: QueryOptions;
  /** 查詢來源 */
  source: 'text' | 'voice' | 'template' | 'suggestion';
  /** 建立時間 */
  createdAt: Date;
  /** 查詢狀態 */
  status: QueryStatus;
  /** 父查詢 ID（用於連續查詢） */
  parentQueryId?: string;
  /** 查詢標籤 */
  tags?: string[];
  /** 是否已收藏 */
  isFavorited?: boolean;
}

/**
 * 查詢狀態
 */
export type QueryStatus = 
  | 'pending'      // 待處理
  | 'processing'   // 處理中
  | 'completed'    // 已完成
  | 'failed'       // 失敗
  | 'cancelled';   // 已取消

/**
 * 查詢上下文 - 提供查詢的額外資訊
 */
export interface QueryContext {
  /** 當前頁面 */
  currentPage?: 'dashboard' | 'analytics' | 'reports' | 'settings';
  /** 當前檢視的資料 */
  currentData?: {
    type: string;
    id: string;
    metadata?: Record<string, unknown>;
  };
  /** 上一個查詢結果 */
  previousResult?: QueryResult;
  /** 使用者角色 */
  userRole?: string;
  /** 使用者偏好 */
  userPreferences?: UserAnalyticsPreferences;
  /** 時區 */
  timezone?: string;
  /** 地區設定 */
  locale?: string;
}

/**
 * 查詢選項
 */
export interface QueryOptions {
  /** 是否需要即時資料 */
  realtime?: boolean;
  /** 是否使用快取 */
  useCache?: boolean;
  /** 最大執行時間（毫秒） */
  timeout?: number;
  /** 結果數量限制 */
  limit?: number;
  /** 偏好的圖表類型 */
  preferredChartTypes?: ChartType[];
  /** 是否包含 AI 解釋 */
  includeExplanation?: boolean;
  /** 是否包含後續建議 */
  includeSuggestions?: boolean;
  /** 資料精確度要求 */
  accuracy?: 'low' | 'medium' | 'high';
}

/**
 * 查詢意圖 - AI 解析後的查詢意圖和實體
 */
export interface QueryIntent {
  /** 主要意圖類型 */
  primary: IntentType;
  /** 次要意圖類型 */
  secondary?: IntentType[];
  /** 信心分數 (0-1) */
  confidence: number;
  /** 提取的實體 */
  entities: ExtractedEntity[];
  /** 查詢分類 */
  classification: QueryClassification;
  /** 意圖解釋 */
  explanation?: string;
  /** 原始 AI 回應 */
  rawResponse?: string;
}

/**
 * 意圖類型
 */
export type IntentType = 
  | 'query'        // 查詢資料
  | 'comparison'   // 比較分析
  | 'trend'        // 趨勢分析
  | 'prediction'   // 預測分析
  | 'aggregate'    // 聚合分析
  | 'filter'       // 篩選資料
  | 'ranking'      // 排名分析
  | 'anomaly'      // 異常檢測
  | 'correlation'  // 相關性分析
  | 'distribution'; // 分布分析

/**
 * 查詢分類
 */
export interface QueryClassification {
  /** 業務領域 */
  domain: 'sales' | 'customer' | 'marketing' | 'operations' | 'finance' | 'general';
  /** 時間範圍類型 */
  timeScope: 'realtime' | 'historical' | 'predictive';
  /** 複雜度等級 */
  complexity: 'simple' | 'moderate' | 'complex';
  /** 資料來源需求 */
  dataSources: DataSourceType[];
}

/**
 * 提取的實體
 */
export interface ExtractedEntity {
  /** 實體類型 */
  type: EntityType;
  /** 實體值（原始） */
  value: string;
  /** 標準化後的值 */
  normalizedValue: unknown;
  /** 信心分數 (0-1) */
  confidence: number;
  /** 在原始查詢中的位置 */
  position?: {
    start: number;
    end: number;
  };
  /** 實體屬性 */
  attributes?: Record<string, unknown>;
}

/**
 * 實體類型
 */
export type EntityType = 
  | 'metric'              // 指標（營收、客戶數等）
  | 'time_period'         // 時間週期
  | 'date_range'          // 日期範圍
  | 'dimension'           // 維度（地區、產品等）
  | 'filter_condition'    // 篩選條件
  | 'comparison_operator' // 比較運算子
  | 'aggregation'         // 聚合函數
  | 'sort_order'          // 排序方式
  | 'threshold'           // 閾值
  | 'entity_name';        // 實體名稱（人員、公司等）

/**
 * 查詢結果 - AI 處理後的查詢結果
 */
export interface QueryResult {
  /** 查詢 ID */
  queryId: string;
  /** 執行狀態 */
  status: 'success' | 'partial' | 'error';
  /** 查詢資料 */
  data: QueryData;
  /** 圖表配置 */
  chartConfig?: ChartConfig;
  /** AI 解釋 */
  explanation?: AIExplanation;
  /** 後續建議 */
  suggestions?: QuerySuggestion[];
  /** 執行元資料 */
  metadata: QueryMetadata;
  /** 錯誤資訊（如果有） */
  error?: QueryError;
  /** 快取資訊 */
  cacheInfo?: CacheInfo;
}

/**
 * 查詢資料
 */
export interface QueryData {
  /** 欄位定義 */
  columns: ColumnDefinition[];
  /** 資料列 */
  rows: DataRow[];
  /** 聚合結果 */
  aggregations?: AggregationResult[];
  /** 資料摘要 */
  summary?: DataSummary;
  /** 資料來源 */
  sources: DataSource[];
}

/**
 * 欄位定義
 */
export interface ColumnDefinition {
  /** 欄位名稱 */
  name: string;
  /** 欄位類型 */
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  /** 欄位格式 */
  format?: string;
  /** 欄位描述 */
  description?: string;
  /** 單位 */
  unit?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可篩選 */
  filterable?: boolean;
  /** 統計資訊 */
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    uniqueCount?: number;
  };
}

/**
 * 資料列
 */
export type DataRow = Record<string, unknown>;

/**
 * 聚合結果
 */
export interface AggregationResult {
  /** 聚合類型 */
  type: AggregationType;
  /** 欄位名稱 */
  field: string;
  /** 聚合值 */
  value: number | string | Date;
  /** 分組依據 */
  groupBy?: Record<string, unknown>;
}

/**
 * 聚合類型
 */
export type AggregationType = 
  | 'sum' 
  | 'avg' 
  | 'min' 
  | 'max' 
  | 'count' 
  | 'distinct' 
  | 'median' 
  | 'stdDev'
  | 'variance'
  | 'percentile';

/**
 * 資料摘要
 */
export interface DataSummary {
  /** 總筆數 */
  totalRows: number;
  /** 篩選後筆數 */
  filteredRows?: number;
  /** 資料時間範圍 */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** 關鍵指標 */
  keyMetrics?: Record<string, number | string>;
  /** 資料品質分數 */
  qualityScore?: number;
}

// ============================================================================
// 2. AI 處理流程型別 (AI Processing Flow Types)
// ============================================================================

/**
 * 查詢處理器介面
 */
export interface QueryProcessor {
  /** 處理器 ID */
  id: string;
  /** 處理器名稱 */
  name: string;
  /** 處理器版本 */
  version: string;
  /** 處理查詢 */
  process(query: AIQuery): Promise<ProcessedQuery>;
  /** 驗證查詢 */
  validate(query: AIQuery): ValidationResult;
  /** 最佳化查詢 */
  optimize(query: ProcessedQuery): OptimizedQuery;
}

/**
 * 處理後的查詢
 */
export interface ProcessedQuery {
  /** 原始查詢 */
  originalQuery: AIQuery;
  /** 解析的意圖 */
  intent: QueryIntent;
  /** 生成的資料庫查詢 */
  databaseQueries: DatabaseQuery[];
  /** 執行計劃 */
  executionPlan: ExecutionPlan;
  /** 處理時間 */
  processingTime: number;
}

/**
 * 資料庫查詢
 */
export interface DatabaseQuery {
  /** 查詢類型 */
  type: 'firestore' | 'sql' | 'nosql' | 'api';
  /** Collection 或表名 */
  collection: string;
  /** 篩選條件 */
  filters: QueryFilter[];
  /** 排序 */
  orderBy?: OrderBy[];
  /** 限制數量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 聚合 */
  aggregations?: AggregationConfig[];
  /** 時間範圍 */
  timeRange?: TimeRange;
  /** 原始查詢（如 SQL） */
  rawQuery?: string;
}

/**
 * 查詢篩選器
 */
export interface QueryFilter {
  /** 欄位名稱 */
  field: string;
  /** 運算子 */
  operator: FilterOperator;
  /** 篩選值 */
  value: unknown;
  /** 邏輯運算子 */
  logicalOperator?: 'AND' | 'OR';
}

/**
 * 篩選運算子
 */
export type FilterOperator = 
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not-in'
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'ends-with'
  | 'between'
  | 'is-null'
  | 'is-not-null';

/**
 * 排序配置
 */
export interface OrderBy {
  /** 欄位名稱 */
  field: string;
  /** 排序方向 */
  direction: 'asc' | 'desc';
}

/**
 * 聚合配置
 */
export interface AggregationConfig {
  /** 聚合類型 */
  type: AggregationType;
  /** 目標欄位 */
  field: string;
  /** 別名 */
  alias?: string;
  /** 分組欄位 */
  groupBy?: string[];
  /** 篩選條件 */
  having?: QueryFilter;
}

/**
 * 時間範圍
 */
export interface TimeRange {
  /** 開始時間 */
  start: Date | string;
  /** 結束時間 */
  end: Date | string;
  /** 時間粒度 */
  granularity?: TimeGranularity;
  /** 時區 */
  timezone?: string;
}

/**
 * 時間粒度
 */
export type TimeGranularity = 
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

/**
 * 執行計劃
 */
export interface ExecutionPlan {
  /** 執行步驟 */
  steps: ExecutionStep[];
  /** 預估執行時間 */
  estimatedTime: number;
  /** 預估成本 */
  estimatedCost?: number;
  /** 平行執行 */
  parallel: boolean;
  /** 快取策略 */
  cacheStrategy?: CacheStrategy;
}

/**
 * 執行步驟
 */
export interface ExecutionStep {
  /** 步驟 ID */
  id: string;
  /** 步驟名稱 */
  name: string;
  /** 步驟類型 */
  type: 'query' | 'transform' | 'aggregate' | 'join' | 'cache';
  /** 相依步驟 */
  dependencies?: string[];
  /** 步驟配置 */
  config: Record<string, unknown>;
  /** 預估時間 */
  estimatedTime?: number;
}

/**
 * 最佳化後的查詢
 */
export interface OptimizedQuery extends ProcessedQuery {
  /** 最佳化建議 */
  optimizations: Optimization[];
  /** 效能改善預估 */
  performanceGain?: number;
  /** 成本節省預估 */
  costSaving?: number;
}

/**
 * 最佳化建議
 */
export interface Optimization {
  /** 最佳化類型 */
  type: 'index' | 'cache' | 'query-rewrite' | 'batch' | 'parallel';
  /** 描述 */
  description: string;
  /** 影響程度 */
  impact: 'low' | 'medium' | 'high';
  /** 是否已套用 */
  applied: boolean;
}

/**
 * 意圖識別結果
 */
export interface IntentRecognition {
  /** 識別的意圖 */
  intents: RecognizedIntent[];
  /** 實體列表 */
  entities: ExtractedEntity[];
  /** 情感分析 */
  sentiment?: SentimentAnalysis;
  /** 語言檢測 */
  language: string;
  /** 信心分數 */
  confidence: number;
}

/**
 * 識別的意圖
 */
export interface RecognizedIntent {
  /** 意圖名稱 */
  name: string;
  /** 信心分數 */
  confidence: number;
  /** 參數 */
  parameters?: Record<string, unknown>;
}

/**
 * 情感分析
 */
export interface SentimentAnalysis {
  /** 情感類型 */
  sentiment: 'positive' | 'neutral' | 'negative';
  /** 分數 (-1 到 1) */
  score: number;
  /** 情緒標籤 */
  emotions?: string[];
}

/**
 * 圖表推薦結果
 */
export interface ChartRecommendation {
  /** 主要推薦 */
  primary: RecommendedChart;
  /** 替代選項 */
  alternatives: RecommendedChart[];
  /** 推薦理由 */
  reasoning: string;
  /** 總體信心分數 */
  confidence: number;
}

/**
 * 推薦的圖表
 */
export interface RecommendedChart {
  /** 圖表類型 */
  type: ChartType;
  /** 適合度分數 */
  suitability: number;
  /** 配置建議 */
  config: ChartConfig;
  /** 優點 */
  pros: string[];
  /** 限制 */
  cons: string[];
}

/**
 * 回應格式化器
 */
export interface ResponseFormatter {
  /** 格式化類型 */
  type: 'json' | 'html' | 'markdown' | 'csv' | 'excel';
  /** 格式化回應 */
  format(result: QueryResult): FormattedResponse;
  /** 驗證格式 */
  validate(response: unknown): boolean;
}

/**
 * 格式化的回應
 */
export interface FormattedResponse {
  /** 格式類型 */
  format: string;
  /** 內容 */
  content: string | Buffer;
  /** MIME 類型 */
  mimeType: string;
  /** 檔案名稱（如果適用） */
  filename?: string;
  /** 大小（位元組） */
  size: number;
}

// ============================================================================
// 3. 對話式介面型別 (Conversational Interface Types)
// ============================================================================

/**
 * 對話記錄
 */
export interface Conversation {
  /** 對話 ID */
  id: string;
  /** 使用者 ID */
  userId: string;
  /** 對話標題 */
  title?: string;
  /** 訊息列表 */
  messages: Message[];
  /** 對話狀態 */
  state: ConversationState;
  /** 對話上下文 */
  context: ConversationContext;
  /** 開始時間 */
  startedAt: Date;
  /** 最後更新時間 */
  lastActivityAt: Date;
  /** 對話標籤 */
  tags?: string[];
  /** 是否已釘選 */
  isPinned?: boolean;
}

/**
 * 對話狀態
 */
export interface ConversationState {
  /** 狀態類型 */
  status: 'active' | 'idle' | 'completed' | 'archived';
  /** 當前查詢 */
  currentQuery?: AIQuery;
  /** 等待使用者輸入 */
  waitingForInput?: boolean;
  /** 處理中的任務 */
  processingTasks?: string[];
}

/**
 * 對話上下文
 */
export interface ConversationContext {
  /** 提到的實體 */
  entities: Map<string, ExtractedEntity>;
  /** 變數儲存 */
  variables: Map<string, unknown>;
  /** 查詢歷史 */
  queryHistory: string[];
  /** 當前主題 */
  currentTopic?: string;
  /** 使用者偏好 */
  preferences?: Record<string, unknown>;
}

/**
 * 訊息
 */
export interface Message {
  /** 訊息 ID */
  id: string;
  /** 對話 ID */
  conversationId: string;
  /** 訊息類型 */
  type: MessageType;
  /** 發送者 */
  sender: MessageSender;
  /** 訊息內容 */
  content: MessageContent;
  /** 時間戳記 */
  timestamp: Date;
  /** 訊息狀態 */
  status: MessageStatus;
  /** 相關查詢 ID */
  queryId?: string;
  /** 附件 */
  attachments?: Attachment[];
  /** 反應 */
  reactions?: Reaction[];
  /** 是否已編輯 */
  isEdited?: boolean;
  /** 編輯時間 */
  editedAt?: Date;
}

/**
 * 訊息類型
 */
export type MessageType = 
  | 'user_query'      // 使用者查詢
  | 'ai_response'     // AI 回應
  | 'chart_result'    // 圖表結果
  | 'error'           // 錯誤訊息
  | 'suggestion'      // 建議
  | 'clarification'   // 澄清請求
  | 'system'          // 系統訊息
  | 'feedback';       // 回饋

/**
 * 訊息發送者
 */
export interface MessageSender {
  /** 類型 */
  type: 'user' | 'ai' | 'system';
  /** ID */
  id: string;
  /** 名稱 */
  name: string;
  /** 頭像 */
  avatar?: string;
}

/**
 * 訊息內容
 */
export interface MessageContent {
  /** 文字內容 */
  text?: string;
  /** 格式化內容 */
  formatted?: FormattedContent;
  /** 圖表資料 */
  chart?: ChartData;
  /** 表格資料 */
  table?: TableData;
  /** 程式碼 */
  code?: CodeContent;
  /** 動作按鈕 */
  actions?: MessageAction[];
  /** 元資料 */
  metadata?: Record<string, unknown>;
}

/**
 * 格式化內容
 */
export interface FormattedContent {
  /** 格式類型 */
  type: 'markdown' | 'html' | 'plain';
  /** 內容 */
  value: string;
}

/**
 * 圖表資料
 */
export interface ChartData {
  /** 圖表類型 */
  type: ChartType;
  /** 資料 */
  data: unknown;
  /** 配置 */
  config: ChartConfig;
  /** 互動設定 */
  interactive?: boolean;
}

/**
 * 表格資料
 */
export interface TableData {
  /** 欄位 */
  columns: ColumnDefinition[];
  /** 資料列 */
  rows: DataRow[];
  /** 分頁資訊 */
  pagination?: PaginationInfo;
  /** 可排序 */
  sortable?: boolean;
  /** 可篩選 */
  filterable?: boolean;
}

/**
 * 程式碼內容
 */
export interface CodeContent {
  /** 語言 */
  language: string;
  /** 程式碼 */
  code: string;
  /** 是否可執行 */
  executable?: boolean;
}

/**
 * 訊息動作
 */
export interface MessageAction {
  /** 動作 ID */
  id: string;
  /** 動作類型 */
  type: 'button' | 'link' | 'copy' | 'download' | 'share';
  /** 標籤 */
  label: string;
  /** 圖示 */
  icon?: string;
  /** 動作處理 */
  action: string | (() => void);
  /** 樣式 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * 訊息狀態
 */
export type MessageStatus = 
  | 'sending'    // 發送中
  | 'sent'       // 已發送
  | 'delivered'  // 已送達
  | 'read'       // 已讀
  | 'failed';    // 失敗

/**
 * 附件
 */
export interface Attachment {
  /** 附件 ID */
  id: string;
  /** 檔案名稱 */
  filename: string;
  /** MIME 類型 */
  mimeType: string;
  /** 大小（位元組） */
  size: number;
  /** URL */
  url: string;
  /** 縮圖 URL */
  thumbnailUrl?: string;
}

/**
 * 反應
 */
export interface Reaction {
  /** 反應類型 */
  type: string;
  /** 使用者 ID */
  userId: string;
  /** 時間 */
  timestamp: Date;
}

/**
 * 對話狀態管理
 */
export interface ChatState {
  /** 當前對話 */
  currentConversation: Conversation | null;
  /** 對話列表 */
  conversations: Conversation[];
  /** 載入狀態 */
  isLoading: boolean;
  /** 錯誤狀態 */
  error: Error | null;
  /** 輸入狀態 */
  inputState: InputState;
  /** 建議列表 */
  suggestions: QuerySuggestion[];
  /** 是否顯示歷史 */
  showHistory: boolean;
  /** 選中的訊息 */
  selectedMessage: Message | null;
}

/**
 * 輸入狀態
 */
export interface InputState {
  /** 輸入值 */
  value: string;
  /** 是否正在輸入 */
  isTyping: boolean;
  /** 是否正在錄音 */
  isRecording: boolean;
  /** 語音輸入狀態 */
  voiceInputState?: VoiceInputState;
  /** 輸入模式 */
  mode: 'text' | 'voice';
}

/**
 * 語音輸入狀態
 */
export interface VoiceInputState {
  /** 狀態 */
  status: 'idle' | 'listening' | 'processing' | 'error';
  /** 音量等級 */
  volumeLevel: number;
  /** 轉錄文字 */
  transcript?: string;
  /** 語言 */
  language: string;
}

/**
 * 查詢建議
 */
export interface QuerySuggestion {
  /** 建議 ID */
  id: string;
  /** 建議文字 */
  text: string;
  /** 建議類型 */
  type: SuggestionType;
  /** 類別 */
  category?: string;
  /** 圖示 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 相關性分數 */
  relevance?: number;
  /** 使用次數 */
  usageCount?: number;
  /** 最後使用時間 */
  lastUsed?: Date;
  /** 標籤 */
  tags?: string[];
}

/**
 * 建議類型
 */
export type SuggestionType = 
  | 'recent'       // 最近查詢
  | 'popular'      // 熱門查詢
  | 'contextual'   // 上下文相關
  | 'template'     // 查詢範本
  | 'seasonal'     // 季節性建議
  | 'personal'     // 個人化建議
  | 'trending';    // 趨勢查詢

// ============================================================================
// 4. 整合型別 (Integration Types)
// ============================================================================

/**
 * Dashboard 整合配置
 */
export interface DashboardIntegration {
  /** 整合模式 */
  mode: 'embedded' | 'modal' | 'sidebar' | 'fullscreen';
  /** 位置配置 */
  position?: {
    x?: number;
    y?: number;
    width?: number | string;
    height?: number | string;
  };
  /** 資料同步 */
  dataSync: {
    /** 共享資料上下文 */
    shareContext: boolean;
    /** 繼承篩選器 */
    inheritFilters: boolean;
    /** 雙向綁定 */
    twoWayBinding: boolean;
  };
  /** 互動設定 */
  interactions: {
    /** 拖放支援 */
    dragAndDrop: boolean;
    /** 右鍵選單 */
    contextMenu: boolean;
    /** 快速操作 */
    quickActions: string[];
  };
  /** 樣式配置 */
  styling: {
    /** 主題 */
    theme: 'inherit' | 'light' | 'dark' | 'custom';
    /** 自訂樣式 */
    customStyles?: Record<string, string>;
  };
}

/**
 * 小工具資料
 */
export interface WidgetData {
  /** 小工具 ID */
  id: string;
  /** 小工具類型 */
  type: 'ai-query' | 'chart' | 'metric' | 'table' | 'custom';
  /** 標題 */
  title: string;
  /** 查詢配置 */
  queryConfig?: AIQuery;
  /** 資料 */
  data?: unknown;
  /** 配置 */
  config: WidgetConfig;
  /** 狀態 */
  state: WidgetState;
  /** 最後更新時間 */
  lastUpdated: Date;
}

/**
 * 小工具配置
 */
export interface WidgetConfig {
  /** 大小 */
  size: 'small' | 'medium' | 'large' | 'custom';
  /** 更新頻率 */
  refreshInterval?: number;
  /** 是否可調整大小 */
  resizable?: boolean;
  /** 是否可移動 */
  draggable?: boolean;
  /** 是否可摺疊 */
  collapsible?: boolean;
  /** 自訂配置 */
  custom?: Record<string, unknown>;
}

/**
 * 小工具狀態
 */
export interface WidgetState {
  /** 載入中 */
  isLoading: boolean;
  /** 錯誤 */
  error?: Error;
  /** 是否展開 */
  isExpanded: boolean;
  /** 是否可見 */
  isVisible: boolean;
  /** 是否選中 */
  isSelected: boolean;
}

/**
 * 篩選器配置
 */
export interface FilterConfig {
  /** 篩選器 ID */
  id: string;
  /** 篩選器名稱 */
  name: string;
  /** 欄位 */
  field: string;
  /** 運算子 */
  operator: FilterOperator;
  /** 值 */
  value: unknown;
  /** 是否啟用 */
  enabled: boolean;
  /** 是否可編輯 */
  editable?: boolean;
  /** 優先順序 */
  priority?: number;
}

/**
 * 匯出選項
 */
export interface ExportOptions {
  /** 格式 */
  format: ExportFormat;
  /** 包含的內容 */
  include: {
    /** 資料 */
    data: boolean;
    /** 圖表 */
    charts: boolean;
    /** AI 解釋 */
    explanations: boolean;
    /** 元資料 */
    metadata: boolean;
  };
  /** 檔案名稱 */
  filename?: string;
  /** 壓縮 */
  compress?: boolean;
  /** 加密 */
  encrypt?: boolean;
  /** 密碼 */
  password?: string;
}

/**
 * 匯出格式
 */
export type ExportFormat = 
  | 'json'
  | 'csv'
  | 'excel'
  | 'pdf'
  | 'png'
  | 'svg'
  | 'html';

// ============================================================================
// 5. 錯誤處理型別 (Error Handling Types)
// ============================================================================

/**
 * AI 錯誤基礎類別
 */
export class AIError extends Error {
  /** 錯誤代碼 */
  code: string;
  /** 錯誤類型 */
  type: AIErrorType;
  /** 詳細資訊 */
  details?: Record<string, unknown>;
  /** 建議解決方案 */
  suggestions?: string[];
  /** 是否可重試 */
  retryable: boolean;
  /** 時間戳記 */
  timestamp: Date;

  constructor(
    message: string,
    code: string,
    type: AIErrorType,
    retryable = false
  ) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.type = type;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

/**
 * AI 錯誤類型
 */
export type AIErrorType = 
  | 'query_parse_error'      // 查詢解析錯誤
  | 'intent_recognition_error' // 意圖識別錯誤
  | 'data_access_error'       // 資料存取錯誤
  | 'ai_service_error'        // AI 服務錯誤
  | 'rate_limit_error'        // 速率限制錯誤
  | 'timeout_error'           // 逾時錯誤
  | 'permission_error'        // 權限錯誤
  | 'validation_error'        // 驗證錯誤
  | 'network_error';          // 網路錯誤

/**
 * 驗證錯誤
 */
export class ValidationError extends AIError {
  /** 驗證失敗的欄位 */
  fields?: ValidationField[];

  constructor(
    message: string,
    fields?: ValidationField[]
  ) {
    super(message, 'VALIDATION_ERROR', 'validation_error', false);
    this.fields = fields;
  }
}

/**
 * 驗證欄位
 */
export interface ValidationField {
  /** 欄位名稱 */
  field: string;
  /** 錯誤訊息 */
  message: string;
  /** 期望值 */
  expected?: unknown;
  /** 實際值 */
  actual?: unknown;
}

/**
 * 網路錯誤
 */
export class NetworkError extends AIError {
  /** HTTP 狀態碼 */
  statusCode?: number;
  /** 回應內容 */
  response?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    response?: unknown
  ) {
    super(message, 'NETWORK_ERROR', 'network_error', true);
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * 查詢錯誤
 */
export interface QueryError {
  /** 錯誤類型 */
  type: AIErrorType;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤代碼 */
  code: string;
  /** 詳細資訊 */
  details?: Record<string, unknown>;
  /** 堆疊追蹤 */
  stack?: string;
  /** 發生時間 */
  timestamp: Date;
}

/**
 * 錯誤恢復機制
 */
export interface ErrorRecovery {
  /** 恢復策略 */
  strategy: RecoveryStrategy;
  /** 重試配置 */
  retryConfig?: RetryConfig;
  /** 降級選項 */
  fallbackOptions?: FallbackOptions;
  /** 錯誤處理器 */
  errorHandler?: (error: AIError) => void;
}

/**
 * 恢復策略
 */
export type RecoveryStrategy = 
  | 'retry'        // 重試
  | 'fallback'     // 降級
  | 'cache'        // 使用快取
  | 'default'      // 使用預設值
  | 'manual';      // 手動介入

/**
 * 重試配置
 */
export interface RetryConfig {
  /** 最大重試次數 */
  maxAttempts: number;
  /** 初始延遲（毫秒） */
  initialDelay: number;
  /** 最大延遲（毫秒） */
  maxDelay: number;
  /** 退避乘數 */
  backoffMultiplier: number;
  /** 重試條件 */
  retryCondition?: (error: AIError) => boolean;
}

/**
 * 降級選項
 */
export interface FallbackOptions {
  /** 使用快取 */
  useCache?: boolean;
  /** 使用預設值 */
  useDefault?: unknown;
  /** 降級服務 */
  fallbackService?: string;
  /** 簡化查詢 */
  simplifyQuery?: boolean;
}

// ============================================================================
// 6. 權限和安全型別 (Permission and Security Types)
// ============================================================================

/**
 * 查詢權限
 */
export interface QueryPermission {
  /** 權限 ID */
  id: string;
  /** 使用者 ID */
  userId: string;
  /** 權限等級 */
  level: PermissionLevel;
  /** 允許的查詢類型 */
  allowedQueryTypes: IntentType[];
  /** 允許的資料來源 */
  allowedDataSources: DataSourceType[];
  /** 資料範圍限制 */
  dataScope: DataScope;
  /** 時間範圍限制 */
  timeRestriction?: TimeRestriction;
  /** 每日查詢限制 */
  dailyQueryLimit?: number;
  /** AI 功能權限 */
  aiFeatures: AIFeaturePermissions;
}

/**
 * 權限等級
 */
export type PermissionLevel = 
  | 'admin'      // 管理員
  | 'power_user' // 進階使用者
  | 'user'       // 一般使用者
  | 'viewer'     // 檢視者
  | 'guest';     // 訪客

/**
 * 資料範圍
 */
export interface DataScope {
  /** 組織範圍 */
  organizationScope: 'all' | 'own' | 'specified';
  /** 指定的組織 ID */
  organizationIds?: string[];
  /** 團隊範圍 */
  teamScope: 'all' | 'own' | 'specified';
  /** 指定的團隊 ID */
  teamIds?: string[];
  /** 使用者範圍 */
  userScope: 'all' | 'own' | 'team' | 'specified';
  /** 指定的使用者 ID */
  userIds?: string[];
}

/**
 * 時間限制
 */
export interface TimeRestriction {
  /** 最大歷史天數 */
  maxHistoricalDays?: number;
  /** 允許預測 */
  allowPrediction?: boolean;
  /** 最大預測天數 */
  maxPredictionDays?: number;
  /** 限制時段 */
  allowedTimeRanges?: TimeRange[];
}

/**
 * AI 功能權限
 */
export interface AIFeaturePermissions {
  /** 自然語言查詢 */
  naturalLanguageQuery: boolean;
  /** 語音輸入 */
  voiceInput: boolean;
  /** AI 洞察 */
  aiInsights: boolean;
  /** 預測分析 */
  predictiveAnalytics: boolean;
  /** 異常檢測 */
  anomalyDetection: boolean;
  /** 自動建議 */
  autoSuggestions: boolean;
  /** 匯出功能 */
  exportResults: boolean;
  /** 分享功能 */
  shareResults: boolean;
}

/**
 * 資料存取權限
 */
export interface DataAccess {
  /** 可存取的 Collections */
  collections: CollectionAccess[];
  /** 欄位層級權限 */
  fieldPermissions: FieldPermission[];
  /** 列層級安全 */
  rowLevelSecurity?: RowLevelSecurity;
  /** 資料遮罩規則 */
  maskingRules?: MaskingRule[];
}

/**
 * Collection 存取權限
 */
export interface CollectionAccess {
  /** Collection 名稱 */
  name: string;
  /** 存取等級 */
  access: 'read' | 'write' | 'none';
  /** 條件 */
  conditions?: QueryFilter[];
}

/**
 * 欄位權限
 */
export interface FieldPermission {
  /** Collection 名稱 */
  collection: string;
  /** 欄位名稱 */
  field: string;
  /** 存取等級 */
  access: 'read' | 'write' | 'none';
  /** 是否遮罩 */
  masked?: boolean;
}

/**
 * 列層級安全
 */
export interface RowLevelSecurity {
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
  condition: QueryFilter;
  /** 優先順序 */
  priority: number;
}

/**
 * 遮罩規則
 */
export interface MaskingRule {
  /** 欄位 */
  field: string;
  /** 遮罩類型 */
  type: 'full' | 'partial' | 'hash' | 'encrypt';
  /** 遮罩模式 */
  pattern?: string;
}

/**
 * 使用者上下文
 */
export interface UserContext {
  /** 使用者 ID */
  userId: string;
  /** 組織 ID */
  organizationId: string;
  /** 角色 */
  roles: string[];
  /** 權限 */
  permissions: QueryPermission;
  /** 偏好設定 */
  preferences: UserAnalyticsPreferences;
  /** Session 資訊 */
  session: SessionInfo;
  /** 地理位置 */
  location?: GeoLocation;
}

/**
 * Session 資訊
 */
export interface SessionInfo {
  /** Session ID */
  sessionId: string;
  /** IP 位址 */
  ipAddress: string;
  /** User Agent */
  userAgent: string;
  /** 開始時間 */
  startedAt: Date;
  /** 最後活動時間 */
  lastActivityAt: Date;
}

/**
 * 地理位置
 */
export interface GeoLocation {
  /** 國家 */
  country: string;
  /** 地區 */
  region?: string;
  /** 城市 */
  city?: string;
  /** 經度 */
  longitude?: number;
  /** 緯度 */
  latitude?: number;
}

/**
 * 安全策略
 */
export interface SecurityPolicy {
  /** 策略 ID */
  id: string;
  /** 策略名稱 */
  name: string;
  /** 策略規則 */
  rules: PolicyRule[];
  /** 啟用狀態 */
  enabled: boolean;
  /** 優先順序 */
  priority: number;
  /** 套用範圍 */
  scope: PolicyScope;
}

/**
 * 策略規則
 */
export interface PolicyRule {
  /** 規則類型 */
  type: 'allow' | 'deny' | 'require' | 'limit';
  /** 資源 */
  resource: string;
  /** 動作 */
  actions: string[];
  /** 條件 */
  conditions?: PolicyCondition[];
}

/**
 * 策略條件
 */
export interface PolicyCondition {
  /** 屬性 */
  attribute: string;
  /** 運算子 */
  operator: string;
  /** 值 */
  value: unknown;
}

/**
 * 策略範圍
 */
export interface PolicyScope {
  /** 使用者 */
  users?: string[];
  /** 群組 */
  groups?: string[];
  /** 角色 */
  roles?: string[];
  /** 組織 */
  organizations?: string[];
}

// ============================================================================
// 7. 效能監控型別 (Performance Monitoring Types)
// ============================================================================

/**
 * 查詢指標
 */
export interface QueryMetrics {
  /** 查詢 ID */
  queryId: string;
  /** 總執行時間 */
  totalTime: number;
  /** 各階段時間 */
  phases: PhaseMetrics[];
  /** 資源使用 */
  resourceUsage: ResourceUsage;
  /** 快取統計 */
  cacheStats: CacheStats;
  /** 錯誤統計 */
  errorStats?: ErrorStats;
}

/**
 * 階段指標
 */
export interface PhaseMetrics {
  /** 階段名稱 */
  name: string;
  /** 開始時間 */
  startTime: Date;
  /** 結束時間 */
  endTime: Date;
  /** 持續時間 */
  duration: number;
  /** 狀態 */
  status: 'success' | 'failed' | 'skipped';
}

/**
 * 資源使用
 */
export interface ResourceUsage {
  /** CPU 使用率 */
  cpuUsage?: number;
  /** 記憶體使用 */
  memoryUsage?: number;
  /** 網路流量 */
  networkBytes?: number;
  /** API 呼叫次數 */
  apiCalls?: number;
  /** 資料庫查詢次數 */
  dbQueries?: number;
}

/**
 * 快取統計
 */
export interface CacheStats {
  /** 命中次數 */
  hits: number;
  /** 未命中次數 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 快取大小 */
  cacheSize?: number;
  /** 過期項目 */
  expiredItems?: number;
}

/**
 * 錯誤統計
 */
export interface ErrorStats {
  /** 錯誤總數 */
  totalErrors: number;
  /** 錯誤類型分布 */
  errorTypes: Record<string, number>;
  /** 最近錯誤 */
  recentErrors: QueryError[];
}

/**
 * AI 效能指標
 */
export interface AIPerformance {
  /** 模型名稱 */
  model: string;
  /** 回應時間 */
  responseTime: number;
  /** Token 使用 */
  tokenUsage: TokenUsage;
  /** 準確度指標 */
  accuracy?: AccuracyMetrics;
  /** 成本 */
  cost?: number;
}

/**
 * Token 使用
 */
export interface TokenUsage {
  /** 輸入 Token */
  inputTokens: number;
  /** 輸出 Token */
  outputTokens: number;
  /** 總 Token */
  totalTokens: number;
  /** Token 限制 */
  tokenLimit?: number;
}

/**
 * 準確度指標
 */
export interface AccuracyMetrics {
  /** 意圖識別準確率 */
  intentAccuracy?: number;
  /** 實體提取準確率 */
  entityAccuracy?: number;
  /** 整體準確率 */
  overallAccuracy?: number;
  /** 信心分數 */
  confidenceScore?: number;
}

/**
 * 快取配置
 */
export interface CacheConfig {
  /** 快取策略 */
  strategy: CacheStrategy;
  /** TTL（秒） */
  ttl: number;
  /** 最大大小 */
  maxSize?: number;
  /** 最大項目數 */
  maxItems?: number;
  /** 清理策略 */
  evictionPolicy?: 'LRU' | 'LFU' | 'FIFO';
  /** 壓縮 */
  compression?: boolean;
}

/**
 * 快取策略
 */
export type CacheStrategy = 
  | 'aggressive'   // 積極快取
  | 'normal'       // 一般快取
  | 'conservative' // 保守快取
  | 'disabled';    // 停用快取

/**
 * 快取資訊
 */
export interface CacheInfo {
  /** 是否來自快取 */
  cached: boolean;
  /** 快取鍵 */
  cacheKey?: string;
  /** 快取時間 */
  cachedAt?: Date;
  /** 過期時間 */
  expiresAt?: Date;
  /** 快取來源 */
  cacheSource?: 'memory' | 'redis' | 'disk';
}

/**
 * 流量限制配置
 */
export interface RateLimiting {
  /** 限制類型 */
  type: 'user' | 'organization' | 'global';
  /** 限制值 */
  limit: number;
  /** 時間窗口（秒） */
  window: number;
  /** 超限策略 */
  strategy: 'reject' | 'queue' | 'throttle';
  /** 優先順序 */
  priority?: number;
  /** 豁免條件 */
  exemptions?: string[];
}

// ============================================================================
// 8. 輔助型別和工具 (Helper Types and Utilities)
// ============================================================================

/**
 * 圖表類型
 */
export type ChartType = 
  | 'line'         // 線圖
  | 'bar'          // 長條圖
  | 'pie'          // 圓餅圖
  | 'scatter'      // 散佈圖
  | 'heatmap'      // 熱力圖
  | 'funnel'       // 漏斗圖
  | 'gauge'        // 儀表圖
  | 'radar'        // 雷達圖
  | 'treemap'      // 樹狀圖
  | 'sankey'       // 桑基圖
  | 'candlestick'  // K線圖
  | 'table'        // 表格
  | 'metric'       // 指標卡
  | 'map'          // 地圖
  | 'custom';      // 自訂

/**
 * 圖表配置
 */
export interface ChartConfig {
  /** 圖表類型 */
  type: ChartType;
  /** 標題 */
  title?: string;
  /** 副標題 */
  subtitle?: string;
  /** 資料綁定 */
  dataBinding: DataBinding;
  /** 樣式設定 */
  styling?: ChartStyling;
  /** 互動設定 */
  interactions?: ChartInteractions;
  /** 動畫設定 */
  animations?: AnimationConfig;
  /** 自訂配置 */
  custom?: Record<string, unknown>;
}

/**
 * 資料綁定
 */
export interface DataBinding {
  /** X 軸 */
  xAxis?: AxisBinding;
  /** Y 軸 */
  yAxis?: AxisBinding | AxisBinding[];
  /** 顏色維度 */
  color?: string;
  /** 大小維度 */
  size?: string;
  /** 分組 */
  groupBy?: string;
  /** 系列 */
  series?: SeriesBinding[];
}

/**
 * 軸綁定
 */
export interface AxisBinding {
  /** 欄位 */
  field: string;
  /** 標籤 */
  label?: string;
  /** 格式 */
  format?: string;
  /** 類型 */
  type?: 'value' | 'category' | 'time' | 'log';
  /** 刻度配置 */
  scale?: ScaleConfig;
}

/**
 * 刻度配置
 */
export interface ScaleConfig {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 刻度間隔 */
  interval?: number;
  /** 是否從零開始 */
  beginAtZero?: boolean;
  /** 對數底數 */
  logBase?: number;
}

/**
 * 系列綁定
 */
export interface SeriesBinding {
  /** 名稱 */
  name: string;
  /** 資料欄位 */
  dataField: string;
  /** 類型 */
  type?: string;
  /** 顏色 */
  color?: string;
  /** 樣式 */
  style?: Record<string, unknown>;
}

/**
 * 圖表樣式
 */
export interface ChartStyling {
  /** 顏色主題 */
  colorScheme?: string[];
  /** 主題 */
  theme?: 'light' | 'dark' | 'auto';
  /** 網格 */
  grid?: boolean;
  /** 圖例 */
  legend?: LegendConfig;
  /** 提示框 */
  tooltip?: TooltipConfig;
  /** 字體 */
  font?: FontConfig;
  /** 邊距 */
  margin?: MarginConfig;
}

/**
 * 圖例配置
 */
export interface LegendConfig {
  /** 顯示 */
  show: boolean;
  /** 位置 */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** 對齊 */
  align?: 'start' | 'center' | 'end';
  /** 排列 */
  orient?: 'horizontal' | 'vertical';
}

/**
 * 提示框配置
 */
export interface TooltipConfig {
  /** 顯示 */
  show: boolean;
  /** 觸發方式 */
  trigger?: 'hover' | 'click';
  /** 格式化器 */
  formatter?: string | ((params: unknown) => string);
}

/**
 * 字體配置
 */
export interface FontConfig {
  /** 字體家族 */
  family?: string;
  /** 大小 */
  size?: number;
  /** 粗細 */
  weight?: string | number;
  /** 顏色 */
  color?: string;
}

/**
 * 邊距配置
 */
export interface MarginConfig {
  /** 上 */
  top?: number;
  /** 右 */
  right?: number;
  /** 下 */
  bottom?: number;
  /** 左 */
  left?: number;
}

/**
 * 圖表互動
 */
export interface ChartInteractions {
  /** 縮放 */
  zoom?: boolean;
  /** 平移 */
  pan?: boolean;
  /** 框選 */
  brush?: boolean;
  /** 點擊事件 */
  onClick?: (params: unknown) => void;
  /** 懸停事件 */
  onHover?: (params: unknown) => void;
  /** 右鍵選單 */
  contextMenu?: boolean;
  /** 匯出 */
  export?: boolean;
}

/**
 * 動畫配置
 */
export interface AnimationConfig {
  /** 啟用 */
  enabled: boolean;
  /** 持續時間 */
  duration?: number;
  /** 緩動函數 */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** 延遲 */
  delay?: number;
}

/**
 * 資料來源類型
 */
export type DataSourceType = 
  | 'firestore'
  | 'realtime_db'
  | 'bigquery'
  | 'api'
  | 'cache'
  | 'local';

/**
 * 資料來源
 */
export interface DataSource {
  /** 類型 */
  type: DataSourceType;
  /** 名稱 */
  name: string;
  /** 連線資訊 */
  connection?: ConnectionInfo;
  /** 最後更新時間 */
  lastUpdated?: Date;
  /** 資料品質 */
  quality?: DataQuality;
}

/**
 * 連線資訊
 */
export interface ConnectionInfo {
  /** 端點 */
  endpoint?: string;
  /** 認證 */
  auth?: AuthInfo;
  /** 逾時 */
  timeout?: number;
  /** 重試 */
  retry?: RetryConfig;
}

/**
 * 認證資訊
 */
export interface AuthInfo {
  /** 類型 */
  type: 'api_key' | 'oauth' | 'basic' | 'bearer';
  /** 憑證 */
  credentials?: Record<string, string>;
}

/**
 * 資料品質
 */
export interface DataQuality {
  /** 完整性 */
  completeness?: number;
  /** 準確性 */
  accuracy?: number;
  /** 一致性 */
  consistency?: number;
  /** 時效性 */
  timeliness?: number;
  /** 總分 */
  overall?: number;
}

/**
 * 分頁資訊
 */
export interface PaginationInfo {
  /** 當前頁 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總頁數 */
  totalPages: number;
  /** 總筆數 */
  totalItems: number;
  /** 是否有下一頁 */
  hasNext: boolean;
  /** 是否有上一頁 */
  hasPrevious: boolean;
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 錯誤 */
  errors?: ValidationError[];
  /** 警告 */
  warnings?: ValidationWarning[];
}

/**
 * 驗證警告
 */
export interface ValidationWarning {
  /** 欄位 */
  field?: string;
  /** 訊息 */
  message: string;
  /** 嚴重程度 */
  severity: 'low' | 'medium' | 'high';
}

/**
 * 使用者分析偏好
 */
export interface UserAnalyticsPreferences {
  /** 預設時間範圍 */
  defaultTimeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  /** 偏好圖表類型 */
  preferredChartTypes: ChartType[];
  /** 自動更新 */
  autoRefresh: boolean;
  /** 更新間隔 */
  refreshInterval?: number;
  /** 語音輸入啟用 */
  voiceInputEnabled: boolean;
  /** 語言 */
  language: string;
  /** 時區 */
  timezone: string;
  /** 日期格式 */
  dateFormat: string;
  /** 數字格式 */
  numberFormat: string;
  /** 貨幣 */
  currency: string;
  /** 主題 */
  theme: 'light' | 'dark' | 'auto';
  /** 通知設定 */
  notifications: NotificationPreferences;
}

/**
 * 通知偏好
 */
export interface NotificationPreferences {
  /** 查詢完成通知 */
  queryComplete: boolean;
  /** 錯誤通知 */
  errors: boolean;
  /** 洞察通知 */
  insights: boolean;
  /** 異常警報 */
  anomalies: boolean;
  /** 通知方式 */
  channels: ('email' | 'push' | 'in-app')[];
}

/**
 * AI 解釋
 */
export interface AIExplanation {
  /** 摘要 */
  summary: string;
  /** 關鍵發現 */
  keyFindings: string[];
  /** 洞察 */
  insights: AIInsight[];
  /** 建議行動 */
  recommendations: string[];
  /** 注意事項 */
  caveats?: string[];
  /** 信心等級 */
  confidence: 'low' | 'medium' | 'high';
}

/**
 * AI 洞察
 */
export interface AIInsight {
  /** 洞察 ID */
  id: string;
  /** 類型 */
  type: InsightType;
  /** 標題 */
  title: string;
  /** 描述 */
  description: string;
  /** 重要性 */
  importance: InsightImportance;
  /** 相關資料 */
  relatedData?: unknown;
  /** 建議動作 */
  suggestedActions?: string[];
}

/**
 * 洞察類型
 */
export type InsightType = 
  | 'trend'        // 趨勢
  | 'anomaly'      // 異常
  | 'correlation'  // 相關性
  | 'prediction'   // 預測
  | 'comparison'   // 比較
  | 'pattern';     // 模式

/**
 * 洞察重要性
 */
export type InsightImportance = 'low' | 'medium' | 'high' | 'critical';

/**
 * 查詢元資料
 */
export interface QueryMetadata {
  /** 執行時間 */
  executionTime: number;
  /** 資料筆數 */
  rowCount: number;
  /** 資料來源 */
  dataSources: string[];
  /** 最後更新 */
  lastUpdated: Date;
  /** 查詢版本 */
  version?: string;
  /** 執行環境 */
  environment?: string;
  /** 追蹤 ID */
  traceId?: string;
}

// ============================================================================
// 9. 型別守衛 (Type Guards)
// ============================================================================

/**
 * 檢查是否為 AI 查詢
 */
export function isAIQuery(obj: unknown): obj is AIQuery {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'query' in obj &&
    'userId' in obj &&
    'status' in obj
  );
}

/**
 * 檢查是否為查詢結果
 */
export function isQueryResult(obj: unknown): obj is QueryResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'queryId' in obj &&
    'status' in obj &&
    'data' in obj &&
    'metadata' in obj
  );
}

/**
 * 檢查是否為 AI 錯誤
 */
export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

/**
 * 檢查是否為驗證錯誤
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * 檢查是否為網路錯誤
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

// ============================================================================
// 10. 常數定義 (Constants)
// ============================================================================

/**
 * 預設查詢選項
 */
export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  realtime: false,
  useCache: true,
  timeout: 30000,
  limit: 100,
  includeExplanation: true,
  includeSuggestions: true,
  accuracy: 'medium',
};

/**
 * 預設重試配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * 預設快取配置
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  strategy: 'normal',
  ttl: 300, // 5 分鐘
  maxSize: 100 * 1024 * 1024, // 100MB
  maxItems: 1000,
  evictionPolicy: 'LRU',
  compression: true,
};

/**
 * 查詢複雜度閾值
 */
export const COMPLEXITY_THRESHOLDS = {
  simple: {
    maxEntities: 3,
    maxFilters: 2,
    maxAggregations: 1,
  },
  moderate: {
    maxEntities: 6,
    maxFilters: 5,
    maxAggregations: 3,
  },
  complex: {
    maxEntities: Infinity,
    maxFilters: Infinity,
    maxAggregations: Infinity,
  },
} as const;

/**
 * AI 模型配置
 */
export const AI_MODEL_CONFIG = {
  'claude-3.5-sonnet': {
    maxTokens: 4096,
    temperature: 0.7,
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  'gpt-4o': {
    maxTokens: 4096,
    temperature: 0.7,
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
} as const;

// ============================================================================
// 匯出所有型別 (Export All Types)
// ============================================================================

export type {
  // 重新匯出所有介面和型別
  // 這樣可以確保所有型別都能被正確引用
};