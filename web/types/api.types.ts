/**
 * API 相關型別定義
 */

// API 回應狀態列舉
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
}

// API 錯誤代碼列舉
export enum ApiErrorCode {
  // 認證錯誤
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // 驗證錯誤
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // 資源錯誤
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // 速率限制
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // 伺服器錯誤
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // 其他
  BAD_REQUEST = 'BAD_REQUEST',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// API 成功回應介面
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: ApiMetadata;
}

// API 錯誤回應介面
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ApiErrorCode;
  details?: Record<string, any>;
  timestamp?: string;
  path?: string;
  requestId?: string;
}

// API 回應型別
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// API 元資料介面
export interface ApiMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMetadata;
  rateLimit?: RateLimitMetadata;
  cache?: CacheMetadata;
}

// 分頁元資料介面
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 速率限制元資料介面
export interface RateLimitMetadata {
  limit: number;
  remaining: number;
  reset: string;
}

// 快取元資料介面
export interface CacheMetadata {
  cached: boolean;
  cacheKey?: string;
  cacheTime?: string;
  ttl?: number;
}

// API 請求配置介面
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  withCredentials?: boolean;
}

// API 端點配置介面
export interface ApiEndpoint {
  path: string;
  method: ApiRequestConfig['method'];
  auth: boolean;
  roles?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  validation?: {
    body?: any; // JSON Schema or validation function
    query?: any;
    params?: any;
  };
}

// API 錯誤詳情介面
export interface ApiErrorDetails {
  field?: string;
  message: string;
  value?: any;
  constraint?: string;
}

// API 批次請求介面
export interface ApiBatchRequest {
  id: string;
  endpoint: string;
  method: ApiRequestConfig['method'];
  data?: any;
  params?: Record<string, any>;
}

// API 批次回應介面
export interface ApiBatchResponse {
  id: string;
  success: boolean;
  response?: any;
  error?: ApiErrorResponse;
}

// API 健康檢查介面
export interface ApiHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    database: ServiceHealth;
    cache?: ServiceHealth;
    storage?: ServiceHealth;
    queue?: ServiceHealth;
    [key: string]: ServiceHealth | undefined;
  };
}

// 服務健康狀態介面
export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck?: string;
  error?: string;
}

// API 版本資訊介面
export interface ApiVersion {
  current: string;
  supported: string[];
  deprecated: string[];
  sunset: Record<string, string>; // version -> sunset date
}

// API 文件介面
export interface ApiDocumentation {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  authentication: {
    type: 'bearer' | 'api-key' | 'oauth2';
    description: string;
  };
  rateLimits: {
    default: {
      requests: number;
      window: string;
    };
    endpoints?: Record<string, { requests: number; window: string }>;
  };
}

// WebSocket 訊息介面
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
}

// WebSocket 事件介面
export interface WebSocketEvent {
  type: 'open' | 'close' | 'error' | 'message';
  data?: any;
  error?: Error;
  timestamp: string;
}

// 檔案上傳介面
export interface FileUploadRequest {
  file: File;
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    folder?: string;
  };
  options?: {
    public?: boolean;
    overwrite?: boolean;
    generateThumbnail?: boolean;
  };
}

// 檔案上傳回應介面
export interface FileUploadResponse {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
}