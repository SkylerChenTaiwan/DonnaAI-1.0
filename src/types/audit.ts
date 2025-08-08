/**
 * 審計日誌系統類型定義
 * 用於追蹤和記錄所有重要的組織操作
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 審計動作類型
 */
export enum AuditActionType {
  // 認證相關
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  
  // 用戶管理
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  // 資料操作
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // 權限變更
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  
  // 組織管理
  ORG_CREATED = 'ORG_CREATED',
  ORG_UPDATED = 'ORG_UPDATED',
  ORG_SUSPENDED = 'ORG_SUSPENDED',
  ORG_ACTIVATED = 'ORG_ACTIVATED',
  ORG_DELETED = 'ORG_DELETED',
  BILLING_CHANGED = 'BILLING_CHANGED',
  
  // 系統事件
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  INTEGRATION_CONNECTED = 'INTEGRATION_CONNECTED',
  INTEGRATION_DISCONNECTED = 'INTEGRATION_DISCONNECTED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  
  // 安全事件
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * 動作分類
 */
export enum ActionCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
  SYSTEM_ADMINISTRATION = 'SYSTEM_ADMINISTRATION',
  SECURITY = 'SECURITY',
  BILLING = 'BILLING',
  COMPLIANCE = 'COMPLIANCE'
}

/**
 * 風險等級
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 資料來源
 */
export type DataSource = 'web' | 'mobile' | 'api' | 'system';

/**
 * HTTP 方法
 */
export type HttpMethod = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';

/**
 * 操作狀態
 */
export type OperationStatus = 'success' | 'failure' | 'partial';

/**
 * 審計日誌主要資料結構
 */
export interface AuditLog {
  // 基本資訊
  id: string;
  timestamp: Timestamp;
  
  // 執行者資訊
  actor: {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
  
  // 組織上下文
  context: {
    organizationId: string;
    organizationName: string;
    teamId?: string;
    environment: 'production' | 'staging' | 'development';
  };
  
  // 動作資訊
  action: {
    type: AuditActionType;
    category: ActionCategory;
    resource: string;
    resourceId?: string;
    method: HttpMethod;
  };
  
  // 變更詳情
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    diff?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
  
  // 結果
  result: {
    status: OperationStatus;
    errorCode?: string;
    errorMessage?: string;
    duration?: number; // ms
  };
  
  // 額外資訊
  metadata?: {
    source: DataSource;
    correlationId?: string; // 關聯多個相關操作
    tags?: string[];
    risk?: RiskLevel;
  };
}

/**
 * 審計選項（用於裝飾器）
 */
export interface AuditOptions {
  action: AuditActionType;
  category: ActionCategory;
  resource?: string;
  risk?: RiskLevel;
  skipOnError?: boolean;
  includeRequestBody?: boolean;
  includeResponseData?: boolean;
  sensitiveFields?: string[]; // 需要遮罩的欄位
}

/**
 * 搜尋條件
 */
export interface SearchCriteria {
  organizationId?: string;
  userId?: string;
  actionTypes?: AuditActionType[];
  categories?: ActionCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  riskLevels?: RiskLevel[];
  status?: OperationStatus;
  resource?: string;
  searchText?: string;
  limit?: number;
  startAfter?: any;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 搜尋結果
 */
export interface SearchResult {
  logs: AuditLog[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: any;
}

/**
 * 審計統計
 */
export interface AuditStatistics {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  failureRate: number;
  averageResponseTime: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    eventCount: number;
  }>;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  timeline: TimelineData;
}

/**
 * 時間線資料
 */
export interface TimelineData {
  buckets: Array<{
    time: string;
    count: number;
    uniqueEvents: number;
  }>;
}

/**
 * 時間範圍
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * 報告期間
 */
export interface ReportPeriod {
  year: number;
  month?: number;
  quarter?: number;
}

/**
 * 合規報告
 */
export interface ComplianceReport {
  period: ReportPeriod;
  organization: {
    id: string;
    name: string;
    totalUsers: number;
  };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    failedAuthentications: number;
    dataExports: number;
    permissionChanges: number;
    userModifications: number;
  };
  userActivity: Array<{
    userId: string;
    userName: string;
    loginCount: number;
    actionCount: number;
    lastActive: Date;
  }>;
  dataAccess: Array<{
    resource: string;
    accessCount: number;
    uniqueUsers: number;
    exportCount: number;
  }>;
  securityEvents: Array<{
    type: string;
    count: number;
    severity: RiskLevel;
    lastOccurrence: Date;
  }>;
  recommendations: string[];
  generatedAt: Date;
  signature?: string;
}

/**
 * 安全報告
 */
export interface SecurityReport {
  threats: Threat[];
  anomalies: Anomaly[];
  accessPatterns: AccessPattern[];
  riskAssessment: RiskAssessment;
  incidents: SecurityIncident[];
  recommendations: string[];
}

/**
 * 威脅
 */
export interface Threat {
  id: string;
  type: string;
  severity: RiskLevel;
  description: string;
  detectedAt: Date;
  affectedUsers: string[];
  mitigationSteps: string[];
}

/**
 * 異常
 */
export interface Anomaly {
  type: string;
  severity: RiskLevel;
  userId?: string;
  timestamp: Timestamp;
  description: string;
  confidence: number;
}

/**
 * 存取模式
 */
export interface AccessPattern {
  userId: string;
  pattern: string;
  frequency: number;
  risk: RiskLevel;
  description: string;
}

/**
 * 風險評估
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;
  factors: Array<{
    factor: string;
    weight: number;
    score: number;
  }>;
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * 安全事件
 */
export interface SecurityIncident {
  id: string;
  type: string;
  severity: RiskLevel;
  timestamp: Timestamp;
  description: string;
  affectedResources: string[];
  responseActions: string[];
  status: 'open' | 'investigating' | 'resolved';
}

/**
 * 快取項目
 */
export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl?: number;
}

/**
 * 優化查詢
 */
export interface OptimizedQuery {
  index: string;
  conditions: any[];
  estimatedCost: number;
  shouldCache: boolean;
}

/**
 * 審計日誌匯出格式
 */
export interface AuditLogExport {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  filters: SearchCriteria;
  includeMetadata: boolean;
  dateRange: TimeRange;
  columns?: string[];
}

/**
 * 審計日誌保留政策
 */
export interface RetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveLocation?: string;
  deleteAfterArchive: boolean;
  compressArchive: boolean;
}

/**
 * 審計上下文（用於追蹤當前操作）
 */
export interface AuditContext {
  correlationId: string;
  parentLogId?: string;
  startTime: number;
  metadata: Record<string, any>;
}

/**
 * 審計配置
 */
export interface AuditConfig {
  enabled: boolean;
  logLevel: 'all' | 'critical' | 'high' | 'medium';
  excludedActions?: AuditActionType[];
  includedResources?: string[];
  retentionPolicy: RetentionPolicy;
  alerting: {
    enabled: boolean;
    criticalEventsOnly: boolean;
    emailRecipients?: string[];
    webhookUrl?: string;
  };
  performance: {
    batchSize: number;
    flushInterval: number;
    maxBufferSize: number;
    enableCompression: boolean;
  };
}