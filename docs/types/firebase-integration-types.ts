/**
 * DonnaAI Firebase 整合型別定義
 * 提供 Firebase 服務相關的型別定義
 * 
 * @module FirebaseIntegrationTypes
 * @version 1.0.0
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// Firebase 認證型別
// ============================================================================

/**
 * Firebase 用戶資料
 */
export interface FirebaseUser {
  readonly uid: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  readonly phoneNumber: string | null;
  readonly providerId: string;
  readonly createdAt: string;
  readonly lastLoginAt: string;
  readonly customClaims?: FirebaseCustomClaims;
}

/**
 * Firebase 自訂聲明
 */
export interface FirebaseCustomClaims {
  readonly role?: string;
  readonly organizationId?: string;
  readonly teamIds?: string[];
  readonly permissions?: string[];
  readonly isSuperAdmin?: boolean;
  readonly [key: string]: unknown;
}

/**
 * Firebase 認證錯誤代碼
 */
export enum FirebaseAuthErrorCode {
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  INVALID_EMAIL = 'auth/invalid-email',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  WEAK_PASSWORD = 'auth/weak-password',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  INVALID_CREDENTIAL = 'auth/invalid-credential',
  CREDENTIAL_ALREADY_IN_USE = 'auth/credential-already-in-use',
  EXPIRED_ACTION_CODE = 'auth/expired-action-code',
  INVALID_ACTION_CODE = 'auth/invalid-action-code',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
}

/**
 * Firebase 認證提供者
 */
export enum AuthProvider {
  EMAIL = 'password',
  GOOGLE = 'google.com',
  FACEBOOK = 'facebook.com',
  APPLE = 'apple.com',
  GITHUB = 'github.com',
  TWITTER = 'twitter.com',
  MICROSOFT = 'microsoft.com',
}

/**
 * Firebase ID Token 結果
 */
export interface IdTokenResult {
  readonly token: string;
  readonly expirationTime: string;
  readonly authTime: string;
  readonly issuedAtTime: string;
  readonly signInProvider: string | null;
  readonly signInSecondFactor: string | null;
  readonly claims: FirebaseCustomClaims;
}

// ============================================================================
// Firestore 型別
// ============================================================================

/**
 * Firestore 時間戳記型別
 */
export type FirestoreTimestamp = Timestamp;

/**
 * Firestore 欄位值型別
 */
export type FirestoreFieldValue = FieldValue;

/**
 * Firestore 文件資料基礎介面
 */
export interface FirestoreDocument {
  readonly id?: string;
  readonly createdAt?: FirestoreTimestamp | FirestoreFieldValue;
  readonly updatedAt?: FirestoreTimestamp | FirestoreFieldValue;
  readonly createdBy?: string;
  readonly updatedBy?: string;
}

/**
 * Firestore 集合名稱
 */
export enum FirestoreCollection {
  USERS = 'users',
  ORGANIZATIONS = 'organizations',
  TEAMS = 'teams',
  CUSTOMERS = 'customers',
  RECORDS = 'records',
  TASKS = 'tasks',
  CUSTOM_FIELDS = 'customFields',
  ACTIVITY_LOGS = 'activityLogs',
  NOTIFICATIONS = 'notifications',
  FILES = 'files',
  SETTINGS = 'settings',
  SAVED_REPORTS = 'savedReports',
  AI_SESSIONS = 'aiSessions',
}

/**
 * Firestore 查詢運算子
 */
export enum QueryOperator {
  EQUAL = '==',
  NOT_EQUAL = '!=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  ARRAY_CONTAINS = 'array-contains',
  ARRAY_CONTAINS_ANY = 'array-contains-any',
  IN = 'in',
  NOT_IN = 'not-in',
}

/**
 * Firestore 查詢排序方向
 */
export type QueryOrderDirection = 'asc' | 'desc';

/**
 * Firestore 批次操作類型
 */
export enum BatchOperationType {
  SET = 'set',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Firestore 批次操作項目
 */
export interface BatchOperation<T = unknown> {
  readonly type: BatchOperationType;
  readonly collection: FirestoreCollection;
  readonly documentId: string;
  readonly data?: T;
  readonly merge?: boolean;
}

/**
 * Firestore 交易操作
 */
export interface TransactionOperation<T = unknown> {
  readonly operation: 'get' | 'set' | 'update' | 'delete';
  readonly collection: FirestoreCollection;
  readonly documentId: string;
  readonly data?: T;
}

/**
 * Firestore 錯誤代碼
 */
export enum FirestoreErrorCode {
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
  INVALID_ARGUMENT = 'invalid-argument',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  PERMISSION_DENIED = 'permission-denied',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  FAILED_PRECONDITION = 'failed-precondition',
  ABORTED = 'aborted',
  OUT_OF_RANGE = 'out-of-range',
  UNIMPLEMENTED = 'unimplemented',
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  DATA_LOSS = 'data-loss',
  UNAUTHENTICATED = 'unauthenticated',
}

// ============================================================================
// Firebase Storage 型別
// ============================================================================

/**
 * Storage 檔案元資料
 */
export interface StorageFileMetadata {
  readonly bucket: string;
  readonly fullPath: string;
  readonly generation: string;
  readonly metageneration: string;
  readonly name: string;
  readonly size: number;
  readonly timeCreated: string;
  readonly updated: string;
  readonly contentType?: string;
  readonly contentDisposition?: string;
  readonly contentEncoding?: string;
  readonly contentLanguage?: string;
  readonly cacheControl?: string;
  readonly customMetadata?: Record<string, string>;
  readonly md5Hash?: string;
}

/**
 * Storage 上傳任務狀態
 */
export enum UploadTaskState {
  RUNNING = 'running',
  PAUSED = 'paused',
  SUCCESS = 'success',
  CANCELED = 'canceled',
  ERROR = 'error',
}

/**
 * Storage 上傳進度
 */
export interface UploadProgress {
  readonly bytesTransferred: number;
  readonly totalBytes: number;
  readonly state: UploadTaskState;
  readonly metadata?: StorageFileMetadata;
  readonly ref?: StorageReference;
}

/**
 * Storage 參考
 */
export interface StorageReference {
  readonly bucket: string;
  readonly fullPath: string;
  readonly name: string;
  readonly parent: StorageReference | null;
  readonly root: StorageReference;
  readonly storage: unknown;
}

/**
 * Storage 錯誤代碼
 */
export enum StorageErrorCode {
  UNKNOWN = 'storage/unknown',
  OBJECT_NOT_FOUND = 'storage/object-not-found',
  BUCKET_NOT_FOUND = 'storage/bucket-not-found',
  PROJECT_NOT_FOUND = 'storage/project-not-found',
  QUOTA_EXCEEDED = 'storage/quota-exceeded',
  UNAUTHENTICATED = 'storage/unauthenticated',
  UNAUTHORIZED = 'storage/unauthorized',
  RETRY_LIMIT_EXCEEDED = 'storage/retry-limit-exceeded',
  INVALID_CHECKSUM = 'storage/invalid-checksum',
  CANCELED = 'storage/canceled',
  INVALID_EVENT_NAME = 'storage/invalid-event-name',
  INVALID_URL = 'storage/invalid-url',
  INVALID_ARGUMENT = 'storage/invalid-argument',
  NO_DEFAULT_BUCKET = 'storage/no-default-bucket',
  CANNOT_SLICE_BLOB = 'storage/cannot-slice-blob',
  SERVER_FILE_WRONG_SIZE = 'storage/server-file-wrong-size',
}

// ============================================================================
// Firebase Functions 型別
// ============================================================================

/**
 * Cloud Function 觸發器類型
 */
export enum FunctionTriggerType {
  HTTPS = 'https',
  CALLABLE = 'callable',
  FIRESTORE = 'firestore',
  DATABASE = 'database',
  AUTH = 'auth',
  STORAGE = 'storage',
  PUBSUB = 'pubsub',
  SCHEDULE = 'schedule',
}

/**
 * Cloud Function 請求
 */
export interface CloudFunctionRequest<T = unknown> {
  readonly data: T;
  readonly auth?: {
    readonly uid: string;
    readonly token: FirebaseCustomClaims;
  };
  readonly rawRequest?: unknown;
}

/**
 * Cloud Function 回應
 */
export interface CloudFunctionResponse<T = unknown> {
  readonly data?: T;
  readonly error?: CloudFunctionError;
}

/**
 * Cloud Function 錯誤
 */
export interface CloudFunctionError {
  readonly code: FunctionErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Cloud Function 錯誤代碼
 */
export enum FunctionErrorCode {
  OK = 'ok',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
  INVALID_ARGUMENT = 'invalid-argument',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  PERMISSION_DENIED = 'permission-denied',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  FAILED_PRECONDITION = 'failed-precondition',
  ABORTED = 'aborted',
  OUT_OF_RANGE = 'out-of-range',
  UNIMPLEMENTED = 'unimplemented',
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  DATA_LOSS = 'data-loss',
  UNAUTHENTICATED = 'unauthenticated',
}

// ============================================================================
// Firebase 安全規則型別
// ============================================================================

/**
 * 安全規則權限
 */
export interface SecurityRulePermissions {
  readonly read: boolean;
  readonly write: boolean;
  readonly create: boolean;
  readonly update: boolean;
  readonly delete: boolean;
  readonly list: boolean;
}

/**
 * 安全規則上下文
 */
export interface SecurityRuleContext {
  readonly auth: {
    readonly uid: string;
    readonly token: FirebaseCustomClaims;
  } | null;
  readonly resource: {
    readonly data: Record<string, unknown>;
    readonly id: string;
  };
  readonly request: {
    readonly time: FirestoreTimestamp;
    readonly resource: {
      readonly data: Record<string, unknown>;
    };
  };
}

// ============================================================================
// Firebase Admin SDK 型別
// ============================================================================

/**
 * Admin 用戶記錄
 */
export interface AdminUserRecord {
  readonly uid: string;
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly phoneNumber?: string;
  readonly disabled: boolean;
  readonly metadata: {
    readonly creationTime?: string;
    readonly lastSignInTime?: string;
    readonly lastRefreshTime?: string;
  };
  readonly providerData: Array<{
    readonly uid: string;
    readonly displayName?: string;
    readonly email?: string;
    readonly phoneNumber?: string;
    readonly photoURL?: string;
    readonly providerId: string;
  }>;
  readonly customClaims?: FirebaseCustomClaims;
  readonly tokensValidAfterTime?: string;
}

/**
 * Admin 建立用戶請求
 */
export interface AdminCreateUserRequest {
  readonly email?: string;
  readonly emailVerified?: boolean;
  readonly phoneNumber?: string;
  readonly password?: string;
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly disabled?: boolean;
  readonly uid?: string;
}

/**
 * Admin 更新用戶請求
 */
export interface AdminUpdateUserRequest {
  readonly email?: string;
  readonly emailVerified?: boolean;
  readonly phoneNumber?: string;
  readonly password?: string;
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly disabled?: boolean;
}

/**
 * Admin 列表用戶結果
 */
export interface AdminListUsersResult {
  readonly users: AdminUserRecord[];
  readonly pageToken?: string;
}

// ============================================================================
// Firebase 配置型別
// ============================================================================

/**
 * Firebase 應用配置
 */
export interface FirebaseAppConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId?: string;
}

/**
 * Firebase Admin 配置
 */
export interface FirebaseAdminConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
  readonly databaseURL?: string;
  readonly storageBucket?: string;
}

/**
 * Firebase 模擬器配置
 */
export interface EmulatorConfig {
  readonly auth?: {
    readonly host: string;
    readonly port: number;
  };
  readonly firestore?: {
    readonly host: string;
    readonly port: number;
  };
  readonly storage?: {
    readonly host: string;
    readonly port: number;
  };
  readonly functions?: {
    readonly host: string;
    readonly port: number;
  };
  readonly database?: {
    readonly host: string;
    readonly port: number;
  };
}

// ============================================================================
// 型別守衛
// ============================================================================

/**
 * 檢查是否為 Firestore 時間戳記
 */
export function isFirestoreTimestamp(value: unknown): value is FirestoreTimestamp {
  return value !== null && 
         typeof value === 'object' && 
         'seconds' in value && 
         'nanoseconds' in value;
}

/**
 * 檢查是否為 Firebase 認證錯誤
 */
export function isFirebaseAuthError(error: unknown): error is { code: FirebaseAuthErrorCode } {
  return error !== null &&
         typeof error === 'object' &&
         'code' in error &&
         typeof (error as any).code === 'string' &&
         (error as any).code.startsWith('auth/');
}

/**
 * 檢查是否為 Firestore 錯誤
 */
export function isFirestoreError(error: unknown): error is { code: FirestoreErrorCode } {
  return error !== null &&
         typeof error === 'object' &&
         'code' in error &&
         Object.values(FirestoreErrorCode).includes((error as any).code);
}

/**
 * 檢查是否為 Storage 錯誤
 */
export function isStorageError(error: unknown): error is { code: StorageErrorCode } {
  return error !== null &&
         typeof error === 'object' &&
         'code' in error &&
         typeof (error as any).code === 'string' &&
         (error as any).code.startsWith('storage/');
}