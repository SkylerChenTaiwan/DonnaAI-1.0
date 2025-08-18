/**
 * Firebase Web SDK 完整型別定義系統
 * 
 * 這個檔案包含了 DonnaAI Web 平台所有 Firebase 服務的完整型別定義，
 * 提供嚴格的型別檢查和開發時的 IntelliSense 支援。
 * 
 * @module firebase-web-types
 * @version 1.0.0
 */

import type { 
  Timestamp as FirestoreTimestamp,
  FieldValue,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  WriteBatch,
  Transaction,
  WhereFilterOp,
  OrderByDirection,
  SnapshotOptions
} from 'firebase/firestore';

import type {
  User as FirebaseUser,
  UserCredential,
  AuthError,
  IdTokenResult,
  ActionCodeSettings,
  AuthProvider,
  MultiFactorResolver,
  UserInfo
} from 'firebase/auth';

import type {
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  UploadMetadata,
  FullMetadata,
  ListResult
} from 'firebase/storage';

import type {
  HttpsCallable,
  HttpsCallableResult,
  Functions as FirebaseFunctions
} from 'firebase/functions';

// ============================================================================
// 基礎型別定義
// ============================================================================

/**
 * Firebase 時間戳記型別
 */
export type Timestamp = FirestoreTimestamp;

/**
 * 文件 ID 型別
 */
export type DocumentId = string;

/**
 * 用戶 ID 型別
 */
export type UserId = string;

/**
 * 組織 ID 型別
 */
export type OrganizationId = string;

/**
 * 團隊 ID 型別
 */
export type TeamId = string;

/**
 * 品牌型別：用於建立具有語意的字串型別
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * Email 型別（品牌型別）
 */
export type Email = Brand<string, 'Email'>;

/**
 * URL 型別（品牌型別）
 */
export type URL = Brand<string, 'URL'>;

/**
 * ISO 日期字串型別
 */
export type ISODateString = Brand<string, 'ISODateString'>;

// ============================================================================
// Firebase 配置型別
// ============================================================================

/**
 * Firebase 客戶端配置介面
 */
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Firebase 環境配置
 */
export interface FirebaseEnvironmentConfig {
  production: FirebaseClientConfig;
  development: FirebaseClientConfig;
  staging?: FirebaseClientConfig;
}

/**
 * Firebase 模擬器配置
 */
export interface FirebaseEmulatorConfig {
  auth: {
    host: string;
    port: number;
  };
  firestore: {
    host: string;
    port: number;
  };
  storage: {
    host: string;
    port: number;
  };
  functions: {
    host: string;
    port: number;
  };
}

// ============================================================================
// 認證型別定義
// ============================================================================

/**
 * 認證狀態
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * 認證提供者型別
 */
export type AuthProviderType = 
  | 'email'
  | 'google'
  | 'facebook'
  | 'github'
  | 'twitter'
  | 'apple'
  | 'microsoft'
  | 'phone'
  | 'anonymous';

/**
 * 自訂用戶聲明
 */
export interface CustomClaims {
  role?: UserRole;
  organizationId?: OrganizationId;
  teamIds?: TeamId[];
  permissions?: Permission[];
  isSuperAdmin?: boolean;
  subscription?: SubscriptionTier;
}

/**
 * 擴展的用戶資料
 */
export interface ExtendedUser extends FirebaseUser {
  customClaims?: CustomClaims;
}

/**
 * 認證錯誤代碼
 */
export type AuthErrorCode = 
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/popup-closed-by-user'
  | 'auth/unauthorized-domain'
  | 'auth/requires-recent-login';

/**
 * 認證錯誤介面
 */
export interface AuthenticationError extends AuthError {
  code: AuthErrorCode;
  customData?: Record<string, unknown>;
}

/**
 * 認證回應
 */
export interface AuthResponse {
  user: ExtendedUser;
  credential: UserCredential;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * 登入請求
 */
export interface SignInRequest {
  email: Email;
  password: string;
  rememberMe?: boolean;
}

/**
 * 註冊請求
 */
export interface SignUpRequest {
  email: Email;
  password: string;
  displayName?: string;
  photoURL?: URL;
  phoneNumber?: string;
  acceptTerms: boolean;
}

/**
 * 密碼重設請求
 */
export interface PasswordResetRequest {
  email: Email;
  actionCodeSettings?: ActionCodeSettings;
}

// ============================================================================
// 用戶和權限型別
// ============================================================================

/**
 * 用戶角色
 */
export type UserRole = 
  | 'super_admin'
  | 'org_admin'
  | 'manager'
  | 'sales'
  | 'member'
  | 'viewer';

/**
 * 權限型別
 */
export type Permission = 
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'customers.create'
  | 'customers.read'
  | 'customers.update'
  | 'customers.delete'
  | 'records.create'
  | 'records.read'
  | 'records.update'
  | 'records.delete'
  | 'ai.transcription'
  | 'ai.summary'
  | 'ai.analysis'
  | 'settings.manage'
  | 'billing.manage'
  | 'reports.export';

/**
 * 用戶檔案介面
 */
export interface UserProfile {
  id: UserId;
  email: Email;
  displayName: string;
  photoURL?: URL;
  phoneNumber?: string;
  role: UserRole;
  organizationId: OrganizationId;
  teamIds: TeamId[];
  permissions: Permission[];
  customFields?: Record<string, unknown>;
  preferences?: UserPreferences;
  metadata: UserMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 用戶偏好設定
 */
export interface UserPreferences {
  language: 'zh-TW' | 'en-US' | 'ja-JP';
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

/**
 * 通知偏好設定
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  digest: 'realtime' | 'daily' | 'weekly' | 'never';
}

/**
 * 用戶元資料
 */
export interface UserMetadata {
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
  loginCount: number;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 裝置資訊
 */
export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  browser?: string;
  version?: string;
  model?: string;
  os?: string;
}

// ============================================================================
// Firestore 文件型別
// ============================================================================

/**
 * 基礎 Firestore 文件介面
 */
export interface BaseDocument {
  id?: DocumentId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UserId;
  updatedBy?: UserId;
  deleted?: boolean;
  deletedAt?: Timestamp;
  deletedBy?: UserId;
}

/**
 * 組織文件
 */
export interface OrganizationDocument extends BaseDocument {
  name: string;
  description?: string;
  logo?: URL;
  website?: URL;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  subscription: SubscriptionInfo;
  settings: OrganizationSettings;
  metadata: OrganizationMetadata;
}

/**
 * 訂閱資訊
 */
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  startDate: Timestamp;
  endDate?: Timestamp;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: PaymentMethod;
  usage: UsageInfo;
}

/**
 * 訂閱層級
 */
export type SubscriptionTier = 
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom';

/**
 * 付款方式
 */
export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'invoice';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

/**
 * 使用量資訊
 */
export interface UsageInfo {
  users: {
    current: number;
    limit: number;
  };
  storage: {
    current: number; // bytes
    limit: number; // bytes
  };
  ai: {
    transcriptionMinutes: number;
    summaryCount: number;
    analysisCount: number;
    monthlyLimit: number;
  };
}

/**
 * 組織設定
 */
export interface OrganizationSettings {
  features: Feature[];
  customFields: CustomFieldDefinition[];
  integrations: Integration[];
  security: SecuritySettings;
}

/**
 * 功能標誌
 */
export type Feature = 
  | 'ai_transcription'
  | 'ai_summary'
  | 'ai_analysis'
  | 'custom_fields'
  | 'api_access'
  | 'advanced_reporting'
  | 'team_collaboration'
  | 'data_export';

/**
 * 組織元資料
 */
export interface OrganizationMetadata {
  userCount: number;
  customerCount: number;
  recordCount: number;
  lastActivityAt: Timestamp;
}

/**
 * 團隊文件
 */
export interface TeamDocument extends BaseDocument {
  name: string;
  description?: string;
  organizationId: OrganizationId;
  managerId: UserId;
  memberIds: UserId[];
  settings?: TeamSettings;
  metadata?: TeamMetadata;
}

/**
 * 團隊設定
 */
export interface TeamSettings {
  allowMemberInvite: boolean;
  requireApproval: boolean;
  shareCustomers: boolean;
  shareRecords: boolean;
}

/**
 * 團隊元資料
 */
export interface TeamMetadata {
  memberCount: number;
  customerCount: number;
  recordCount: number;
  performance?: PerformanceMetrics;
}

/**
 * 績效指標
 */
export interface PerformanceMetrics {
  totalSales: number;
  conversionRate: number;
  averageDealSize: number;
  customerSatisfaction: number;
}

/**
 * 客戶文件
 */
export interface CustomerDocument extends BaseDocument {
  // 基本資訊
  name: string;
  company?: string;
  email?: Email;
  phone?: string;
  address?: Address;
  
  // 業務資訊
  assignedTo: UserId;
  teamId: TeamId;
  organizationId: OrganizationId;
  status: CustomerStatus;
  priority: Priority;
  
  // 關聯資訊
  relatedUserIds?: UserId[];
  tags?: string[];
  customFields?: Record<string, any>;
  
  // 追蹤資訊
  lastContactDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
  notes?: string;
  
  // AI 追蹤
  aiAutoUpdates?: AIUpdateTracking;
}

/**
 * 客戶狀態
 */
export type CustomerStatus = 
  | 'prospect'
  | 'lead'
  | 'qualified'
  | 'customer'
  | 'inactive'
  | 'churned';

/**
 * 優先級
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 地址
 */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * AI 更新追蹤
 */
export interface AIUpdateTracking {
  lastUpdated: Timestamp;
  updatedFields: string[];
  updateSource: DocumentId;
  confidence: number;
  changelog?: AIChangeLog[];
}

/**
 * AI 變更記錄
 */
export interface AIChangeLog {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: Timestamp;
  confidence: number;
}

/**
 * 會議記錄文件
 */
export interface MeetingDocument extends BaseDocument {
  title: string;
  customerIds: DocumentId[];
  attendeeIds: UserId[];
  scheduledAt: Timestamp;
  duration?: number; // 分鐘
  location?: string | Address;
  type: MeetingType;
  status: MeetingStatus;
  
  // 內容
  agenda?: string;
  notes?: string;
  actionItems?: ActionItem[];
  
  // AI 處理
  audioFileUrl?: URL;
  transcription?: string;
  aiSummary?: AISummary;
  aiInsights?: AIInsight[];
}

/**
 * 會議類型
 */
export type MeetingType = 
  | 'sales'
  | 'support'
  | 'onboarding'
  | 'review'
  | 'internal'
  | 'other';

/**
 * 會議狀態
 */
export type MeetingStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * 行動項目
 */
export interface ActionItem {
  id: string;
  description: string;
  assignedTo: UserId;
  dueDate?: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
}

/**
 * AI 摘要
 */
export interface AISummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  nextSteps: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  generatedAt: Timestamp;
  model: string;
}

/**
 * AI 洞察
 */
export interface AIInsight {
  type: 'opportunity' | 'risk' | 'action' | 'feedback';
  title: string;
  description: string;
  confidence: number;
  suggestedAction?: string;
}

/**
 * 任務文件
 */
export interface TaskDocument extends BaseDocument {
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  
  // 指派
  assignedTo: UserId;
  assignedBy: UserId;
  teamId?: TeamId;
  
  // 關聯
  customerId?: DocumentId;
  recordId?: DocumentId;
  
  // 時間
  dueDate?: Timestamp;
  startDate?: Timestamp;
  completedAt?: Timestamp;
  
  // 追蹤
  progress?: number; // 0-100
  timeSpent?: number; // 分鐘
  comments?: Comment[];
  attachments?: Attachment[];
}

/**
 * 任務類型
 */
export type TaskType = 
  | 'call'
  | 'email'
  | 'meeting'
  | 'follow_up'
  | 'proposal'
  | 'contract'
  | 'other';

/**
 * 任務狀態
 */
export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';

/**
 * 評論
 */
export interface Comment {
  id: string;
  content: string;
  authorId: UserId;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  mentions?: UserId[];
}

/**
 * 附件
 */
export interface Attachment {
  id: string;
  name: string;
  url: URL;
  type: string;
  size: number; // bytes
  uploadedBy: UserId;
  uploadedAt: Timestamp;
}

// ============================================================================
// 自訂欄位型別
// ============================================================================

/**
 * 自訂欄位定義
 */
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue?: any;
  options?: CustomFieldOption[];
  validation?: ValidationRule[];
  visibility?: FieldVisibility;
  order: number;
}

/**
 * 自訂欄位類型
 */
export type CustomFieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'email'
  | 'phone'
  | 'url'
  | 'currency'
  | 'percentage'
  | 'file'
  | 'user'
  | 'relation';

/**
 * 自訂欄位選項
 */
export interface CustomFieldOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

/**
 * 驗證規則
 */
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

/**
 * 欄位可見性
 */
export interface FieldVisibility {
  roles?: UserRole[];
  teams?: TeamId[];
  users?: UserId[];
}

// ============================================================================
// Cloud Functions 型別
// ============================================================================

/**
 * Cloud Function 請求基礎介面
 */
export interface FunctionRequest<T = unknown> {
  data: T;
  auth?: {
    uid: UserId;
    token: CustomClaims;
  };
  instanceIdToken?: string;
  rawRequest?: unknown;
}

/**
 * Cloud Function 回應基礎介面
 */
export interface FunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: FunctionError;
  metadata?: ResponseMetadata;
}

/**
 * 函數錯誤
 */
export interface FunctionError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * 回應元資料
 */
export interface ResponseMetadata {
  timestamp: Timestamp;
  executionTime: number; // ms
  version?: string;
  requestId?: string;
}

/**
 * AI 處理請求
 */
export interface AIProcessingRequest {
  type: 'transcription' | 'summary' | 'analysis';
  input: {
    audioUrl?: URL;
    text?: string;
    language?: string;
  };
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    customPrompt?: string;
  };
}

/**
 * AI 處理回應
 */
export interface AIProcessingResponse {
  result: {
    text?: string;
    summary?: AISummary;
    insights?: AIInsight[];
  };
  usage: {
    tokensUsed: number;
    cost: number;
    duration: number; // ms
  };
}

// ============================================================================
// Storage 型別
// ============================================================================

/**
 * 檔案元資料
 */
export interface FileMetadata extends FullMetadata {
  customMetadata?: {
    uploadedBy: UserId;
    organizationId: OrganizationId;
    type: FileType;
    encrypted?: boolean;
    checksum?: string;
  };
}

/**
 * 檔案類型
 */
export type FileType = 
  | 'audio'
  | 'video'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'other';

/**
 * 上傳進度
 */
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  metadata?: FileMetadata;
  ref?: StorageReference;
  task?: UploadTask;
}

// ============================================================================
// 查詢和篩選型別
// ============================================================================

/**
 * 查詢運算子
 */
export type QueryOperator = WhereFilterOp;

/**
 * 排序方向
 */
export type SortDirection = OrderByDirection;

/**
 * 查詢條件
 */
export interface QueryCondition {
  field: string;
  operator: QueryOperator;
  value: any;
}

/**
 * 查詢選項
 */
export interface QueryOptions {
  conditions?: QueryCondition[];
  orderBy?: {
    field: string;
    direction: SortDirection;
  }[];
  limit?: number;
  offset?: number;
  startAfter?: DocumentSnapshot;
  endBefore?: DocumentSnapshot;
}

/**
 * 分頁資訊
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 查詢結果
 */
export interface QueryResult<T> {
  data: T[];
  pagination?: PaginationInfo;
  metadata?: {
    executionTime: number;
    fromCache: boolean;
  };
}

// ============================================================================
// 批次操作型別
// ============================================================================

/**
 * 批次操作類型
 */
export type BatchOperationType = 'create' | 'update' | 'delete' | 'set';

/**
 * 批次操作項目
 */
export interface BatchOperation<T = unknown> {
  type: BatchOperationType;
  path: string;
  data?: T;
  options?: {
    merge?: boolean;
    mergeFields?: string[];
  };
}

/**
 * 批次操作結果
 */
export interface BatchResult {
  success: boolean;
  operationsCount: number;
  failedOperations?: Array<{
    operation: BatchOperation;
    error: Error;
  }>;
}

// ============================================================================
// 實時更新型別
// ============================================================================

/**
 * 實時監聽器
 */
export interface RealtimeListener {
  id: string;
  path: string;
  type: 'document' | 'collection' | 'query';
  callback: (snapshot: DocumentSnapshot | QuerySnapshot) => void;
  errorCallback?: (error: Error) => void;
  unsubscribe: () => void;
}

/**
 * 實時更新事件
 */
export interface RealtimeEvent<T = unknown> {
  type: 'added' | 'modified' | 'removed';
  data: T;
  metadata: {
    timestamp: Timestamp;
    source: 'local' | 'server';
  };
}

// ============================================================================
// 安全性型別
// ============================================================================

/**
 * 安全設定
 */
export interface SecuritySettings {
  twoFactorAuth: boolean;
  ipWhitelist?: string[];
  sessionTimeout: number; // 分鐘
  passwordPolicy: PasswordPolicy;
  auditLog: boolean;
}

/**
 * 密碼政策
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays?: number;
  preventReuse?: number;
}

/**
 * 稽核日誌
 */
export interface AuditLog {
  id: string;
  userId: UserId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  success: boolean;
  error?: string;
}

// ============================================================================
// 整合型別
// ============================================================================

/**
 * 整合配置
 */
export interface Integration {
  id: string;
  type: IntegrationType;
  enabled: boolean;
  config: IntegrationConfig;
  lastSync?: Timestamp;
  status: 'active' | 'inactive' | 'error';
}

/**
 * 整合類型
 */
export type IntegrationType = 
  | 'google_workspace'
  | 'microsoft_365'
  | 'slack'
  | 'salesforce'
  | 'hubspot'
  | 'webhook'
  | 'api';

/**
 * 整合配置
 */
export interface IntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: URL;
  authToken?: string;
  refreshToken?: string;
  expiresAt?: Timestamp;
  mappings?: FieldMapping[];
  syncOptions?: SyncOptions;
}

/**
 * 欄位映射
 */
export interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
}

/**
 * 同步選項
 */
export interface SyncOptions {
  direction: 'import' | 'export' | 'bidirectional';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  includeDeleted: boolean;
  batchSize: number;
}

// ============================================================================
// 錯誤處理型別
// ============================================================================

/**
 * Firebase 錯誤基礎介面
 */
export interface FirebaseError extends Error {
  code: string;
  customData?: unknown;
}

/**
 * Firestore 錯誤代碼
 */
export type FirestoreErrorCode = 
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

/**
 * Storage 錯誤代碼
 */
export type StorageErrorCode = 
  | 'storage/unknown'
  | 'storage/object-not-found'
  | 'storage/bucket-not-found'
  | 'storage/project-not-found'
  | 'storage/quota-exceeded'
  | 'storage/unauthenticated'
  | 'storage/unauthorized'
  | 'storage/retry-limit-exceeded'
  | 'storage/invalid-checksum'
  | 'storage/canceled'
  | 'storage/invalid-event-name'
  | 'storage/invalid-url'
  | 'storage/invalid-argument'
  | 'storage/no-default-bucket'
  | 'storage/cannot-slice-blob'
  | 'storage/server-file-wrong-size';

/**
 * Functions 錯誤代碼
 */
export type FunctionsErrorCode = 
  | 'functions/ok'
  | 'functions/cancelled'
  | 'functions/unknown'
  | 'functions/invalid-argument'
  | 'functions/deadline-exceeded'
  | 'functions/not-found'
  | 'functions/already-exists'
  | 'functions/permission-denied'
  | 'functions/resource-exhausted'
  | 'functions/failed-precondition'
  | 'functions/aborted'
  | 'functions/out-of-range'
  | 'functions/unimplemented'
  | 'functions/internal'
  | 'functions/unavailable'
  | 'functions/data-loss'
  | 'functions/unauthenticated';

// ============================================================================
// 實用工具型別
// ============================================================================

/**
 * 深度部分型別
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必要型別
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 深度唯讀型別
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 可為空型別
 */
export type Nullable<T> = T | null;

/**
 * 可選型別
 */
export type Optional<T> = T | undefined;

/**
 * 非空型別
 */
export type NonNullable<T> = Exclude<T, null | undefined>;

/**
 * 陣列元素型別
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Promise 解包型別
 */
export type Unpromise<T> = T extends Promise<infer U> ? U : T;

/**
 * 函數參數型別
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * 函數返回型別
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// ============================================================================
// 型別守衛
// ============================================================================

/**
 * 檢查是否為有效的 Email
 */
export function isEmail(value: string): value is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 檢查是否為有效的 URL
 */
export function isURL(value: string): value is URL {
  try {
    new globalThis.URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 檢查是否為 Firebase 錯誤
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return error instanceof Error && 'code' in error;
}

/**
 * 檢查是否為認證錯誤
 */
export function isAuthError(error: unknown): error is AuthenticationError {
  return isFirebaseError(error) && error.code.startsWith('auth/');
}

/**
 * 檢查是否為 Firestore 錯誤
 */
export function isFirestoreError(error: unknown): error is FirebaseError {
  return isFirebaseError(error) && !error.code.includes('/');
}

/**
 * 檢查是否為 Storage 錯誤
 */
export function isStorageError(error: unknown): error is FirebaseError {
  return isFirebaseError(error) && error.code.startsWith('storage/');
}

/**
 * 檢查是否為 Functions 錯誤
 */
export function isFunctionsError(error: unknown): error is FirebaseError {
  return isFirebaseError(error) && error.code.startsWith('functions/');
}

/**
 * 檢查是否為有效的 Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value !== null && 
         typeof value === 'object' && 
         'seconds' in value && 
         'nanoseconds' in value;
}

/**
 * 檢查是否為有效的 DocumentReference
 */
export function isDocumentReference(value: unknown): value is DocumentReference {
  return value !== null && 
         typeof value === 'object' && 
         'id' in value && 
         'path' in value && 
         'parent' in value;
}

// ============================================================================
// 型別轉換工具
// ============================================================================

/**
 * 將 Timestamp 轉換為 Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * 將 Date 轉換為 Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return FirestoreTimestamp.fromDate(date);
}

/**
 * 將字串轉換為 Email（含驗證）
 */
export function toEmail(value: string): Email {
  if (!isEmail(value)) {
    throw new Error(`Invalid email: ${value}`);
  }
  return value as Email;
}

/**
 * 將字串轉換為 URL（含驗證）
 */
export function toURL(value: string): URL {
  if (!isURL(value)) {
    throw new Error(`Invalid URL: ${value}`);
  }
  return value as URL;
}

/**
 * 安全地取得巢狀屬性
 */
export function getNestedProperty<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined {
  try {
    return obj[key];
  } catch {
    return undefined;
  }
}

/**
 * 深度合併物件
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        !isTimestamp(source[key]) &&
        !isDocumentReference(source[key])
      ) {
        output[key] = deepMerge(
          output[key] as any,
          source[key] as any
        );
      } else {
        output[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }
  
  return output;
}

// ============================================================================
// 匯出型別
// ============================================================================

export type {
  // Firebase 原生型別重新匯出
  FirestoreTimestamp,
  FieldValue,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  WriteBatch,
  Transaction,
  WhereFilterOp,
  OrderByDirection,
  SnapshotOptions,
  
  // Auth 型別重新匯出
  FirebaseUser,
  UserCredential,
  AuthError,
  IdTokenResult,
  ActionCodeSettings,
  AuthProvider,
  MultiFactorResolver,
  UserInfo,
  
  // Storage 型別重新匯出
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  UploadMetadata,
  FullMetadata,
  ListResult,
  
  // Functions 型別重新匯出
  HttpsCallable,
  HttpsCallableResult,
  FirebaseFunctions
};