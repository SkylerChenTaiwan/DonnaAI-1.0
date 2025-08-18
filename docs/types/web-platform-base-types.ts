/**
 * Next.js 14 Web Platform 基礎型別架構
 * PRP-120: Next.js Web Platform Foundation
 * 
 * 此檔案定義了 Next.js Web 平台的完整型別系統，
 * 確保與現有 React Native 專案的型別相容性
 * 
 * @version 1.0.0
 * @date 2025-08-18
 */

/* ============================================
   1. 基礎共享型別（與 RN 相容）
   ============================================ */

import type { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { User as BaseUser, UserRole, Organization, Team } from '@/types/entities';

// 重新匯出核心實體型別以確保一致性
export type {
  User,
  UserRole,
  Organization,
  Team,
  BaseUser,
  UserWithTeams,
  CreateUserData,
  UpdateUserData,
} from '@/types/entities/user';

export type {
  BaseOrganization,
  OrganizationSettings,
  OrganizationStats,
  MonthlyUsage,
  CreateOrganizationData,
  UpdateOrganizationData,
} from '@/types/entities/organization';

/* ============================================
   2. Next.js 14 App Router 專用型別
   ============================================ */

/**
 * Next.js 頁面參數型別
 */
export interface PageParams {
  params: Record<string, string | string[]>;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Next.js 動態路由參數
 */
export interface DynamicRouteParams {
  params: {
    [key: string]: string;
  };
}

/**
 * Next.js Layout 元件 Props
 */
export interface LayoutProps {
  children: React.ReactNode;
  params?: Record<string, string>;
}

/**
 * Next.js 錯誤頁面 Props
 */
export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js Metadata 型別
 */
export interface PageMetadata {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  keywords?: string[];
  authors?: Array<{ name?: string; url?: string }>;
  creator?: string;
  publisher?: string;
  formatDetection?: {
    email?: boolean;
    address?: boolean;
    telephone?: boolean;
  };
  metadataBase?: URL;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    locale?: string;
    type?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    images?: string[];
    creator?: string;
    site?: string;
  };
  icons?: {
    icon?: string | string[] | { url: string; sizes?: string; type?: string };
    shortcut?: string | string[];
    apple?: string | string[] | { url: string; sizes?: string; type?: string };
    other?: Array<{
      rel: string;
      url: string;
      sizes?: string;
      type?: string;
    }>;
  };
  manifest?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  viewport?: {
    width?: string | number;
    height?: string | number;
    initialScale?: number;
    maximumScale?: number;
    minimumScale?: number;
    userScalable?: boolean;
    viewportFit?: 'auto' | 'cover' | 'contain';
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
    nocache?: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      noimageindex?: boolean;
      'max-video-preview'?: number | string;
      'max-image-preview'?: 'none' | 'standard' | 'large';
      'max-snippet'?: number;
    };
  };
}

/* ============================================
   3. API Routes 型別定義
   ============================================ */

/**
 * API 路由回應型別（統一格式）
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * API 錯誤型別
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // 僅在開發環境
}

/**
 * 分頁參數
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分頁回應
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API 路由處理器型別
 */
export type ApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void> | void;

/**
 * Next.js API 請求（擴展版）
 */
export interface NextApiRequest {
  method?: string;
  headers: Record<string, string | string[]>;
  query: Record<string, string | string[]>;
  body?: any;
  cookies: Record<string, string>;
  url?: string;
  // 自訂擴展
  user?: AuthenticatedUser;
  organization?: Organization;
  requestId?: string;
}

/**
 * Next.js API 回應（擴展版）
 */
export interface NextApiResponse<T = any> {
  status(code: number): NextApiResponse<T>;
  json(data: T): void;
  send(data: any): void;
  redirect(url: string): void;
  setHeader(name: string, value: string | string[]): NextApiResponse<T>;
  setDraftMode(options: { enable: boolean }): void;
}

/* ============================================
   4. Firebase Admin SDK 型別
   ============================================ */

/**
 * Firebase Admin 認證使用者
 */
export interface AuthenticatedUser extends DecodedIdToken {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  customClaims?: {
    role?: UserRole;
    organizationId?: string;
    teamIds?: string[];
    permissions?: string[];
  };
}

/**
 * Firebase Admin 批次操作
 */
export interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: T;
}

/**
 * Firestore 查詢建構器
 */
export interface QueryBuilder<T> {
  where(field: string, operator: WhereFilterOp, value: any): QueryBuilder<T>;
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryBuilder<T>;
  limit(limit: number): QueryBuilder<T>;
  startAfter(snapshot: any): QueryBuilder<T>;
  get(): Promise<T[]>;
}

/**
 * Firestore Where 運算子
 */
export type WhereFilterOp =
  | '<'
  | '<='
  | '=='
  | '!='
  | '>='
  | '>'
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

/**
 * Firestore 文件基礎型別
 */
export interface FirestoreDocument {
  id?: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Firestore 集合名稱（型別安全）
 */
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  TEAMS: 'teams',
  CUSTOMERS: 'customers',
  RECORDS: 'records',
  TASKS: 'tasks',
  MEETINGS: 'meetings',
  AI_USAGE: 'aiUsage',
  CUSTOM_FIELDS: 'customFields',
  SAVED_REPORTS: 'savedReports',
  NOTIFICATIONS: 'notifications',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/* ============================================
   5. 中間件和認證型別
   ============================================ */

/**
 * 中間件請求上下文
 */
export interface MiddlewareContext {
  user?: AuthenticatedUser;
  organization?: Organization;
  requestId: string;
  startTime: number;
  ip?: string;
  userAgent?: string;
}

/**
 * 中間件設定
 */
export interface MiddlewareConfig {
  matcher?: string[];
  excludePaths?: string[];
  runtime?: 'nodejs' | 'edge';
}

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  uid: string;
  email: string;
  role: UserRole;
  organizationId: string;
  teamIds?: string[];
  exp: number;
  iat: number;
  iss: string;
}

/**
 * Session 資料
 */
export interface SessionData {
  user: AuthenticatedUser;
  organization: Organization;
  teams?: Team[];
  permissions: string[];
  expiresAt: Date;
}

/* ============================================
   6. 頁面和元件 Props 型別
   ============================================ */

/**
 * 伺服器元件 Props 基礎型別
 */
export interface ServerComponentProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * 客戶端元件 Props 基礎型別
 */
export interface ClientComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * 表單元件 Props
 */
export interface FormProps<T = any> {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

/**
 * 表格元件 Props
 */
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * 表格欄位定義
 */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Modal 元件 Props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

/* ============================================
   7. 環境變數型別定義
   ============================================ */

/**
 * 環境變數型別（完整定義）
 */
export interface EnvironmentVariables {
  // Next.js
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_URL: string;
  
  // Firebase Client
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
  
  // Firebase Admin
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  SESSION_SECRET: string;
  SESSION_MAX_AGE?: string;
  
  // AI Services
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  
  // Storage
  STORAGE_BUCKET_NAME?: string;
  STORAGE_CDN_URL?: string;
  
  // Email Service
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;
  
  // Analytics
  GA_MEASUREMENT_ID?: string;
  HOTJAR_ID?: string;
  SENTRY_DSN?: string;
  
  // Feature Flags
  ENABLE_AI_FEATURES?: string;
  ENABLE_ANALYTICS?: string;
  ENABLE_EMAIL_NOTIFICATIONS?: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  
  // Cache
  REDIS_URL?: string;
  CACHE_TTL?: string;
}

// 全域型別擴展
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {}
  }
}

/* ============================================
   8. 錯誤處理型別
   ============================================ */

/**
 * 應用程式錯誤基礎類別
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 錯誤碼定義
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_OPERATION: 'INVALID_OPERATION',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/* ============================================
   9. 工具型別和型別防護
   ============================================ */

/**
 * 深度部分型別
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * 深度唯讀型別
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * 非空陣列
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * 可為 null 型別
 */
export type Nullable<T> = T | null;

/**
 * 可為 undefined 型別
 */
export type Maybe<T> = T | undefined;

/**
 * 提取 Promise 型別
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * 提取陣列元素型別
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 型別防護：檢查是否為非 null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * 型別防護：檢查是否為定義值
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * 型別防護：檢查是否為陣列
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 型別防護：檢查是否為字串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 型別防護：檢查是否為數字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 型別防護：檢查是否為物件
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 型別防護：檢查是否為錯誤
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * 型別防護：檢查是否為 AppError
 */
export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/* ============================================
   10. 共享資料型別（與 RN 相容）
   ============================================ */

/**
 * 客戶資料型別
 */
export interface Customer extends FirestoreDocument {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: string;
  teamId: string;
  organizationId: string;
  notes?: string;
  customFields?: Record<string, any>;
  relatedUserIds?: string[];
  tags?: string[];
  lastContactDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
  aiAutoUpdates?: {
    lastUpdated: Timestamp;
    updatedFields: string[];
    updateSource: string;
  };
}

/**
 * 銷售記錄型別
 */
export interface SalesRecord extends FirestoreDocument {
  customerId: string;
  userId: string;
  teamId: string;
  organizationId: string;
  amount: number;
  date: Timestamp;
  type: 'order' | 'meeting' | 'call' | 'email' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  attachments?: string[];
  customFields?: Record<string, any>;
}

/**
 * 任務型別
 */
export interface Task extends FirestoreDocument {
  title: string;
  description?: string;
  assignedTo: string;
  teamId: string;
  organizationId: string;
  dueDate?: Timestamp;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags?: string[];
  relatedCustomerIds?: string[];
  relatedRecordIds?: string[];
  completedAt?: Timestamp;
  customFields?: Record<string, any>;
}

/**
 * 會議型別
 */
export interface Meeting extends FirestoreDocument {
  title: string;
  customerIds: string[];
  attendeeIds: string[];
  organizationId: string;
  scheduledAt: Timestamp;
  duration?: number;
  location?: string;
  notes?: string;
  audioFileUrl?: string;
  transcription?: string;
  aiSummary?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  customFields?: Record<string, any>;
}

/**
 * 通知型別
 */
export interface Notification extends FirestoreDocument {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'task' | 'meeting' | 'customer' | 'other';
  isRead: boolean;
  readAt?: Timestamp;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * 自訂欄位定義
 */
export interface CustomFieldDefinition extends FirestoreDocument {
  organizationId: string;
  entityType: 'customer' | 'record' | 'task' | 'meeting';
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select/multiselect
  order: number;
  isActive: boolean;
}

/**
 * 儲存的報表
 */
export interface SavedReport extends FirestoreDocument {
  organizationId: string;
  userId: string;
  name: string;
  description?: string;
  type: 'sales' | 'customer' | 'task' | 'custom';
  filters: Record<string, any>;
  columns: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublic: boolean;
  lastAccessedAt?: Timestamp;
}

/* ============================================
   11. Server Actions 型別（App Router）
   ============================================ */

/**
 * Server Action 結果型別
 */
export type ServerActionResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server Action 函數型別
 */
export type ServerAction<TInput = any, TOutput = any> = (
  input: TInput
) => Promise<ServerActionResult<TOutput>>;

/**
 * Form State（用於 useFormState）
 */
export interface FormState<T = any> {
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

/* ============================================
   12. TypeScript 配置建議
   ============================================ */

/**
 * 建議的 tsconfig.json 配置：
 * 
 * {
 *   "compilerOptions": {
 *     "target": "ES2022",
 *     "lib": ["dom", "dom.iterable", "esnext"],
 *     "allowJs": true,
 *     "skipLibCheck": true,
 *     "strict": true,
 *     "noEmit": true,
 *     "esModuleInterop": true,
 *     "module": "esnext",
 *     "moduleResolution": "bundler",
 *     "resolveJsonModule": true,
 *     "isolatedModules": true,
 *     "jsx": "preserve",
 *     "incremental": true,
 *     "plugins": [
 *       {
 *         "name": "next"
 *       }
 *     ],
 *     "paths": {
 *       "@/*": ["./src/*"],
 *       "@/types/*": ["./src/types/*"],
 *       "@/lib/*": ["./src/lib/*"],
 *       "@/components/*": ["./src/components/*"],
 *       "@/app/*": ["./src/app/*"],
 *       "@/services/*": ["./src/services/*"],
 *       "@/utils/*": ["./src/utils/*"],
 *       "@/hooks/*": ["./src/hooks/*"],
 *       "@/styles/*": ["./src/styles/*"],
 *       "@/public/*": ["./public/*"]
 *     },
 *     
 *     // 嚴格型別檢查選項
 *     "strictNullChecks": true,
 *     "strictFunctionTypes": true,
 *     "strictBindCallApply": true,
 *     "strictPropertyInitialization": true,
 *     "noImplicitThis": true,
 *     "useUnknownInCatchVariables": true,
 *     "alwaysStrict": true,
 *     
 *     // 額外檢查
 *     "noUnusedLocals": true,
 *     "noUnusedParameters": true,
 *     "exactOptionalPropertyTypes": true,
 *     "noImplicitReturns": true,
 *     "noFallthroughCasesInSwitch": true,
 *     "noUncheckedIndexedAccess": true,
 *     "noImplicitOverride": true,
 *     "noPropertyAccessFromIndexSignature": true,
 *     "allowUnusedLabels": false,
 *     "allowUnreachableCode": false,
 *     
 *     // 型別宣告
 *     "declaration": true,
 *     "declarationMap": true,
 *     "sourceMap": true,
 *     "removeComments": false,
 *     
 *     // 實驗性功能
 *     "experimentalDecorators": true,
 *     "emitDecoratorMetadata": true
 *   },
 *   "include": [
 *     "next-env.d.ts",
 *     "**/*.ts",
 *     "**/*.tsx",
 *     ".next/types/**/*.ts",
 *     "src/**/*"
 *   ],
 *   "exclude": [
 *     "node_modules",
 *     ".next",
 *     "out",
 *     "dist",
 *     "build",
 *     "coverage",
 *     "**/*.spec.ts",
 *     "**/*.test.ts"
 *   ]
 * }
 */

/* ============================================
   13. 型別安全最佳實踐
   ============================================ */

/**
 * 型別安全最佳實踐指南：
 * 
 * 1. 避免使用 any 型別
 *    - 使用 unknown 取代 any，並進行型別縮小
 *    - 使用泛型參數提供型別彈性
 *    - 使用型別防護函數進行運行時檢查
 * 
 * 2. 使用 strict 模式
 *    - 啟用所有 strict 相關選項
 *    - 特別注意 strictNullChecks
 *    - 使用 noUncheckedIndexedAccess 防止陣列越界
 * 
 * 3. 優先使用 interface 而非 type
 *    - interface 提供更好的錯誤訊息
 *    - 支援宣告合併
 *    - 更適合定義物件形狀
 * 
 * 4. 使用 const assertions
 *    - 建立唯讀元組：as const
 *    - 建立字面量型別
 *    - 防止型別擴展
 * 
 * 5. 正確處理 null 和 undefined
 *    - 使用可選鏈 (?.)
 *    - 使用空值合併 (??)
 *    - 明確標註可為 null 的型別
 * 
 * 6. 使用條件型別和映射型別
 *    - 建立靈活的型別轉換
 *    - 使用內建工具型別（Partial, Required, Pick, Omit 等）
 *    - 建立自訂工具型別
 * 
 * 7. 型別防護和型別斷言
 *    - 優先使用型別防護而非型別斷言
 *    - 使用 is 關鍵字定義使用者定義型別防護
 *    - 避免使用雙重斷言 (as unknown as T)
 * 
 * 8. 泛型約束
 *    - 使用 extends 約束泛型參數
 *    - 提供預設泛型參數
 *    - 使用條件型別推斷
 * 
 * 9. 模組化型別定義
 *    - 將型別定義分離到獨立檔案
 *    - 使用命名空間組織相關型別
 *    - 避免全域型別污染
 * 
 * 10. 與 React Native 型別整合
 *     - 共享核心業務邏輯型別
 *     - 平台特定型別使用條件匯出
 *     - 維護型別版本一致性
 */

/* ============================================
   14. 與現有 RN 型別的整合策略
   ============================================ */

/**
 * 整合策略：
 * 
 * 1. 共享型別目錄結構
 *    shared/
 *    ├── types/
 *    │   ├── entities/      # 核心實體（User, Organization, Team 等）
 *    │   ├── api/          # API 相關型別
 *    │   ├── firebase/     # Firebase 型別
 *    │   └── common/       # 通用型別
 *    
 * 2. 平台特定型別
 *    web/
 *    ├── types/
 *    │   ├── next/         # Next.js 特定型別
 *    │   ├── server/       # 伺服器端型別
 *    │   └── client/       # 客戶端特定型別
 *    
 *    mobile/
 *    ├── types/
 *    │   ├── navigation/   # React Navigation 型別
 *    │   ├── native/       # React Native 特定型別
 *    │   └── expo/         # Expo 特定型別
 * 
 * 3. 型別同步機制
 *    - 使用 TypeScript Project References
 *    - 共享型別套件 (@donnaai/types)
 *    - 自動化型別生成（從 API Schema）
 * 
 * 4. 版本控制
 *    - 使用語意化版本控制
 *    - 維護型別變更日誌
 *    - 提供遷移指南
 * 
 * 5. 型別測試
 *    - 使用 tsd 或 dtslint 測試型別
 *    - 編寫型別測試案例
 *    - CI/CD 整合型別檢查
 */

/* ============================================
   15. 實用型別範例
   ============================================ */

/**
 * API 請求建構範例
 */
export interface ApiRequestBuilder<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  params?: Record<string, string | number>;
  body?: T;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * 表單驗證規則
 */
export interface ValidationRule<T = any> {
  required?: boolean | { value: boolean; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: T) => boolean | string | Promise<boolean | string>;
}

/**
 * 快取策略
 */
export interface CacheStrategy {
  key: string;
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: boolean;
  tags?: string[];
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

/**
 * 檔案上傳
 */
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  preview?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

/**
 * WebSocket 訊息
 */
export interface WebSocketMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * 事件發射器
 */
export interface EventEmitter<TEvents extends Record<string, any>> {
  on<K extends keyof TEvents>(
    event: K,
    listener: (payload: TEvents[K]) => void
  ): void;
  off<K extends keyof TEvents>(
    event: K,
    listener: (payload: TEvents[K]) => void
  ): void;
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
  once<K extends keyof TEvents>(
    event: K,
    listener: (payload: TEvents[K]) => void
  ): void;
}

// 匯出所有型別
export * from './server-actions';
export * from './api-handlers';
export * from './middleware';
export * from './cache';
export * from './validation';