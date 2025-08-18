/**
 * DonnaAI 跨平台共享型別定義
 * 提供 Web 和 React Native 平台共用的基礎型別
 * 
 * @module CrossPlatformTypes
 * @version 1.0.0
 */

// ============================================================================
// 基礎實體型別 (Base Entity Types)
// ============================================================================

/**
 * 基礎用戶介面 - 所有平台共享
 */
export interface BaseUser {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly phoneNumber?: string;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * 基礎組織介面
 */
export interface BaseOrganization {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly ownerId: string;
  readonly memberCount: number;
  readonly isActive: boolean;
}

/**
 * 基礎團隊介面
 */
export interface BaseTeam {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly organizationId: string;
  readonly leaderId: string;
  readonly memberIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isActive: boolean;
}

/**
 * 基礎客戶介面
 */
export interface BaseCustomer {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly companyName?: string;
  readonly taxId?: string;
  readonly tags?: readonly string[];
  readonly customFields?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly updatedBy?: string;
}

/**
 * 基礎記錄介面
 */
export interface BaseRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly type: RecordType;
  readonly title: string;
  readonly description?: string;
  readonly amount?: number;
  readonly date: string;
  readonly status: RecordStatus;
  readonly assignedTo?: string;
  readonly tags?: readonly string[];
  readonly attachments?: readonly Attachment[];
  readonly customFields?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly updatedBy?: string;
}

/**
 * 記錄類型枚舉
 */
export enum RecordType {
  VISIT = 'visit',
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  QUOTE = 'quote',
  ORDER = 'order',
  SUPPORT = 'support',
  OTHER = 'other',
}

/**
 * 記錄狀態枚舉
 */
export enum RecordStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

/**
 * 附件介面
 */
export interface Attachment {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly type: string;
  readonly size: number;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
}

// ============================================================================
// 共享業務邏輯型別 (Shared Business Logic Types)
// ============================================================================

/**
 * 自訂欄位定義
 */
export interface CustomFieldDefinition {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: CustomFieldType;
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly options?: readonly FieldOption[];
  readonly validation?: FieldValidation;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
}

/**
 * 自訂欄位類型
 */
export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  FILE = 'file',
  IMAGE = 'image',
  JSON = 'json',
}

/**
 * 欄位選項
 */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly color?: string;
  readonly icon?: string;
}

/**
 * 欄位驗證規則
 */
export interface FieldValidation {
  readonly min?: number;
  readonly max?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly customValidator?: string;
}

/**
 * 任務介面
 */
export interface BaseTask {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description?: string;
  readonly dueDate?: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly assignedTo?: string;
  readonly relatedTo?: {
    readonly type: 'customer' | 'record' | 'team';
    readonly id: string;
  };
  readonly tags?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly completedAt?: string;
  readonly completedBy?: string;
}

/**
 * 任務優先級
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 任務狀態
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// 資料查詢型別 (Data Query Types)
// ============================================================================

/**
 * 分頁參數
 */
export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
  readonly cursor?: string;
}

/**
 * 排序參數
 */
export interface SortParams {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

/**
 * 篩選參數
 */
export interface FilterParams {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
}

/**
 * 篩選操作符
 */
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

/**
 * 查詢選項
 */
export interface QueryOptions {
  readonly pagination?: PaginationParams;
  readonly sort?: SortParams | SortParams[];
  readonly filters?: FilterParams[];
  readonly search?: string;
  readonly include?: string[];
  readonly exclude?: string[];
}

/**
 * 分頁結果
 */
export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  readonly cursor?: string;
}

// ============================================================================
// 通知型別 (Notification Types)
// ============================================================================

/**
 * 通知介面
 */
export interface BaseNotification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly read: boolean;
  readonly readAt?: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

/**
 * 通知類型
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  RECORD_CREATED = 'record_created',
  CUSTOMER_UPDATED = 'customer_updated',
  SYSTEM = 'system',
}

// ============================================================================
// 活動日誌型別 (Activity Log Types)
// ============================================================================

/**
 * 活動日誌介面
 */
export interface ActivityLog {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly action: ActivityAction;
  readonly entityType: string;
  readonly entityId: string;
  readonly changes?: ChangeLog[];
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: string;
}

/**
 * 活動動作
 */
export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  SHARE = 'share',
  ASSIGN = 'assign',
  COMPLETE = 'complete',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
}

/**
 * 變更記錄
 */
export interface ChangeLog {
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

// ============================================================================
// 設定型別 (Settings Types)
// ============================================================================

/**
 * 應用設定介面
 */
export interface AppSettings {
  readonly theme: ThemeMode;
  readonly language: LanguageCode;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly timeFormat: '12h' | '24h';
  readonly currency: string;
  readonly notifications: NotificationSettings;
}

/**
 * 主題模式
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * 語言代碼
 */
export enum LanguageCode {
  ZH_TW = 'zh-TW',
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
}

/**
 * 通知設定
 */
export interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly inApp: boolean;
  readonly frequency: NotificationFrequency;
  readonly categories: Record<NotificationType, boolean>;
}

/**
 * 通知頻率
 */
export enum NotificationFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never',
}

// ============================================================================
// 權限型別 (Permission Types)
// ============================================================================

/**
 * 權限定義
 */
export interface PermissionDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: PermissionCategory;
  readonly actions: readonly PermissionAction[];
}

/**
 * 權限類別
 */
export enum PermissionCategory {
  USER = 'user',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  CUSTOMER = 'customer',
  RECORD = 'record',
  TASK = 'task',
  REPORT = 'report',
  SETTINGS = 'settings',
  ADMIN = 'admin',
}

/**
 * 權限動作
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share',
  MANAGE = 'manage',
}

// ============================================================================
// 統計型別 (Statistics Types)
// ============================================================================

/**
 * 儀表板統計
 */
export interface DashboardStats {
  readonly period: StatsPeriod;
  readonly customers: {
    readonly total: number;
    readonly new: number;
    readonly active: number;
  };
  readonly records: {
    readonly total: number;
    readonly completed: number;
    readonly pending: number;
  };
  readonly tasks: {
    readonly total: number;
    readonly completed: number;
    readonly overdue: number;
  };
  readonly revenue?: {
    readonly total: number;
    readonly growth: number;
    readonly average: number;
  };
}

/**
 * 統計期間
 */
export enum StatsPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

// ============================================================================
// 工具型別匯出 (Utility Types Export)
// ============================================================================

/**
 * 建立唯讀版本的型別
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

/**
 * 建立可寫版本的型別
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * 提取可為 null 的欄位
 */
export type NullableFields<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * 提取必填欄位
 */
export type RequiredFields<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];