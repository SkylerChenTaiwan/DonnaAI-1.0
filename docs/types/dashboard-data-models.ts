/**
 * PRP-123: Dashboard Page with Analytics Integration
 * 儀表板頁面完整型別定義與資料模型
 * 
 * 此檔案提供儀表板功能的所有型別定義，包括：
 * - 核心資料模型
 * - API 介面型別
 * - 前端元件型別
 * - Firebase 整合型別
 * - AI 查詢型別
 * 
 * @version 1.0.0
 * @date 2025-08-18
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { RecordDoc, RecordType, RecordStatus } from '@/types/record';
import type { CustomerDoc } from '@/types/firebase';
import type { User, UserRole, Team, Organization } from '@/types/entities';

/* ============================================
   1. 核心資料模型
   ============================================ */

/**
 * 儀表板主要資料結構
 */
export interface DashboardData {
  /** 儀表板唯一識別碼 */
  id: string;
  /** 組織 ID */
  organizationId: string;
  /** 團隊 ID (可選，用於團隊層級儀表板) */
  teamId?: string;
  /** 使用者 ID (可選，用於個人儀表板) */
  userId?: string;
  /** 儀表板標題 */
  title: string;
  /** 儀表板描述 */
  description?: string;
  /** 關鍵指標資料 */
  metrics: DashboardMetrics;
  /** 圖表資料集合 */
  charts: ChartDataCollection;
  /** 團隊狀態資訊 */
  teamStatus: TeamStatusOverview;
  /** AI 分析洞察 */
  aiInsights?: AIInsight[];
  /** 快速操作連結 */
  quickActions: QuickAction[];
  /** 更新時間戳記 */
  lastUpdated: Timestamp;
  /** 資料新鮮度 (秒) */
  dataFreshness: number;
  /** 使用者偏好設定 */
  userPreferences?: DashboardPreferences;
}

/**
 * 業務指標和 KPI 型別
 */
export interface DashboardMetrics {
  /** 營收指標 */
  revenue: RevenueMetrics;
  /** 客戶指標 */
  customers: CustomerMetrics;
  /** 任務指標 */
  tasks: TaskMetrics;
  /** 會議指標 */
  meetings: MeetingMetrics;
  /** 團隊績效指標 */
  performance: PerformanceMetrics;
  /** 自訂指標 */
  customMetrics?: CustomMetric[];
}

/**
 * 營收相關指標
 */
export interface RevenueMetrics {
  /** 本月收入 */
  currentMonthRevenue: number;
  /** 上月收入 (用於比較) */
  previousMonthRevenue: number;
  /** 成長率 (百分比) */
  growthRate: number;
  /** 本季收入 */
  quarterRevenue: number;
  /** 年度收入 */
  yearRevenue: number;
  /** 目標達成率 */
  targetAchievementRate: number;
  /** 收入來源分布 */
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  /** 預測收入 */
  forecastRevenue?: number;
}

/**
 * 客戶相關指標
 */
export interface CustomerMetrics {
  /** 總客戶數 */
  totalCustomers: number;
  /** 新增客戶數 (本月) */
  newCustomersThisMonth: number;
  /** 活躍客戶數 */
  activeCustomers: number;
  /** 客戶流失率 */
  churnRate: number;
  /** 客戶滿意度 */
  satisfactionScore?: number;
  /** 客戶生命週期價值 */
  averageLifetimeValue?: number;
  /** 客戶分級分布 */
  customersByTier: Array<{
    tier: 'VIP' | 'Regular' | 'Potential';
    count: number;
    percentage: number;
  }>;
}

/**
 * 任務相關指標
 */
export interface TaskMetrics {
  /** 總任務數 */
  totalTasks: number;
  /** 待處理任務 */
  pendingTasks: number;
  /** 進行中任務 */
  inProgressTasks: number;
  /** 已完成任務 */
  completedTasks: number;
  /** 逾期任務 */
  overdueTasks: number;
  /** 完成率 */
  completionRate: number;
  /** 平均完成時間 (天) */
  averageCompletionTime: number;
  /** 任務分配狀況 */
  taskDistribution: Array<{
    userId: string;
    userName: string;
    assignedCount: number;
    completedCount: number;
  }>;
}

/**
 * 會議相關指標
 */
export interface MeetingMetrics {
  /** 本月會議總數 */
  totalMeetingsThisMonth: number;
  /** 已完成會議 */
  completedMeetings: number;
  /** 即將到來的會議 */
  upcomingMeetings: number;
  /** 平均會議時長 (分鐘) */
  averageDuration: number;
  /** 會議參與率 */
  participationRate: number;
  /** AI 分析完成率 */
  aiAnalysisRate: number;
  /** 會議類型分布 */
  meetingsByType: Array<{
    type: RecordType;
    count: number;
    percentage: number;
  }>;
}

/**
 * 績效指標
 */
export interface PerformanceMetrics {
  /** 團隊整體績效分數 */
  teamScore: number;
  /** 個人績效排名 */
  individualRankings: Array<{
    userId: string;
    userName: string;
    score: number;
    rank: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  /** 目標達成率 */
  goalAchievementRate: number;
  /** 生產力指數 */
  productivityIndex: number;
  /** 品質分數 */
  qualityScore: number;
}

/**
 * 自訂指標
 */
export interface CustomMetric {
  /** 指標 ID */
  id: string;
  /** 指標名稱 */
  name: string;
  /** 指標值 */
  value: number | string;
  /** 單位 */
  unit?: string;
  /** 指標類型 */
  type: 'number' | 'percentage' | 'currency' | 'text';
  /** 趨勢 */
  trend?: 'up' | 'down' | 'stable';
  /** 變化值 */
  change?: number;
  /** 圖示 */
  icon?: string;
  /** 顏色 */
  color?: string;
}

/**
 * 趨勢資料和時間序列
 */
export interface TrendData {
  /** 資料點陣列 */
  dataPoints: TimeSeriesDataPoint[];
  /** 時間範圍 */
  timeRange: TimeRange;
  /** 聚合粒度 */
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** 趨勢線類型 */
  trendLineType?: 'linear' | 'polynomial' | 'exponential';
  /** 預測資料 */
  forecast?: ForecastData;
}

/**
 * 時間序列資料點
 */
export interface TimeSeriesDataPoint {
  /** 時間戳記 */
  timestamp: Timestamp;
  /** 數值 */
  value: number;
  /** 標籤 */
  label?: string;
  /** 元資料 */
  metadata?: Record<string, any>;
}

/**
 * 時間範圍
 */
export interface TimeRange {
  /** 開始時間 */
  start: Timestamp;
  /** 結束時間 */
  end: Timestamp;
  /** 預設時間範圍 */
  preset?: '7d' | '30d' | '90d' | '1y' | 'custom';
}

/**
 * 預測資料
 */
export interface ForecastData {
  /** 預測值 */
  predictedValues: TimeSeriesDataPoint[];
  /** 信心區間 */
  confidenceInterval: {
    upper: TimeSeriesDataPoint[];
    lower: TimeSeriesDataPoint[];
  };
  /** 準確度分數 */
  accuracy: number;
  /** 預測方法 */
  method: string;
}

/**
 * 團隊狀態和成員資訊
 */
export interface TeamStatusOverview {
  /** 團隊 ID */
  teamId: string;
  /** 團隊名稱 */
  teamName: string;
  /** 總成員數 */
  totalMembers: number;
  /** 線上成員數 */
  onlineMembers: number;
  /** 成員狀態列表 */
  memberStatuses: MemberStatus[];
  /** 團隊活動摘要 */
  activitySummary: TeamActivitySummary;
  /** 團隊健康度 */
  teamHealth: TeamHealthMetrics;
}

/**
 * 成員狀態
 */
export interface MemberStatus {
  /** 使用者 ID */
  userId: string;
  /** 使用者名稱 */
  userName: string;
  /** 使用者頭像 */
  userAvatar?: string;
  /** 角色 */
  role: UserRole;
  /** 線上狀態 */
  isOnline: boolean;
  /** 最後活動時間 */
  lastActiveAt: Timestamp;
  /** 當前活動 */
  currentActivity?: string;
  /** 今日完成任務數 */
  todayCompletedTasks: number;
  /** 待處理任務數 */
  pendingTasks: number;
  /** 狀態訊息 */
  statusMessage?: string;
}

/**
 * 團隊活動摘要
 */
export interface TeamActivitySummary {
  /** 今日活動數 */
  todayActivities: number;
  /** 本週活動數 */
  weekActivities: number;
  /** 熱門活動類型 */
  topActivityTypes: Array<{
    type: string;
    count: number;
  }>;
  /** 活動趨勢 */
  activityTrend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * 團隊健康度指標
 */
export interface TeamHealthMetrics {
  /** 整體健康分數 (0-100) */
  overallScore: number;
  /** 協作指數 */
  collaborationIndex: number;
  /** 工作負載平衡度 */
  workloadBalance: number;
  /** 團隊士氣 */
  morale?: number;
  /** 溝通效率 */
  communicationEfficiency: number;
  /** 風險因素 */
  riskFactors?: string[];
}

/* ============================================
   2. API 介面型別
   ============================================ */

/**
 * API 基礎回應型別
 */
export interface ApiResponse<T = any> {
  /** 成功標誌 */
  success: boolean;
  /** 回應資料 */
  data?: T;
  /** 錯誤訊息 */
  error?: ApiError;
  /** 元資料 */
  metadata?: ResponseMetadata;
}

/**
 * API 錯誤型別
 */
export interface ApiError {
  /** 錯誤代碼 */
  code: string;
  /** 錯誤訊息 */
  message: string;
  /** 詳細資訊 */
  details?: Record<string, any>;
  /** 堆疊追蹤 (僅開發環境) */
  stack?: string;
}

/**
 * 回應元資料
 */
export interface ResponseMetadata {
  /** 請求 ID */
  requestId: string;
  /** 時間戳記 */
  timestamp: Timestamp;
  /** 處理時間 (毫秒) */
  processingTime: number;
  /** 版本資訊 */
  version: string;
  /** 快取資訊 */
  cache?: CacheInfo;
}

/**
 * 快取資訊
 */
export interface CacheInfo {
  /** 是否從快取取得 */
  hit: boolean;
  /** 快取鍵值 */
  key?: string;
  /** 快取過期時間 */
  expiresAt?: Timestamp;
  /** 快取年齡 (秒) */
  age?: number;
}

/**
 * 儀表板指標 API 請求
 */
export interface DashboardMetricsRequest {
  /** 組織 ID */
  organizationId: string;
  /** 團隊 ID (可選) */
  teamId?: string;
  /** 使用者 ID (可選) */
  userId?: string;
  /** 時間範圍 */
  timeRange?: TimeRange;
  /** 指標類型 */
  metricTypes?: Array<keyof DashboardMetrics>;
  /** 是否包含預測 */
  includeForecast?: boolean;
  /** 是否強制更新 (跳過快取) */
  forceRefresh?: boolean;
}

/**
 * 儀表板指標 API 回應
 */
export interface DashboardMetricsResponse extends ApiResponse<DashboardMetrics> {
  /** 資料快取狀態 */
  cacheStatus: 'hit' | 'miss' | 'expired';
  /** 下次更新時間 */
  nextUpdateAt: Timestamp;
}

/**
 * 圖表資料 API 請求
 */
export interface ChartDataRequest {
  /** 圖表類型 */
  chartType: ChartType;
  /** 資料來源 */
  dataSource: string;
  /** 時間範圍 */
  timeRange: TimeRange;
  /** 維度 */
  dimensions?: string[];
  /** 度量 */
  metrics?: string[];
  /** 篩選條件 */
  filters?: DataFilter[];
  /** 排序 */
  sort?: SortConfig;
  /** 限制筆數 */
  limit?: number;
}

/**
 * 圖表資料 API 回應
 */
export interface ChartDataResponse extends ApiResponse<ChartData> {
  /** 資料總筆數 */
  totalCount: number;
  /** 是否有更多資料 */
  hasMore: boolean;
}

/**
 * AI 查詢 API 請求
 */
export interface AIQueryRequest {
  /** 查詢文字 */
  query: string;
  /** 查詢上下文 */
  context?: QueryContext;
  /** 使用者 ID */
  userId: string;
  /** 組織 ID */
  organizationId: string;
  /** 偏好語言 */
  language?: 'zh-TW' | 'en-US';
  /** 回應格式 */
  responseFormat?: 'text' | 'structured' | 'chart';
  /** 最大回應長度 */
  maxTokens?: number;
  /** 溫度參數 (0-1) */
  temperature?: number;
}

/**
 * AI 查詢 API 回應
 */
export interface AIQueryResponse extends ApiResponse<AIQueryResult> {
  /** 使用的模型 */
  model: string;
  /** Token 使用量 */
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** 處理時間 */
  processingTime: number;
}

/**
 * 分頁請求參數
 */
export interface PaginationRequest {
  /** 頁碼 (從 1 開始) */
  page?: number;
  /** 每頁筆數 */
  pageSize?: number;
  /** 游標 (用於游標分頁) */
  cursor?: string;
}

/**
 * 分頁回應資料
 */
export interface PaginationResponse {
  /** 當前頁碼 */
  currentPage: number;
  /** 總頁數 */
  totalPages: number;
  /** 每頁筆數 */
  pageSize: number;
  /** 總筆數 */
  totalCount: number;
  /** 是否有下一頁 */
  hasNextPage: boolean;
  /** 是否有上一頁 */
  hasPreviousPage: boolean;
  /** 下一頁游標 */
  nextCursor?: string;
  /** 上一頁游標 */
  previousCursor?: string;
}

/**
 * 資料篩選條件
 */
export interface DataFilter {
  /** 欄位名稱 */
  field: string;
  /** 運算子 */
  operator: FilterOperator;
  /** 比較值 */
  value: any;
  /** 邏輯運算子 (與下一個條件的關係) */
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
  | 'IN' 
  | 'NOT_IN' 
  | 'CONTAINS' 
  | 'NOT_CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

/**
 * 排序設定
 */
export interface SortConfig {
  /** 排序欄位 */
  field: string;
  /** 排序方向 */
  direction: 'asc' | 'desc';
}

/* ============================================
   3. 前端元件型別
   ============================================ */

/**
 * 圖表類型
 */
export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'heatmap'
  | 'treemap'
  | 'funnel'
  | 'gauge'
  | 'sankey';

/**
 * 圖表資料集合
 */
export interface ChartDataCollection {
  /** 營收趨勢圖 */
  revenueTrend: ChartData;
  /** 客戶成長圖 */
  customerGrowth: ChartData;
  /** 任務分布圖 */
  taskDistribution: ChartData;
  /** 團隊績效圖 */
  teamPerformance: ChartData;
  /** 自訂圖表 */
  customCharts?: ChartData[];
}

/**
 * 圖表資料
 */
export interface ChartData {
  /** 圖表 ID */
  id: string;
  /** 圖表標題 */
  title: string;
  /** 圖表類型 */
  type: ChartType;
  /** 資料集 */
  datasets: ChartDataset[];
  /** X 軸標籤 */
  labels?: string[];
  /** 圖表選項 */
  options?: ChartOptions;
  /** 互動配置 */
  interactionConfig?: ChartInteractionConfig;
}

/**
 * 圖表資料集
 */
export interface ChartDataset {
  /** 資料集標籤 */
  label: string;
  /** 資料點 */
  data: Array<number | { x: any; y: any }>;
  /** 背景顏色 */
  backgroundColor?: string | string[];
  /** 邊框顏色 */
  borderColor?: string | string[];
  /** 邊框寬度 */
  borderWidth?: number;
  /** 填充設定 */
  fill?: boolean | string;
  /** 線條張力 */
  tension?: number;
  /** 點樣式 */
  pointStyle?: string;
  /** 堆疊群組 */
  stack?: string;
}

/**
 * 圖表選項
 */
export interface ChartOptions {
  /** 響應式 */
  responsive?: boolean;
  /** 維持長寬比 */
  maintainAspectRatio?: boolean;
  /** 動畫設定 */
  animation?: {
    duration?: number;
    easing?: string;
  };
  /** 圖例設定 */
  legend?: {
    display?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  /** 提示框設定 */
  tooltip?: {
    enabled?: boolean;
    mode?: string;
    intersect?: boolean;
  };
  /** 縮放設定 */
  scales?: Record<string, any>;
}

/**
 * 圖表互動配置
 */
export interface ChartInteractionConfig {
  /** 是否可點擊 */
  clickable?: boolean;
  /** 是否可縮放 */
  zoomable?: boolean;
  /** 是否可平移 */
  pannable?: boolean;
  /** 是否可下載 */
  downloadable?: boolean;
  /** 點擊事件處理器 */
  onClick?: (event: ChartClickEvent) => void;
  /** 懸停事件處理器 */
  onHover?: (event: ChartHoverEvent) => void;
}

/**
 * 圖表點擊事件
 */
export interface ChartClickEvent {
  /** 資料集索引 */
  datasetIndex: number;
  /** 資料點索引 */
  dataIndex: number;
  /** 資料值 */
  value: any;
  /** 標籤 */
  label?: string;
}

/**
 * 圖表懸停事件
 */
export interface ChartHoverEvent extends ChartClickEvent {
  /** 滑鼠位置 */
  position: {
    x: number;
    y: number;
  };
}

/**
 * 指標卡片元件 Props
 */
export interface MetricCardProps {
  /** 標題 */
  title: string;
  /** 數值 */
  value: number | string;
  /** 單位 */
  unit?: string;
  /** 變化值 */
  change?: number;
  /** 變化百分比 */
  changePercentage?: number;
  /** 趨勢 */
  trend?: 'up' | 'down' | 'stable';
  /** 圖示 */
  icon?: React.ReactNode;
  /** 顏色 */
  color?: string;
  /** 迷你圖表 */
  sparkline?: number[];
  /** 點擊事件 */
  onClick?: () => void;
  /** 載入中 */
  loading?: boolean;
  /** 錯誤訊息 */
  error?: string;
}

/**
 * AI 查詢介面 Props
 */
export interface AIQueryInterfaceProps {
  /** 預設查詢 */
  defaultQuery?: string;
  /** 查詢建議 */
  suggestions?: string[];
  /** 查詢歷史 */
  history?: AIQueryHistory[];
  /** 提交處理器 */
  onSubmit: (query: string) => Promise<void>;
  /** 載入中 */
  loading?: boolean;
  /** 停用 */
  disabled?: boolean;
  /** 最大輸入長度 */
  maxLength?: number;
  /** 佔位文字 */
  placeholder?: string;
}

/**
 * 儀表板佈局配置
 */
export interface DashboardLayoutConfig {
  /** 佈局類型 */
  type: 'grid' | 'flex' | 'masonry';
  /** 列數 (桌面/平板/手機) */
  columns: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  /** 間距 */
  gap?: number;
  /** 區塊配置 */
  sections: DashboardSection[];
}

/**
 * 儀表板區塊
 */
export interface DashboardSection {
  /** 區塊 ID */
  id: string;
  /** 區塊標題 */
  title?: string;
  /** 區塊類型 */
  type: 'metrics' | 'chart' | 'table' | 'ai-query' | 'team-status' | 'custom';
  /** 網格位置 */
  gridArea?: {
    row: number;
    column: number;
    rowSpan?: number;
    columnSpan?: number;
  };
  /** 是否可見 */
  visible?: boolean;
  /** 是否可折疊 */
  collapsible?: boolean;
  /** 是否預設折疊 */
  defaultCollapsed?: boolean;
  /** 自訂元件 */
  component?: React.ComponentType<any>;
  /** 元件 Props */
  props?: Record<string, any>;
}

/**
 * UI 狀態管理型別
 */
export interface DashboardUIState {
  /** 載入狀態 */
  loading: boolean;
  /** 錯誤資訊 */
  error: string | null;
  /** 選中的時間範圍 */
  selectedTimeRange: TimeRange;
  /** 選中的團隊 */
  selectedTeamId?: string;
  /** 選中的使用者 */
  selectedUserId?: string;
  /** 展開的區塊 */
  expandedSections: string[];
  /** 篩選器狀態 */
  filters: DashboardFilters;
  /** 排序設定 */
  sortConfig?: SortConfig;
  /** 檢視模式 */
  viewMode: 'overview' | 'detailed' | 'compact';
  /** 主題 */
  theme: 'light' | 'dark' | 'auto';
  /** 重新整理間隔 (秒) */
  refreshInterval?: number;
}

/**
 * 儀表板篩選器
 */
export interface DashboardFilters {
  /** 日期範圍 */
  dateRange?: TimeRange;
  /** 團隊篩選 */
  teams?: string[];
  /** 使用者篩選 */
  users?: string[];
  /** 指標類型篩選 */
  metricTypes?: string[];
  /** 自訂篩選 */
  custom?: Record<string, any>;
}

/**
 * 事件處理器型別
 */
export interface DashboardEventHandlers {
  /** 時間範圍變更 */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** 篩選器變更 */
  onFilterChange?: (filters: DashboardFilters) => void;
  /** 區塊展開/折疊 */
  onSectionToggle?: (sectionId: string, expanded: boolean) => void;
  /** 指標點擊 */
  onMetricClick?: (metricId: string, value: any) => void;
  /** 圖表互動 */
  onChartInteraction?: (chartId: string, event: ChartClickEvent | ChartHoverEvent) => void;
  /** AI 查詢提交 */
  onAIQuerySubmit?: (query: string) => Promise<void>;
  /** 匯出資料 */
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  /** 重新整理 */
  onRefresh?: () => void;
  /** 設定變更 */
  onSettingsChange?: (settings: DashboardPreferences) => void;
}

/* ============================================
   4. Firebase 整合型別
   ============================================ */

/**
 * Firestore 儀表板文件
 */
export interface DashboardDoc {
  /** 文件 ID */
  id?: string;
  /** 組織 ID */
  organizationId: string;
  /** 擁有者 ID */
  ownerId: string;
  /** 儀表板名稱 */
  name: string;
  /** 儀表板描述 */
  description?: string;
  /** 儀表板配置 */
  config: DashboardConfig;
  /** 共享設定 */
  sharing?: DashboardSharing;
  /** 建立時間 */
  createdAt: Timestamp;
  /** 更新時間 */
  updatedAt: Timestamp;
  /** 建立者 */
  createdBy: string;
  /** 最後修改者 */
  lastModifiedBy?: string;
}

/**
 * 儀表板配置
 */
export interface DashboardConfig {
  /** 佈局配置 */
  layout: DashboardLayoutConfig;
  /** 資料來源設定 */
  dataSources: DataSourceConfig[];
  /** 重新整理設定 */
  refreshSettings?: RefreshSettings;
  /** 快取設定 */
  cacheSettings?: CacheSettings;
  /** 權限設定 */
  permissions?: PermissionSettings;
}

/**
 * 資料來源配置
 */
export interface DataSourceConfig {
  /** 資料來源 ID */
  id: string;
  /** 資料來源類型 */
  type: 'firestore' | 'realtime' | 'api' | 'custom';
  /** 集合/端點 */
  collection?: string;
  /** 查詢條件 */
  query?: FirestoreQuery;
  /** 更新頻率 (秒) */
  updateFrequency?: number;
  /** 轉換函數 */
  transformer?: string;
}

/**
 * Firestore 查詢配置
 */
export interface FirestoreQuery {
  /** 集合路徑 */
  collection: string;
  /** Where 條件 */
  where?: Array<{
    field: string;
    operator: FirestoreOperator;
    value: any;
  }>;
  /** 排序 */
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  /** 限制筆數 */
  limit?: number;
  /** 開始位置 */
  startAt?: any;
  /** 結束位置 */
  endAt?: any;
}

/**
 * Firestore 運算子
 */
export type FirestoreOperator = 
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

/**
 * 即時監聽器型別
 */
export interface RealtimeListener {
  /** 監聽器 ID */
  id: string;
  /** 集合路徑 */
  collection: string;
  /** 查詢條件 */
  query?: FirestoreQuery;
  /** 回調函數 */
  callback: (snapshot: any) => void;
  /** 錯誤處理 */
  onError?: (error: Error) => void;
  /** 取消訂閱函數 */
  unsubscribe?: () => void;
}

/**
 * 儀表板共享設定
 */
export interface DashboardSharing {
  /** 是否公開 */
  isPublic?: boolean;
  /** 共享連結 */
  shareLink?: string;
  /** 共享使用者 */
  sharedWith?: Array<{
    userId: string;
    permission: 'view' | 'edit' | 'admin';
  }>;
  /** 共享團隊 */
  sharedTeams?: Array<{
    teamId: string;
    permission: 'view' | 'edit';
  }>;
}

/**
 * 重新整理設定
 */
export interface RefreshSettings {
  /** 自動重新整理 */
  autoRefresh: boolean;
  /** 重新整理間隔 (秒) */
  interval?: number;
  /** 最小間隔 (秒) */
  minInterval?: number;
  /** 最大間隔 (秒) */
  maxInterval?: number;
}

/**
 * 快取設定
 */
export interface CacheSettings {
  /** 啟用快取 */
  enabled: boolean;
  /** 快取策略 */
  strategy: 'memory' | 'localStorage' | 'indexedDB';
  /** 快取時間 (秒) */
  ttl?: number;
  /** 最大快取大小 (bytes) */
  maxSize?: number;
  /** 快取鍵值前綴 */
  keyPrefix?: string;
}

/**
 * 權限設定
 */
export interface PermissionSettings {
  /** 檢視權限 */
  view?: string[];
  /** 編輯權限 */
  edit?: string[];
  /** 管理權限 */
  admin?: string[];
  /** 匯出權限 */
  export?: string[];
}

/**
 * Firebase 安全規則相關型別
 */
export interface DashboardSecurityRules {
  /** 可讀取的角色 */
  readRoles: UserRole[];
  /** 可寫入的角色 */
  writeRoles: UserRole[];
  /** 可刪除的角色 */
  deleteRoles: UserRole[];
  /** 自訂規則 */
  customRules?: Array<{
    action: string;
    condition: string;
  }>;
}

/* ============================================
   5. AI 查詢型別
   ============================================ */

/**
 * AI 查詢結果
 */
export interface AIQueryResult {
  /** 結果 ID */
  id: string;
  /** 原始查詢 */
  originalQuery: string;
  /** 解析後的意圖 */
  intent: QueryIntent;
  /** 回應文字 */
  responseText: string;
  /** 結構化資料 */
  structuredData?: any;
  /** 視覺化建議 */
  visualization?: VisualizationSuggestion;
  /** 相關查詢建議 */
  relatedQueries?: string[];
  /** 信心分數 */
  confidence: number;
  /** 資料來源 */
  dataSources?: string[];
  /** 執行的動作 */
  actions?: AIAction[];
}

/**
 * 查詢意圖
 */
export interface QueryIntent {
  /** 意圖類型 */
  type: 'metric' | 'trend' | 'comparison' | 'prediction' | 'explanation' | 'action';
  /** 主要實體 */
  entities: Array<{
    type: string;
    value: string;
    role?: string;
  }>;
  /** 時間範圍 */
  timeRange?: TimeRange;
  /** 篩選條件 */
  filters?: Record<string, any>;
  /** 參數 */
  parameters?: Record<string, any>;
}

/**
 * 視覺化建議
 */
export interface VisualizationSuggestion {
  /** 建議的圖表類型 */
  chartType: ChartType;
  /** 圖表配置 */
  chartConfig: ChartData;
  /** 替代視覺化選項 */
  alternatives?: Array<{
    chartType: ChartType;
    reason: string;
  }>;
}

/**
 * AI 動作
 */
export interface AIAction {
  /** 動作類型 */
  type: 'query' | 'update' | 'create' | 'notify' | 'export';
  /** 動作描述 */
  description: string;
  /** 目標資源 */
  target?: string;
  /** 參數 */
  parameters?: Record<string, any>;
  /** 執行狀態 */
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  /** 執行結果 */
  result?: any;
}

/**
 * 查詢上下文
 */
export interface QueryContext {
  /** 當前儀表板 ID */
  dashboardId?: string;
  /** 當前檢視的資料 */
  currentView?: string;
  /** 先前的查詢 */
  previousQueries?: string[];
  /** 使用者偏好 */
  userPreferences?: Record<string, any>;
  /** 額外上下文 */
  additionalContext?: Record<string, any>;
}

/**
 * AI 查詢歷史
 */
export interface AIQueryHistory {
  /** 查詢 ID */
  id: string;
  /** 查詢文字 */
  query: string;
  /** 查詢時間 */
  timestamp: Timestamp;
  /** 查詢結果 */
  result?: AIQueryResult;
  /** 使用者 ID */
  userId: string;
  /** 是否成功 */
  success: boolean;
}

/**
 * 自然語言處理型別
 */
export interface NLPProcessingResult {
  /** 分詞結果 */
  tokens: string[];
  /** 詞性標註 */
  posTagging?: Array<{
    token: string;
    tag: string;
  }>;
  /** 命名實體識別 */
  namedEntities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  /** 語義分析 */
  semanticAnalysis?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    topics?: string[];
    keywords?: string[];
  };
}

/**
 * AI 洞察
 */
export interface AIInsight {
  /** 洞察 ID */
  id: string;
  /** 洞察類型 */
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  /** 標題 */
  title: string;
  /** 描述 */
  description: string;
  /** 重要性 */
  importance: 'high' | 'medium' | 'low';
  /** 相關指標 */
  relatedMetrics?: string[];
  /** 建議動作 */
  suggestedActions?: string[];
  /** 產生時間 */
  generatedAt: Timestamp;
  /** 有效期限 */
  expiresAt?: Timestamp;
}

/* ============================================
   6. 輔助型別和工具型別
   ============================================ */

/**
 * 快速動作
 */
export interface QuickAction {
  /** 動作 ID */
  id: string;
  /** 動作標題 */
  title: string;
  /** 動作描述 */
  description?: string;
  /** 圖示 */
  icon?: string;
  /** 動作類型 */
  type: 'link' | 'modal' | 'action' | 'download';
  /** 目標 URL 或動作 */
  target?: string;
  /** 點擊處理器 */
  onClick?: () => void;
  /** 徽章 */
  badge?: string | number;
  /** 是否停用 */
  disabled?: boolean;
}

/**
 * 儀表板偏好設定
 */
export interface DashboardPreferences {
  /** 預設時間範圍 */
  defaultTimeRange?: TimeRange;
  /** 預設檢視模式 */
  defaultViewMode?: 'overview' | 'detailed' | 'compact';
  /** 顯示的區塊 */
  visibleSections?: string[];
  /** 圖表偏好 */
  chartPreferences?: {
    defaultType?: ChartType;
    colorScheme?: string;
    animations?: boolean;
  };
  /** 通知設定 */
  notifications?: {
    enabled?: boolean;
    types?: string[];
    frequency?: 'realtime' | 'hourly' | 'daily';
  };
  /** 語言設定 */
  language?: 'zh-TW' | 'en-US';
  /** 時區 */
  timezone?: string;
}

/**
 * 型別防護函數
 */
export const isDashboardData = (data: any): data is DashboardData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.organizationId === 'string' &&
    data.metrics !== undefined &&
    data.charts !== undefined
  );
};

export const isApiError = (error: any): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
};

export const isChartData = (data: any): data is ChartData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.type === 'string' &&
    Array.isArray(data.datasets)
  );
};

/**
 * 驗證函數
 */
export const validateTimeRange = (range: TimeRange): boolean => {
  if (!range.start || !range.end) return false;
  return range.start.toMillis() < range.end.toMillis();
};

export const validateDashboardFilters = (filters: DashboardFilters): boolean => {
  if (filters.dateRange && !validateTimeRange(filters.dateRange)) {
    return false;
  }
  return true;
};

/**
 * 轉換函數型別
 */
export type DataTransformer<T, R> = (data: T) => R;
export type AsyncDataTransformer<T, R> = (data: T) => Promise<R>;

/**
 * 錯誤處理型別
 */
export interface ErrorHandler {
  (error: Error | ApiError): void;
}

/**
 * 重試配置
 */
export interface RetryConfig {
  /** 最大重試次數 */
  maxAttempts?: number;
  /** 初始延遲 (毫秒) */
  initialDelay?: number;
  /** 延遲倍數 */
  backoffMultiplier?: number;
  /** 最大延遲 (毫秒) */
  maxDelay?: number;
  /** 重試條件 */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * 效能監控型別
 */
export interface PerformanceMetrics {
  /** API 回應時間 */
  apiResponseTime: number;
  /** 頁面載入時間 */
  pageLoadTime: number;
  /** 圖表渲染時間 */
  chartRenderTime: number;
  /** 資料處理時間 */
  dataProcessingTime: number;
  /** 記憶體使用量 */
  memoryUsage?: number;
  /** CPU 使用率 */
  cpuUsage?: number;
}

/**
 * 匯出型別總結
 * 
 * 此檔案提供了 PRP-123 儀表板功能所需的完整型別定義：
 * 
 * 1. 核心資料模型：定義儀表板的主要資料結構和業務指標
 * 2. API 介面型別：定義所有 API 請求和回應的型別
 * 3. 前端元件型別：定義 UI 元件的 Props 和狀態管理
 * 4. Firebase 整合型別：定義 Firestore 文件和即時更新相關型別
 * 5. AI 查詢型別：定義 AI 查詢和自然語言處理相關型別
 * 
 * 使用範例：
 * ```typescript
 * import { 
 *   DashboardData, 
 *   DashboardMetricsRequest,
 *   MetricCardProps,
 *   AIQueryRequest 
 * } from '@/docs/types/dashboard-data-models';
 * ```
 */