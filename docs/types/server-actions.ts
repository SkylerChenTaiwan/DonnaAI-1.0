/**
 * Next.js Server Actions 型別定義
 * 用於 App Router 的伺服器端操作
 */

import type { User, Organization, Customer, Task, Meeting, SalesRecord } from './web-platform-base-types';

/**
 * Server Action 驗證結果
 */
export type ValidationResult<T = any> = 
  | { valid: true; data: T }
  | { valid: false; errors: Record<string, string[]> };

/**
 * Server Action 上下文
 */
export interface ServerActionContext {
  user: User;
  organization: Organization;
  requestId: string;
  ip?: string;
  userAgent?: string;
}

/* ============================================
   使用者相關 Server Actions
   ============================================ */

export interface CreateUserAction {
  input: {
    email: string;
    name: string;
    role: string;
    teamIds?: string[];
  };
  output: User;
}

export interface UpdateUserAction {
  input: {
    userId: string;
    updates: Partial<User>;
  };
  output: User;
}

export interface DeleteUserAction {
  input: {
    userId: string;
  };
  output: { success: boolean };
}

export interface GetUsersAction {
  input: {
    organizationId: string;
    page?: number;
    limit?: number;
    role?: string;
    teamId?: string;
  };
  output: {
    users: User[];
    total: number;
  };
}

/* ============================================
   客戶相關 Server Actions
   ============================================ */

export interface CreateCustomerAction {
  input: {
    name: string;
    company: string;
    email?: string;
    phone?: string;
    assignedTo: string;
    teamId: string;
    customFields?: Record<string, any>;
  };
  output: Customer;
}

export interface UpdateCustomerAction {
  input: {
    customerId: string;
    updates: Partial<Customer>;
  };
  output: Customer;
}

export interface ImportCustomersAction {
  input: {
    file: File;
    mappings: Record<string, string>;
    organizationId: string;
  };
  output: {
    imported: number;
    failed: number;
    errors?: Array<{ row: number; error: string }>;
  };
}

export interface GetCustomersAction {
  input: {
    organizationId: string;
    page?: number;
    limit?: number;
    assignedTo?: string;
    teamId?: string;
    search?: string;
  };
  output: {
    customers: Customer[];
    total: number;
  };
}

/* ============================================
   任務相關 Server Actions
   ============================================ */

export interface CreateTaskAction {
  input: {
    title: string;
    description?: string;
    assignedTo: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    relatedCustomerIds?: string[];
  };
  output: Task;
}

export interface UpdateTaskAction {
  input: {
    taskId: string;
    updates: Partial<Task>;
  };
  output: Task;
}

export interface CompleteTaskAction {
  input: {
    taskId: string;
    notes?: string;
  };
  output: Task;
}

export interface GetTasksAction {
  input: {
    organizationId: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    dueDate?: { from?: Date; to?: Date };
    page?: number;
    limit?: number;
  };
  output: {
    tasks: Task[];
    total: number;
  };
}

/* ============================================
   會議相關 Server Actions
   ============================================ */

export interface ScheduleMeetingAction {
  input: {
    title: string;
    customerIds: string[];
    attendeeIds: string[];
    scheduledAt: Date;
    duration?: number;
    location?: string;
    notes?: string;
  };
  output: Meeting;
}

export interface UpdateMeetingAction {
  input: {
    meetingId: string;
    updates: Partial<Meeting>;
  };
  output: Meeting;
}

export interface TranscribeMeetingAction {
  input: {
    meetingId: string;
    audioFile: File;
  };
  output: {
    transcription: string;
    summary: string;
    actionItems: string[];
  };
}

export interface GetMeetingsAction {
  input: {
    organizationId: string;
    userId?: string;
    customerId?: string;
    from?: Date;
    to?: Date;
    status?: string;
    page?: number;
    limit?: number;
  };
  output: {
    meetings: Meeting[];
    total: number;
  };
}

/* ============================================
   銷售記錄相關 Server Actions
   ============================================ */

export interface CreateSalesRecordAction {
  input: {
    customerId: string;
    amount: number;
    date: Date;
    type: 'order' | 'meeting' | 'call' | 'email' | 'other';
    description?: string;
    attachments?: string[];
  };
  output: SalesRecord;
}

export interface UpdateSalesRecordAction {
  input: {
    recordId: string;
    updates: Partial<SalesRecord>;
  };
  output: SalesRecord;
}

export interface GetSalesRecordsAction {
  input: {
    organizationId: string;
    userId?: string;
    customerId?: string;
    teamId?: string;
    from?: Date;
    to?: Date;
    type?: string;
    page?: number;
    limit?: number;
  };
  output: {
    records: SalesRecord[];
    total: number;
    totalAmount: number;
  };
}

export interface GetSalesAnalyticsAction {
  input: {
    organizationId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    from: Date;
    to: Date;
    groupBy?: 'user' | 'team' | 'type' | 'customer';
  };
  output: {
    data: Array<{
      label: string;
      value: number;
      count: number;
      growth?: number;
    }>;
    summary: {
      total: number;
      average: number;
      growth: number;
      topPerformers: Array<{ id: string; name: string; value: number }>;
    };
  };
}

/* ============================================
   檔案上傳相關 Server Actions
   ============================================ */

export interface UploadFileAction {
  input: {
    file: File;
    folder: string;
    metadata?: Record<string, any>;
  };
  output: {
    url: string;
    size: number;
    type: string;
    name: string;
  };
}

export interface DeleteFileAction {
  input: {
    fileUrl: string;
  };
  output: {
    success: boolean;
  };
}

export interface GetSignedUrlAction {
  input: {
    fileUrl: string;
    expiresIn?: number;
  };
  output: {
    signedUrl: string;
    expiresAt: Date;
  };
}

/* ============================================
   AI 相關 Server Actions
   ============================================ */

export interface GenerateAISummaryAction {
  input: {
    content: string;
    type: 'meeting' | 'customer' | 'sales';
    language?: string;
  };
  output: {
    summary: string;
    keyPoints: string[];
    actionItems?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

export interface AnalyzeCustomerSentimentAction {
  input: {
    customerId: string;
    period?: { from: Date; to: Date };
  };
  output: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    timeline: Array<{
      date: Date;
      sentiment: string;
      score: number;
      source: string;
    }>;
    insights: string[];
  };
}

export interface GenerateSalesInsightsAction {
  input: {
    organizationId: string;
    period: { from: Date; to: Date };
  };
  output: {
    insights: Array<{
      type: 'opportunity' | 'risk' | 'trend';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      recommendations: string[];
    }>;
    predictions: Array<{
      metric: string;
      current: number;
      predicted: number;
      confidence: number;
    }>;
  };
}

/* ============================================
   批次操作 Server Actions
   ============================================ */

export interface BatchUpdateAction<T> {
  input: {
    ids: string[];
    updates: Partial<T>;
    collection: string;
  };
  output: {
    updated: number;
    failed: Array<{ id: string; error: string }>;
  };
}

export interface BatchDeleteAction {
  input: {
    ids: string[];
    collection: string;
  };
  output: {
    deleted: number;
    failed: Array<{ id: string; error: string }>;
  };
}

export interface BatchImportAction<T> {
  input: {
    data: T[];
    collection: string;
    updateExisting?: boolean;
  };
  output: {
    imported: number;
    updated: number;
    failed: Array<{ index: number; error: string }>;
  };
}

/* ============================================
   通知相關 Server Actions
   ============================================ */

export interface SendNotificationAction {
  input: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
  };
  output: {
    notificationId: string;
    sent: boolean;
  };
}

export interface MarkNotificationReadAction {
  input: {
    notificationId: string;
  };
  output: {
    success: boolean;
  };
}

export interface GetNotificationsAction {
  input: {
    userId: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  };
  output: {
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: Date;
      actionUrl?: string;
    }>;
    unreadCount: number;
    total: number;
  };
}

/* ============================================
   Server Action 輔助函數
   ============================================ */

/**
 * 建立 Server Action 包裝器
 */
export function createServerAction<TInput, TOutput>(
  handler: (input: TInput, context: ServerActionContext) => Promise<TOutput>
) {
  return async (input: TInput): Promise<{ success: true; data: TOutput } | { success: false; error: string }> => {
    try {
      // 取得當前使用者和組織資訊
      const context = await getServerActionContext();
      
      // 執行處理器
      const data = await handler(input, context);
      
      return { success: true, data };
    } catch (error) {
      console.error('Server action error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  };
}

/**
 * 取得 Server Action 上下文（需實作）
 */
async function getServerActionContext(): Promise<ServerActionContext> {
  // 這裡需要實作取得當前使用者和組織的邏輯
  // 通常從 cookies 或 headers 中取得 token
  // 然後驗證並取得使用者資訊
  throw new Error('getServerActionContext not implemented');
}

/**
 * Server Action 驗證裝飾器
 */
export function withValidation<TInput, TOutput>(
  validator: (input: TInput) => ValidationResult<TInput>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (input: TInput) {
      const validation = validator(input);
      
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        };
      }
      
      return originalMethod.call(this, validation.data);
    };
    
    return descriptor;
  };
}

/**
 * Server Action 快取裝飾器
 */
export function withCache<TInput, TOutput>(
  getCacheKey: (input: TInput) => string,
  ttl: number = 60 // 預設 60 秒
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (input: TInput) {
      const cacheKey = getCacheKey(input);
      
      // 嘗試從快取取得
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
      
      // 執行原始方法
      const result = await originalMethod.call(this, input);
      
      // 如果成功，存入快取
      if (result.success) {
        await setToCache(cacheKey, result.data, ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

// 快取函數（需實作）
async function getFromCache(key: string): Promise<any> {
  // 實作快取取得邏輯
  return null;
}

async function setToCache(key: string, value: any, ttl: number): Promise<void> {
  // 實作快取設定邏輯
}