/**
 * Firebase 集合型別定義
 * 提供嚴格型別的 Firestore 集合定義
 */

import { Timestamp, FieldValue } from 'firebase/firestore';

// 品牌型別用於 ID 安全
export type BrandedId<T extends string> = string & { readonly __brand: T };

export type UserId = BrandedId<'UserId'>;
export type OrganizationId = BrandedId<'OrganizationId'>;
export type TeamId = BrandedId<'TeamId'>;
export type CustomerId = BrandedId<'CustomerId'>;
export type RecordId = BrandedId<'RecordId'>;
export type TaskId = BrandedId<'TaskId'>;
export type FieldDefinitionId = BrandedId<'FieldDefinitionId'>;

// ID 創建輔助函數
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createOrganizationId(id: string): OrganizationId {
  return id as OrganizationId;
}

export function createTeamId(id: string): TeamId {
  return id as TeamId;
}

export function createCustomerId(id: string): CustomerId {
  return id as CustomerId;
}

export function createRecordId(id: string): RecordId {
  return id as RecordId;
}

export function createTaskId(id: string): TaskId {
  return id as TaskId;
}

// 基礎文件介面
export interface BaseFirestoreDoc {
  readonly createdAt: Timestamp | FieldValue;
  readonly updatedAt: Timestamp | FieldValue;
  readonly createdBy: UserId;
  readonly updatedBy?: UserId;
}

// 自訂欄位值型別
export type CustomFieldPrimitive = string | number | boolean | null;
export type CustomFieldDate = Date | Timestamp;
export type CustomFieldArray = CustomFieldPrimitive[];
export type CustomFieldObject = {
  [key: string]: CustomFieldValue;
};

export type CustomFieldValue = 
  | CustomFieldPrimitive
  | CustomFieldDate
  | CustomFieldArray
  | CustomFieldObject;

export type CustomFieldValues = Record<string, CustomFieldValue>;

// AI 處理狀態
export interface AIProcessingStatus {
  isProcessing: boolean;
  lastProcessed?: Timestamp;
  processingError?: string;
  confidence?: number;
  source?: 'manual' | 'ai' | 'import' | 'api';
}

// AI 欄位更新追蹤
export interface AIFieldUpdate {
  fieldName: string;
  oldValue: CustomFieldValue;
  newValue: CustomFieldValue;
  confidence: number;
  updatedAt: Timestamp;
  source: RecordId;
  approved?: boolean;
}

// 客戶文件型別
export interface CustomerDocument extends BaseFirestoreDoc {
  readonly id?: CustomerId;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: UserId;
  teamId: TeamId;
  organizationId: OrganizationId;
  notes?: string;
  
  // 關聯資料
  relatedUserIds?: UserId[];
  tags?: string[];
  
  // 日期追蹤
  lastContactDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
  
  // 自訂欄位（型別安全）
  customFields?: CustomFieldValues;
  
  // AI 相關
  aiStatus?: AIProcessingStatus;
  aiUpdates?: AIFieldUpdate[];
  
  // 元資料
  metadata?: {
    source?: 'manual' | 'import' | 'api' | 'migration';
    importBatchId?: string;
    externalId?: string;
    version?: number;
  };
}

// 會議/紀錄文件型別
export interface RecordDocument extends BaseFirestoreDoc {
  readonly id?: RecordId;
  title: string;
  type: 'meeting' | 'call' | 'email' | 'note';
  customerIds: CustomerId[];
  participantIds: UserId[];
  scheduledAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // 分鐘
  location?: string;
  notes?: string;
  
  // 音訊相關
  audioFileUrl?: string;
  transcription?: string;
  
  // AI 處理
  aiSummary?: string;
  aiInsights?: {
    keyPoints?: string[];
    actionItems?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    topics?: string[];
  };
  
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  organizationId: OrganizationId;
  teamId?: TeamId;
  
  // 附件
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Timestamp;
    uploadedBy: UserId;
  }>;
}

// 任務文件型別
export interface TaskDocument extends BaseFirestoreDoc {
  readonly id?: TaskId;
  title: string;
  description?: string;
  assignedTo: UserId;
  assignedBy: UserId;
  customerIds?: CustomerId[];
  recordId?: RecordId;
  
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  
  organizationId: OrganizationId;
  teamId: TeamId;
  
  // 標籤和分類
  tags?: string[];
  category?: string;
  
  // 進度追蹤
  progress?: number; // 0-100
  checklist?: Array<{
    item: string;
    completed: boolean;
    completedAt?: Timestamp;
    completedBy?: UserId;
  }>;
  
  // 通知設定
  reminders?: Array<{
    type: 'email' | 'push' | 'sms';
    scheduledFor: Timestamp;
    sent?: boolean;
  }>;
}

// 自訂欄位定義文件
export interface FieldDefinitionDocument extends BaseFirestoreDoc {
  readonly id?: FieldDefinitionId;
  organizationId: OrganizationId;
  entityType: 'customer' | 'record' | 'task';
  
  fieldName: string;
  displayName: string;
  description?: string;
  
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'url' | 'email' | 'phone';
  
  // 驗證規則
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string; // 函數名稱
  };
  
  // 選項（用於 select/multiselect）
  options?: Array<{
    value: string;
    label: string;
    color?: string;
  }>;
  
  // 預設值
  defaultValue?: CustomFieldValue;
  
  // UI 設定
  uiConfig?: {
    order?: number;
    width?: 'small' | 'medium' | 'large' | 'full';
    placeholder?: string;
    helpText?: string;
    icon?: string;
    hidden?: boolean;
    readOnly?: boolean;
  };
  
  // AI 設定
  aiConfig?: {
    autoExtract?: boolean;
    extractionHints?: string[];
    validationPrompt?: string;
    confidence?: number;
  };
  
  // 權限
  permissions?: {
    viewRoles?: string[];
    editRoles?: string[];
  };
  
  isActive: boolean;
  isSystem?: boolean; // 系統欄位不可刪除
}

// 集合名稱常數（型別安全）
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  TEAMS: 'teams',
  CUSTOMERS: 'customers',
  RECORDS: 'records',
  TASKS: 'tasks',
  FIELD_DEFINITIONS: 'fieldDefinitions',
  AI_USAGE: 'aiUsage',
  AUDIT_LOGS: 'auditLogs'
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// 集合型別映射
export interface CollectionTypeMap {
  [COLLECTIONS.CUSTOMERS]: CustomerDocument;
  [COLLECTIONS.RECORDS]: RecordDocument;
  [COLLECTIONS.TASKS]: TaskDocument;
  [COLLECTIONS.FIELD_DEFINITIONS]: FieldDefinitionDocument;
}

// 型別守衛函數
export function isCustomerDocument(doc: any): doc is CustomerDocument {
  return (
    doc &&
    typeof doc === 'object' &&
    typeof doc.name === 'string' &&
    typeof doc.company === 'string' &&
    typeof doc.assignedTo === 'string' &&
    typeof doc.organizationId === 'string'
  );
}

export function isRecordDocument(doc: any): doc is RecordDocument {
  return (
    doc &&
    typeof doc === 'object' &&
    typeof doc.title === 'string' &&
    Array.isArray(doc.customerIds) &&
    Array.isArray(doc.participantIds) &&
    typeof doc.organizationId === 'string'
  );
}

export function isTaskDocument(doc: any): doc is TaskDocument {
  return (
    doc &&
    typeof doc === 'object' &&
    typeof doc.title === 'string' &&
    typeof doc.assignedTo === 'string' &&
    typeof doc.assignedBy === 'string' &&
    typeof doc.organizationId === 'string'
  );
}

// 文件轉換輔助函數
export function toFirestoreDoc<T extends BaseFirestoreDoc>(
  doc: Omit<T, 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: UserId
): T {
  return {
    ...doc,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: userId
  } as T;
}

export function updateFirestoreDoc<T extends BaseFirestoreDoc>(
  doc: Partial<T>,
  userId: UserId
): Partial<T> & { updatedAt: Timestamp | FieldValue; updatedBy: UserId } {
  return {
    ...doc,
    updatedAt: Timestamp.now(),
    updatedBy: userId
  };
}