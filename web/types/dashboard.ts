/**
 * Dashboard 核心型別定義
 * 統一的型別定義檔案，解決型別不一致問題
 * 
 * @description 此檔案匯出所有 Dashboard 相關的型別定義
 * @version 1.0.0
 * @date 2025-08-18
 */

// 重新匯出 dashboard-data-models 中的型別
export type {
  // 核心資料模型
  DashboardData,
  DashboardMetrics,
  RevenueMetrics,
  CustomerMetrics,
  TaskMetrics,
  MeetingMetrics,
  PerformanceMetrics,
  CustomMetric,
  
  // 趨勢和時間序列
  TrendData,
  TimeSeriesDataPoint,
  TimeRange,
  ForecastData,
  
  // 團隊相關
  TeamStatusOverview,
  MemberStatus,
  TeamActivitySummary,
  TeamHealthMetrics,
  
  // API 相關型別
  ApiResponse,
  ApiError,
  ResponseMetadata,
  CacheInfo,
  DashboardMetricsRequest,
  DashboardMetricsResponse,
  ChartDataRequest,
  ChartDataResponse,
  AIQueryRequest,
  AIQueryResponse,
  
  // 圖表相關
  ChartData,
  ChartDataCollection,
  ChartType,
  ChartConfig,
  ChartStyle,
  
  // 通知相關
  NotificationPayload,
  NotificationPreferences as DashboardNotificationPreferences,
  
  // 篩選和排序
  DataFilter,
  SortConfig,
  FilterOperator,
  
  // WebSocket 事件
  WebSocketEventPayload,
  RealtimeUpdate,
  
  // 使用者偏好
  DashboardPreferences,
  WidgetPreferences,
  
  // AI 洞察
  AIInsight,
  InsightType,
  InsightPriority,
  
  // 快速操作
  QuickAction,
  ActionType,
  
  // 權限相關
  DashboardPermission,
  PermissionLevel,
  
  // 匯出相關
  ExportOptions,
  ExportFormat,
  
  // 趨勢分析
  TrendsRequest,
  TrendsResponse,
  TrendAnalysis,
  
  // 團隊狀態
  TeamStatusRequest,
  TeamStatusResponse,
  TeamMemberActivity,
  
  // 查詢上下文
  QueryContext,
  QueryOptions,
  
  // 批次操作
  BatchOperation,
  BatchOperationResult,
  
  // 排程任務
  ScheduledTask,
  TaskSchedule,
  
  // 資料來源
  DataSource,
  DataSourceType,
  
  // 聚合配置
  AggregationConfig,
  AggregationType
} from '@/docs/types/dashboard-data-models';

// 團隊成員型別 (補充定義)
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  status: 'active' | 'inactive' | 'away' | 'busy';
  lastSeen?: Date;
  joinDate: Date;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

// 通知型別 (補充定義)
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  organizationId?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

// WebSocket 訊息基礎介面 (強型別化)
export interface TypedWebSocketMessage<T = unknown> {
  type: string;
  id?: string;
  timestamp: string;
  data: T; // 移除 any 型別
  from?: string;
}

// AI 查詢結果型別 (強型別化)
export interface AIQueryResult {
  queryId: string;
  query: string;
  result: {
    answer: string;
    confidence: number;
    sources?: Array<{
      type: string;
      reference: string;
      relevance: number;
    }>;
    suggestions?: string[];
    visualizations?: Array<{
      type: string;
      data: unknown;
      config?: Record<string, unknown>;
    }>;
  };
  processingTime: number;
  metadata?: Record<string, unknown>;
}

// 輔助型別工具
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// 型別守衛
export function isDashboardMetrics(obj: unknown): obj is DashboardMetrics {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'revenue' in obj &&
    'customers' in obj &&
    'tasks' in obj
  );
}

export function isTeamMember(obj: unknown): obj is TeamMember {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'userId' in obj &&
    'name' in obj &&
    'status' in obj
  );
}

export function isNotification(obj: unknown): obj is Notification {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'title' in obj &&
    'message' in obj &&
    'read' in obj
  );
}

// 常數定義
export const DASHBOARD_UPDATE_INTERVALS = {
  REALTIME: 1000,      // 1 秒
  FREQUENT: 5000,      // 5 秒
  NORMAL: 30000,       // 30 秒
  SLOW: 60000,         // 1 分鐘
  RARE: 300000,        // 5 分鐘
} as const;

export const METRIC_TYPES = [
  'revenue',
  'customers',
  'tasks',
  'meetings',
  'performance',
] as const;

export type MetricType = typeof METRIC_TYPES[number];

// 預設值
export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  theme: 'light',
  layout: 'grid',
  refreshInterval: DASHBOARD_UPDATE_INTERVALS.NORMAL,
  showNotifications: true,
  widgets: [],
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  currency: 'TWD',
  language: 'zh-TW',
};