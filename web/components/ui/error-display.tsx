/**
 * 錯誤顯示元件集合
 */

'use client';

import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Home,
  ChevronRight,
  X,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppError, getUserFriendlyMessage, getErrorSeverity } from '@/lib/errors';

// 基礎錯誤顯示屬性
interface BaseErrorProps {
  error: AppError | Error | string;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

// 錯誤嚴重性圖示
function getSeverityIcon(severity: string, className?: string) {
  switch (severity) {
    case 'critical':
      return <XCircle className={cn('text-red-600', className)} />;
    case 'high':
      return <AlertTriangle className={cn('text-orange-600', className)} />;
    case 'medium':
      return <AlertCircle className={cn('text-yellow-600', className)} />;
    case 'low':
      return <Info className={cn('text-blue-600', className)} />;
    default:
      return <AlertTriangle className={cn('text-gray-600', className)} />;
  }
}

// 規範化錯誤物件
function normalizeError(error: AppError | Error | string): AppError {
  if (typeof error === 'string') {
    return {
      code: 'GENERIC_ERROR',
      message: error,
      timestamp: new Date().toISOString(),
    };
  }
  
  if (error instanceof Error) {
    return {
      code: 'GENERIC_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      source: 'client' as const,
    };
  }
  
  return error;
}

// 內聯錯誤訊息
export function InlineError({ 
  error, 
  className, 
  onDismiss,
  showIcon = true,
}: BaseErrorProps & { showIcon?: boolean }) {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  const message = getUserFriendlyMessage(normalizedError);

  const severityClasses = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    low: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-md border text-sm',
      severityClasses[severity] || severityClasses.medium,
      className
    )}>
      {showIcon && getSeverityIcon(severity, 'h-4 w-4 mt-0.5 flex-shrink-0')}
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// 警告橫幅
export function ErrorBanner({ 
  error, 
  className, 
  onRetry, 
  onDismiss,
  showDetails = false,
}: BaseErrorProps) {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  const message = getUserFriendlyMessage(normalizedError);

  const severityClasses = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-600 text-white',
    medium: 'bg-yellow-600 text-white',
    low: 'bg-blue-600 text-white',
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-4',
      severityClasses[severity] || severityClasses.medium,
      className
    )}>
      <div className="flex items-center gap-3">
        {getSeverityIcon(severity, 'h-5 w-5 text-white')}
        <div>
          <p className="font-medium">{message}</p>
          {showDetails && normalizedError.code !== 'GENERIC_ERROR' && (
            <p className="text-sm opacity-90 mt-1">錯誤代碼: {normalizedError.code}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            重試
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// 錯誤卡片
export function ErrorCard({ 
  error, 
  className, 
  onRetry, 
  onDismiss,
  showDetails = false,
}: BaseErrorProps) {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  const message = getUserFriendlyMessage(normalizedError);

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm p-6',
      className
    )}>
      <div className="flex items-start gap-4">
        {getSeverityIcon(severity, 'h-6 w-6 flex-shrink-0 mt-1')}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            發生錯誤
          </h3>
          
          <p className="text-gray-600 mb-4">
            {message}
          </p>

          {showDetails && (
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">錯誤代碼:</span>
                  <span className="ml-2 font-mono text-gray-600">{normalizedError.code}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">時間:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(normalizedError.timestamp).toLocaleString('zh-TW')}
                  </span>
                </div>
                
                {normalizedError.source && (
                  <div>
                    <span className="font-medium text-gray-700">來源:</span>
                    <span className="ml-2 text-gray-600">{normalizedError.source}</span>
                  </div>
                )}
                
                {normalizedError.statusCode && (
                  <div>
                    <span className="font-medium text-gray-700">狀態碼:</span>
                    <span className="ml-2 font-mono text-gray-600">{normalizedError.statusCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2 rounded-md',
                  'bg-blue-600 text-white hover:bg-blue-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                重試
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 rounded-md',
                'bg-gray-100 text-gray-700 hover:bg-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
            >
              <Home className="h-4 w-4" />
              回到首頁
            </button>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// 頁面錯誤
export function ErrorPage({ 
  error, 
  className, 
  onRetry,
  showDetails = false,
}: BaseErrorProps) {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  const message = getUserFriendlyMessage(normalizedError);

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4',
      className
    )}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          {getSeverityIcon(severity, 'h-16 w-16 mx-auto')}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          糟糕！發生錯誤了
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        {showDetails && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">錯誤代碼:</span>
                <span className="ml-2 font-mono text-gray-600">{normalizedError.code}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">時間:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(normalizedError.timestamp).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-md',
                'bg-blue-600 text-white hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
            >
              <RefreshCw className="h-5 w-5" />
              重新載入
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className={cn(
              'flex items-center justify-center gap-2 px-6 py-3 rounded-md',
              'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'transition-colors duration-200'
            )}
          >
            <Home className="h-5 w-5" />
            回到首頁
          </button>
        </div>
      </div>
    </div>
  );
}

// 表單欄位錯誤
export function FieldError({ 
  error,
  className,
}: {
  error: string | undefined;
  className?: string;
}) {
  if (!error) return null;

  return (
    <p className={cn('text-sm text-red-600 mt-1', className)}>
      {error}
    </p>
  );
}

// Toast 錯誤通知
export function ErrorToast({ 
  error,
  onDismiss,
  className,
  autoHide = true,
  duration = 5000,
}: BaseErrorProps & { 
  autoHide?: boolean;
  duration?: number;
}) {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  const message = getUserFriendlyMessage(normalizedError);

  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  const severityClasses = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    low: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm',
      severityClasses[severity] || severityClasses.medium,
      'animate-in slide-in-from-right-full',
      className
    )}>
      {getSeverityIcon(severity, 'h-5 w-5 flex-shrink-0 mt-0.5')}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">錯誤</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// 空狀態錯誤
export function EmptyStateError({
  error,
  title = '載入失敗',
  description,
  onRetry,
  className,
}: BaseErrorProps & {
  title?: string;
  description?: string;
}) {
  const normalizedError = normalizeError(error);
  const message = description || getUserFriendlyMessage(normalizedError);

  return (
    <div className={cn(
      'text-center py-12 px-4',
      className
    )}>
      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md',
            'bg-blue-600 text-white hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'transition-colors duration-200'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          重試
        </button>
      )}
    </div>
  );
}