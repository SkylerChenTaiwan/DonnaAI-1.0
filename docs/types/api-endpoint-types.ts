/**
 * DonnaAI API 端點型別定義
 * 定義所有 API 端點的請求和回應型別
 * 
 * @module ApiEndpointTypes
 * @version 1.0.0
 */

import type {
  BaseUser,
  BaseOrganization,
  BaseTeam,
  BaseCustomer,
  BaseRecord,
  BaseTask,
  QueryOptions,
  PaginatedResult,
  CustomFieldDefinition,
} from './cross-platform-shared-types';

// ============================================================================
// API 端點路徑常數
// ============================================================================

export const API_ENDPOINTS = {
  // 認證端點
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // 用戶端點
  USERS: {
    LIST: '/api/users',
    GET: '/api/users/:id',
    CREATE: '/api/users',
    UPDATE: '/api/users/:id',
    DELETE: '/api/users/:id',
    PROFILE: '/api/users/profile',
    PREFERENCES: '/api/users/preferences',
  },
  
  // 組織端點
  ORGANIZATIONS: {
    LIST: '/api/organizations',
    GET: '/api/organizations/:id',
    CREATE: '/api/organizations',
    UPDATE: '/api/organizations/:id',
    DELETE: '/api/organizations/:id',
    MEMBERS: '/api/organizations/:id/members',
    INVITE: '/api/organizations/:id/invite',
    STATS: '/api/organizations/:id/stats',
  },
  
  // 團隊端點
  TEAMS: {
    LIST: '/api/teams',
    GET: '/api/teams/:id',
    CREATE: '/api/teams',
    UPDATE: '/api/teams/:id',
    DELETE: '/api/teams/:id',
    MEMBERS: '/api/teams/:id/members',
    ADD_MEMBER: '/api/teams/:id/members',
    REMOVE_MEMBER: '/api/teams/:id/members/:userId',
  },
  
  // 客戶端點
  CUSTOMERS: {
    LIST: '/api/customers',
    GET: '/api/customers/:id',
    CREATE: '/api/customers',
    UPDATE: '/api/customers/:id',
    DELETE: '/api/customers/:id',
    BATCH_CREATE: '/api/customers/batch',
    EXPORT: '/api/customers/export',
    IMPORT: '/api/customers/import',
  },
  
  // 記錄端點
  RECORDS: {
    LIST: '/api/records',
    GET: '/api/records/:id',
    CREATE: '/api/records',
    UPDATE: '/api/records/:id',
    DELETE: '/api/records/:id',
    BATCH_CREATE: '/api/records/batch',
    TIMELINE: '/api/records/timeline',
  },
  
  // 任務端點
  TASKS: {
    LIST: '/api/tasks',
    GET: '/api/tasks/:id',
    CREATE: '/api/tasks',
    UPDATE: '/api/tasks/:id',
    DELETE: '/api/tasks/:id',
    COMPLETE: '/api/tasks/:id/complete',
    ASSIGN: '/api/tasks/:id/assign',
  },
  
  // 自訂欄位端點
  CUSTOM_FIELDS: {
    LIST: '/api/custom-fields',
    GET: '/api/custom-fields/:id',
    CREATE: '/api/custom-fields',
    UPDATE: '/api/custom-fields/:id',
    DELETE: '/api/custom-fields/:id',
    REORDER: '/api/custom-fields/reorder',
  },
  
  // 報表端點
  REPORTS: {
    DASHBOARD: '/api/reports/dashboard',
    SALES: '/api/reports/sales',
    CUSTOMERS: '/api/reports/customers',
    ACTIVITIES: '/api/reports/activities',
    EXPORT: '/api/reports/export',
  },
  
  // AI 端點
  AI: {
    CHAT: '/api/ai/chat',
    ANALYZE: '/api/ai/analyze',
    SUGGEST: '/api/ai/suggest',
    ROLEPLAY: '/api/ai/roleplay',
  },
  
  // 檔案端點
  FILES: {
    UPLOAD: '/api/files/upload',
    GET: '/api/files/:id',
    DELETE: '/api/files/:id',
    SIGNED_URL: '/api/files/signed-url',
  },
} as const;

// ============================================================================
// 認證 API 型別
// ============================================================================

/**
 * 登入請求
 */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

/**
 * 登入回應
 */
export interface LoginResponse {
  readonly user: BaseUser;
  readonly token: string;
  readonly refreshToken?: string;
  readonly expiresIn: number;
}

/**
 * 註冊請求
 */
export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
  readonly organizationName?: string;
  readonly inviteCode?: string;
}

/**
 * 註冊回應
 */
export interface RegisterResponse {
  readonly user: BaseUser;
  readonly organization?: BaseOrganization;
  readonly token: string;
  readonly needsEmailVerification: boolean;
}

/**
 * 重設密碼請求
 */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly newPassword: string;
}

// ============================================================================
// 用戶 API 型別
// ============================================================================

/**
 * 用戶列表請求
 */
export interface ListUsersRequest extends QueryOptions {
  readonly organizationId?: string;
  readonly teamId?: string;
  readonly role?: string;
}

/**
 * 用戶列表回應
 */
export type ListUsersResponse = PaginatedResult<BaseUser>;

/**
 * 建立用戶請求
 */
export interface CreateUserRequest {
  readonly email: string;
  readonly displayName?: string;
  readonly role: string;
  readonly organizationId?: string;
  readonly teamIds?: string[];
  readonly sendInvite?: boolean;
}

/**
 * 更新用戶請求
 */
export interface UpdateUserRequest {
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly phoneNumber?: string;
  readonly role?: string;
  readonly teamIds?: string[];
}

/**
 * 用戶偏好設定請求
 */
export interface UpdatePreferencesRequest {
  readonly theme?: 'light' | 'dark' | 'system';
  readonly language?: string;
  readonly timezone?: string;
  readonly notifications?: {
    readonly email?: boolean;
    readonly push?: boolean;
    readonly inApp?: boolean;
  };
}

// ============================================================================
// 組織 API 型別
// ============================================================================

/**
 * 組織列表請求
 */
export interface ListOrganizationsRequest extends QueryOptions {
  readonly ownerId?: string;
  readonly isActive?: boolean;
}

/**
 * 組織列表回應
 */
export type ListOrganizationsResponse = PaginatedResult<BaseOrganization>;

/**
 * 建立組織請求
 */
export interface CreateOrganizationRequest {
  readonly name: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly settings?: OrganizationSettings;
}

/**
 * 更新組織請求
 */
export interface UpdateOrganizationRequest {
  readonly name?: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly settings?: Partial<OrganizationSettings>;
}

/**
 * 組織設定
 */
export interface OrganizationSettings {
  readonly defaultCurrency: string;
  readonly defaultTimezone: string;
  readonly workingDays: number[];
  readonly workingHours: {
    readonly start: string;
    readonly end: string;
  };
  readonly features: {
    readonly ai: boolean;
    readonly customFields: boolean;
    readonly reports: boolean;
    readonly api: boolean;
  };
}

/**
 * 邀請成員請求
 */
export interface InviteMemberRequest {
  readonly email: string;
  readonly role: string;
  readonly teamIds?: string[];
  readonly message?: string;
}

/**
 * 組織統計回應
 */
export interface OrganizationStatsResponse {
  readonly memberCount: number;
  readonly teamCount: number;
  readonly customerCount: number;
  readonly recordCount: number;
  readonly taskCount: number;
  readonly storageUsed: number;
  readonly apiCallsThisMonth: number;
}

// ============================================================================
// 客戶 API 型別
// ============================================================================

/**
 * 客戶列表請求
 */
export interface ListCustomersRequest extends QueryOptions {
  readonly organizationId?: string;
  readonly assignedTo?: string;
  readonly tags?: string[];
  readonly customFields?: Record<string, unknown>;
}

/**
 * 客戶列表回應
 */
export type ListCustomersResponse = PaginatedResult<BaseCustomer>;

/**
 * 建立客戶請求
 */
export interface CreateCustomerRequest {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly companyName?: string;
  readonly taxId?: string;
  readonly tags?: string[];
  readonly customFields?: Record<string, unknown>;
}

/**
 * 更新客戶請求
 */
export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

/**
 * 批次建立客戶請求
 */
export interface BatchCreateCustomersRequest {
  readonly customers: CreateCustomerRequest[];
  readonly skipDuplicates?: boolean;
  readonly updateExisting?: boolean;
}

/**
 * 批次建立客戶回應
 */
export interface BatchCreateCustomersResponse {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly errors: Array<{
    readonly index: number;
    readonly error: string;
  }>;
}

/**
 * 匯入客戶請求
 */
export interface ImportCustomersRequest {
  readonly fileId: string;
  readonly mappings: Record<string, string>;
  readonly options: {
    readonly skipHeader?: boolean;
    readonly skipDuplicates?: boolean;
    readonly updateExisting?: boolean;
  };
}

/**
 * 匯出客戶請求
 */
export interface ExportCustomersRequest {
  readonly format: 'csv' | 'excel' | 'json';
  readonly fields?: string[];
  readonly filters?: QueryOptions['filters'];
}

// ============================================================================
// 記錄 API 型別
// ============================================================================

/**
 * 記錄列表請求
 */
export interface ListRecordsRequest extends QueryOptions {
  readonly organizationId?: string;
  readonly customerId?: string;
  readonly assignedTo?: string;
  readonly type?: string;
  readonly status?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

/**
 * 記錄列表回應
 */
export type ListRecordsResponse = PaginatedResult<BaseRecord>;

/**
 * 建立記錄請求
 */
export interface CreateRecordRequest {
  readonly customerId: string;
  readonly type: string;
  readonly title: string;
  readonly description?: string;
  readonly amount?: number;
  readonly date?: string;
  readonly status?: string;
  readonly assignedTo?: string;
  readonly tags?: string[];
  readonly attachments?: string[];
  readonly customFields?: Record<string, unknown>;
}

/**
 * 更新記錄請求
 */
export interface UpdateRecordRequest extends Partial<CreateRecordRequest> {}

/**
 * 時間軸請求
 */
export interface TimelineRequest {
  readonly customerId?: string;
  readonly userId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly types?: string[];
  readonly limit?: number;
}

/**
 * 時間軸項目
 */
export interface TimelineItem {
  readonly id: string;
  readonly type: 'record' | 'task' | 'note' | 'activity';
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly avatar?: string;
  };
  readonly data: unknown;
}

// ============================================================================
// 任務 API 型別
// ============================================================================

/**
 * 任務列表請求
 */
export interface ListTasksRequest extends QueryOptions {
  readonly organizationId?: string;
  readonly assignedTo?: string;
  readonly status?: string;
  readonly priority?: string;
  readonly dueFrom?: string;
  readonly dueTo?: string;
}

/**
 * 任務列表回應
 */
export type ListTasksResponse = PaginatedResult<BaseTask>;

/**
 * 建立任務請求
 */
export interface CreateTaskRequest {
  readonly title: string;
  readonly description?: string;
  readonly dueDate?: string;
  readonly priority?: string;
  readonly assignedTo?: string;
  readonly relatedTo?: {
    readonly type: 'customer' | 'record' | 'team';
    readonly id: string;
  };
  readonly tags?: string[];
}

/**
 * 更新任務請求
 */
export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  readonly status?: string;
}

/**
 * 指派任務請求
 */
export interface AssignTaskRequest {
  readonly userId: string;
  readonly notify?: boolean;
}

// ============================================================================
// 自訂欄位 API 型別
// ============================================================================

/**
 * 自訂欄位列表請求
 */
export interface ListCustomFieldsRequest {
  readonly entityType: 'customer' | 'record' | 'task';
  readonly organizationId?: string;
  readonly isActive?: boolean;
}

/**
 * 自訂欄位列表回應
 */
export interface ListCustomFieldsResponse {
  readonly fields: CustomFieldDefinition[];
}

/**
 * 建立自訂欄位請求
 */
export interface CreateCustomFieldRequest {
  readonly entityType: 'customer' | 'record' | 'task';
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly required?: boolean;
  readonly defaultValue?: unknown;
  readonly options?: Array<{
    readonly value: string;
    readonly label: string;
  }>;
  readonly validation?: {
    readonly min?: number;
    readonly max?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
  };
  readonly description?: string;
}

/**
 * 更新自訂欄位請求
 */
export interface UpdateCustomFieldRequest extends Partial<CreateCustomFieldRequest> {
  readonly isActive?: boolean;
}

/**
 * 重新排序自訂欄位請求
 */
export interface ReorderCustomFieldsRequest {
  readonly fieldIds: string[];
}

// ============================================================================
// 報表 API 型別
// ============================================================================

/**
 * 儀表板資料請求
 */
export interface DashboardDataRequest {
  readonly period?: string;
  readonly organizationId?: string;
  readonly teamId?: string;
  readonly userId?: string;
}

/**
 * 儀表板資料回應
 */
export interface DashboardDataResponse {
  readonly stats: {
    readonly customers: {
      readonly total: number;
      readonly new: number;
      readonly active: number;
      readonly growth: number;
    };
    readonly records: {
      readonly total: number;
      readonly completed: number;
      readonly pending: number;
      readonly averagePerDay: number;
    };
    readonly tasks: {
      readonly total: number;
      readonly completed: number;
      readonly overdue: number;
      readonly completionRate: number;
    };
    readonly revenue?: {
      readonly total: number;
      readonly growth: number;
      readonly average: number;
      readonly forecast: number;
    };
  };
  readonly charts: {
    readonly recordsTrend: Array<{
      readonly date: string;
      readonly count: number;
    }>;
    readonly tasksByStatus: Array<{
      readonly status: string;
      readonly count: number;
    }>;
    readonly topCustomers: Array<{
      readonly id: string;
      readonly name: string;
      readonly value: number;
    }>;
  };
}

/**
 * 報表匯出請求
 */
export interface ExportReportRequest {
  readonly type: 'dashboard' | 'sales' | 'customers' | 'activities';
  readonly format: 'pdf' | 'excel' | 'csv';
  readonly period?: string;
  readonly filters?: QueryOptions['filters'];
  readonly includeCharts?: boolean;
}

// ============================================================================
// AI API 型別
// ============================================================================

/**
 * AI 聊天請求
 */
export interface AIChatRequest {
  readonly message: string;
  readonly context?: {
    readonly customerId?: string;
    readonly recordId?: string;
    readonly taskId?: string;
  };
  readonly history?: Array<{
    readonly role: 'user' | 'assistant';
    readonly content: string;
  }>;
}

/**
 * AI 聊天回應
 */
export interface AIChatResponse {
  readonly response: string;
  readonly suggestions?: string[];
  readonly actions?: Array<{
    readonly type: string;
    readonly label: string;
    readonly data: unknown;
  }>;
}

/**
 * AI 分析請求
 */
export interface AIAnalyzeRequest {
  readonly type: 'customer' | 'sales' | 'performance';
  readonly entityId?: string;
  readonly period?: string;
}

/**
 * AI 分析回應
 */
export interface AIAnalyzeResponse {
  readonly insights: Array<{
    readonly title: string;
    readonly description: string;
    readonly importance: 'high' | 'medium' | 'low';
    readonly data?: unknown;
  }>;
  readonly recommendations: Array<{
    readonly title: string;
    readonly description: string;
    readonly action?: {
      readonly type: string;
      readonly label: string;
      readonly data: unknown;
    };
  }>;
}

/**
 * AI 角色扮演請求
 */
export interface AIRoleplayRequest {
  readonly scenario: string;
  readonly role: 'customer' | 'salesperson';
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly context?: {
    readonly product?: string;
    readonly customerType?: string;
    readonly objective?: string;
  };
}

/**
 * AI 角色扮演回應
 */
export interface AIRoleplayResponse {
  readonly sessionId: string;
  readonly scenario: {
    readonly description: string;
    readonly objective: string;
    readonly character: {
      readonly name: string;
      readonly background: string;
      readonly personality: string;
    };
  };
  readonly initialMessage: string;
}

// ============================================================================
// 檔案 API 型別
// ============================================================================

/**
 * 檔案上傳請求
 */
export interface FileUploadRequest {
  readonly file: File;
  readonly type: 'image' | 'document' | 'spreadsheet' | 'other';
  readonly entityType?: 'customer' | 'record' | 'task';
  readonly entityId?: string;
}

/**
 * 檔案上傳回應
 */
export interface FileUploadResponse {
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
  readonly thumbnailUrl?: string;
}

/**
 * 簽名 URL 請求
 */
export interface SignedUrlRequest {
  readonly action: 'upload' | 'download';
  readonly fileName: string;
  readonly mimeType?: string;
  readonly expiresIn?: number;
}

/**
 * 簽名 URL 回應
 */
export interface SignedUrlResponse {
  readonly url: string;
  readonly fields?: Record<string, string>;
  readonly expiresAt: string;
}