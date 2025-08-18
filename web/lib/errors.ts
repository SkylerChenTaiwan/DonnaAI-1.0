/**
 * 錯誤處理工具和類型定義
 */

// 標準化的錯誤類型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: string;
  source?: 'client' | 'server' | 'network';
}

// 錯誤碼常數
export const ErrorCodes = {
  // 網路錯誤
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  
  // 認證錯誤
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 驗證錯誤
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // 資料錯誤
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // 系統錯誤
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // 使用者錯誤
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
} as const;

// 錯誤嚴重性等級
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorWithSeverity extends AppError {
  severity: ErrorSeverity;
}

// 自訂錯誤類別
export class AppErrorClass extends Error implements AppError {
  public code: string;
  public statusCode?: number;
  public timestamp: string;
  public source?: 'client' | 'server' | 'network';
  public details?: any;

  constructor(
    code: string,
    message: string,
    statusCode?: number,
    source?: 'client' | 'server' | 'network',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.source = source;
    this.details = details;
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      source: this.source,
      details: this.details,
    };
  }
}

// 錯誤工廠函數
export const createError = {
  network: (message: string, details?: any) => 
    new AppErrorClass(ErrorCodes.NETWORK_ERROR, message, 0, 'network', details),
    
  unauthorized: (message: string = '未授權的請求') => 
    new AppErrorClass(ErrorCodes.UNAUTHORIZED, message, 401, 'server'),
    
  forbidden: (message: string = '無權限執行此操作') => 
    new AppErrorClass(ErrorCodes.FORBIDDEN, message, 403, 'server'),
    
  notFound: (message: string = '找不到請求的資源') => 
    new AppErrorClass(ErrorCodes.NOT_FOUND, message, 404, 'server'),
    
  validation: (message: string, details?: any) => 
    new AppErrorClass(ErrorCodes.VALIDATION_ERROR, message, 400, 'client', details),
    
  internal: (message: string = '內部系統錯誤', details?: any) => 
    new AppErrorClass(ErrorCodes.INTERNAL_ERROR, message, 500, 'server', details),
    
  custom: (code: string, message: string, statusCode?: number, source?: 'client' | 'server' | 'network', details?: any) =>
    new AppErrorClass(code, message, statusCode, source, details),
};

// 錯誤嚴重性評估
export function getErrorSeverity(error: AppError): ErrorSeverity {
  if (!error.statusCode) return 'medium';
  
  if (error.statusCode >= 500) return 'critical';
  if (error.statusCode >= 400 && error.statusCode < 500) return 'medium';
  if (error.code === ErrorCodes.NETWORK_ERROR) return 'high';
  if (error.code === ErrorCodes.TOKEN_EXPIRED) return 'low';
  
  return 'medium';
}

// 錯誤訊息本地化
export const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: '網路連線發生問題，請檢查您的網路狀態',
  [ErrorCodes.CONNECTION_FAILED]: '無法連接到伺服器，請稍後再試',
  [ErrorCodes.TIMEOUT]: '請求逾時，請稍後再試',
  [ErrorCodes.UNAUTHORIZED]: '請先登入後再進行此操作',
  [ErrorCodes.FORBIDDEN]: '您沒有權限執行此操作',
  [ErrorCodes.TOKEN_EXPIRED]: '登入已過期，請重新登入',
  [ErrorCodes.INVALID_CREDENTIALS]: '用戶名或密碼錯誤',
  [ErrorCodes.VALIDATION_ERROR]: '輸入的資料格式不正確',
  [ErrorCodes.REQUIRED_FIELD_MISSING]: '請填寫所有必填欄位',
  [ErrorCodes.INVALID_FORMAT]: '資料格式不正確',
  [ErrorCodes.NOT_FOUND]: '找不到請求的資料',
  [ErrorCodes.DUPLICATE_ENTRY]: '資料已存在，請勿重複建立',
  [ErrorCodes.CONSTRAINT_VIOLATION]: '操作違反資料完整性約束',
  [ErrorCodes.INTERNAL_ERROR]: '系統發生錯誤，請聯絡技術支援',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '服務暫時無法使用，請稍後再試',
  [ErrorCodes.DATABASE_ERROR]: '資料庫連接錯誤',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: '權限不足，無法執行此操作',
  [ErrorCodes.QUOTA_EXCEEDED]: '已達到使用限額',
  [ErrorCodes.OPERATION_NOT_ALLOWED]: '不允許的操作',
} as const;

// 取得使用者友好的錯誤訊息
export function getUserFriendlyMessage(error: AppError): string {
  return ErrorMessages[error.code as keyof typeof ErrorMessages] || error.message || '發生未知錯誤';
}

// 錯誤日誌記錄
export interface ErrorLogEntry {
  error: AppError;
  severity: ErrorSeverity;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  additionalContext?: Record<string, any>;
}

export function logError(error: AppError, additionalContext?: Record<string, any>): ErrorLogEntry {
  const severity = getErrorSeverity(error);
  const logEntry: ErrorLogEntry = {
    error,
    severity,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    additionalContext,
  };

  // 在開發環境下輸出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 App Error [${severity.toUpperCase()}]`);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Source:', error.source);
    console.error('Timestamp:', error.timestamp);
    if (error.details) console.error('Details:', error.details);
    if (additionalContext) console.error('Context:', additionalContext);
    console.groupEnd();
  }

  // TODO: 生產環境下發送到錯誤追蹤服務（如 Sentry）
  
  return logEntry;
}

// API 錯誤處理工具
export function handleApiError(response: Response, data?: any): AppError {
  let error: AppError;

  switch (response.status) {
    case 400:
      error = createError.validation(
        data?.message || '請求參數錯誤',
        data?.details
      );
      break;
    case 401:
      error = createError.unauthorized(data?.message);
      break;
    case 403:
      error = createError.forbidden(data?.message);
      break;
    case 404:
      error = createError.notFound(data?.message);
      break;
    case 409:
      error = createError.custom(
        data?.code || ErrorCodes.CONSTRAINT_VIOLATION,
        data?.message || '資料衝突',
        409,
        'server',
        data?.details
      );
      break;
    case 429:
      error = createError.custom(
        ErrorCodes.QUOTA_EXCEEDED,
        '請求過於頻繁，請稍後再試',
        429,
        'server'
      );
      break;
    case 500:
    default:
      error = createError.internal(
        data?.message || '伺服器內部錯誤',
        data?.details
      );
      break;
  }

  logError(error, { responseStatus: response.status, responseData: data });
  return error;
}