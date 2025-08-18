/**
 * 全域通知系統
 */

'use client';

import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, useGlobalErrors } from '@/providers/error-loading-provider';
import { ErrorToast } from './error-display';

// 通知圖示對應
const notificationIcons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

// 通知樣式對應
const notificationStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    message: 'text-green-700',
    button: 'text-green-500 hover:text-green-600',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    message: 'text-blue-700',
    button: 'text-blue-500 hover:text-blue-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    button: 'text-yellow-500 hover:text-yellow-600',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    message: 'text-red-700',
    button: 'text-red-500 hover:text-red-600',
  },
};

// 單個通知元件
function NotificationItem({
  id,
  type,
  title,
  message,
  onDismiss,
  className,
}: {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  onDismiss: (id: string) => void;
  className?: string;
}) {
  const IconComponent = notificationIcons[type];
  const styles = notificationStyles[type];

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm',
      'animate-in slide-in-from-right-full',
      styles.container,
      className
    )}>
      <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
      
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', styles.title)}>{title}</p>
        {message && (
          <p className={cn('text-sm mt-1', styles.message)}>{message}</p>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className={cn(
          'flex-shrink-0 p-1 transition-colors',
          styles.button
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// 通知容器
export function NotificationContainer({ 
  position = 'top-right',
  maxNotifications = 5,
  className,
}: {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
  className?: string;
}) {
  const { getActiveNotifications, dismissNotification } = useNotifications();
  const { getActiveErrors, dismissError } = useGlobalErrors();
  
  const notifications = getActiveNotifications();
  const errors = getActiveErrors();

  // 組合通知和錯誤
  const allNotifications = [
    ...notifications.slice(-maxNotifications),
    ...errors.slice(-maxNotifications).map(({ id, error }) => ({
      id: `error-${id}`,
      type: 'error' as const,
      title: '發生錯誤',
      message: error.message,
      isError: true,
    }))
  ].slice(-maxNotifications);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (allNotifications.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    if (id.startsWith('error-')) {
      const errorId = id.replace('error-', '');
      dismissError(errorId);
    } else {
      dismissNotification(id);
    }
  };

  return (
    <div className={cn(
      'fixed z-50 flex flex-col gap-3 pointer-events-none',
      positionClasses[position],
      className
    )}>
      {allNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          {('isError' in notification) ? (
            <ErrorToast
              error={{ 
                code: 'ERROR',
                message: notification.message || notification.title,
                timestamp: new Date().toISOString()
              }}
              onDismiss={() => handleDismiss(notification.id)}
              autoHide={false}
            />
          ) : (
            <NotificationItem
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// 通知觸發器 Hook
export function useNotificationTrigger() {
  const { addNotification } = useNotifications();
  const { addError } = useGlobalErrors();

  const showSuccess = (title: string, message?: string, options?: { duration?: number }) => {
    return addNotification({
      type: 'success',
      title,
      message,
      autoHide: true,
      duration: options?.duration || 3000,
    });
  };

  const showInfo = (title: string, message?: string, options?: { duration?: number }) => {
    return addNotification({
      type: 'info',
      title,
      message,
      autoHide: true,
      duration: options?.duration || 5000,
    });
  };

  const showWarning = (title: string, message?: string, options?: { duration?: number }) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      autoHide: true,
      duration: options?.duration || 7000,
    });
  };

  const showError = (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    if (options?.persistent) {
      return addError({
        code: 'USER_ERROR',
        message: message || title,
        timestamp: new Date().toISOString(),
      });
    } else {
      return addNotification({
        type: 'error',
        title,
        message,
        autoHide: true,
        duration: options?.duration || 7000,
      });
    }
  };

  return {
    showSuccess,
    showInfo,
    showWarning,
    showError,
  };
}

// 載入狀態通知
export function LoadingNotification({
  isLoading,
  message = '處理中...',
  className,
}: {
  isLoading: boolean;
  message?: string;
  className?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      'fixed top-4 left-1/2 -translate-x-1/2 z-50',
      'bg-white border border-gray-200 shadow-lg rounded-lg p-4',
      'flex items-center gap-3',
      'animate-in slide-in-from-top',
      className
    )}>
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
      <span className="text-sm text-gray-700">{message}</span>
    </div>
  );
}

// 錯誤總覽
export function ErrorSummary({ 
  className,
  showTitle = true,
  maxErrors = 3,
}: {
  className?: string;
  showTitle?: boolean;
  maxErrors?: number;
}) {
  const { getActiveErrors, dismissError, clearErrors } = useGlobalErrors();
  const errors = getActiveErrors().slice(-maxErrors);

  if (errors.length === 0) return null;

  return (
    <div className={cn(
      'bg-red-50 border border-red-200 rounded-lg p-4',
      className
    )}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-red-800">
            發生 {errors.length} 個錯誤
          </h3>
          <button
            onClick={clearErrors}
            className="text-xs text-red-600 hover:text-red-800"
          >
            全部清除
          </button>
        </div>
      )}
      
      <div className="space-y-2">
        {errors.map(({ id, error, timestamp }) => (
          <div key={id} className="flex items-start gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-800 break-words">{error.message}</p>
              <p className="text-xs text-red-600 mt-1">
                {timestamp.toLocaleTimeString('zh-TW')}
              </p>
            </div>
            <button
              onClick={() => dismissError(id)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 通知計數徽章
export function NotificationBadge({ 
  className,
  showZero = false,
}: {
  className?: string;
  showZero?: boolean;
}) {
  const { getActiveNotifications } = useNotifications();
  const { getActiveErrors } = useGlobalErrors();
  
  const count = getActiveNotifications().length + getActiveErrors().length;

  if (count === 0 && !showZero) return null;

  return (
    <span className={cn(
      'inline-flex items-center justify-center',
      'min-w-[1.5rem] h-6 px-2 py-1',
      'bg-red-500 text-white text-xs font-medium rounded-full',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
}