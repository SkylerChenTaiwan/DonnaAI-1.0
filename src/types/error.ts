/**
 * 錯誤相關的型別定義
 */

/**
 * 裝置資訊
 */
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model?: string;
  isDevice: boolean;
}

/**
 * 錯誤報告
 */
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack?: string;
    componentStack?: string;
    name?: string;
    code?: string;
  };
  context: {
    userId?: string;
    screen?: string;
    action?: string;
    deviceInfo?: DeviceInfo;
    additionalData?: Record<string, any>;
  };
  handled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 錯誤邊界狀態
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * React 錯誤資訊
 */
export interface ErrorInfo {
  componentStack: string;
}

/**
 * 錯誤處理選項
 */
export interface ErrorHandlingOptions {
  silent?: boolean;
  retry?: boolean;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
}

/**
 * 錯誤分類
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  FIREBASE = 'FIREBASE',
  STORAGE = 'STORAGE',
  SYNC = 'SYNC',
  COMPONENT = 'COMPONENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 錯誤恢復建議
 */
export interface ErrorRecoverySuggestion {
  action: string;
  description: string;
  handler?: () => void | Promise<void>;
}