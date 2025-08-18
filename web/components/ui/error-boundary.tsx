/**
 * 錯誤邊界元件 - 捕獲和處理 React 元件錯誤
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, createError, logError, getUserFriendlyMessage } from '@/lib/errors';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  className?: string;
}

interface ErrorFallbackProps {
  error: AppError;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
  showErrorDetails?: boolean;
}

// 預設錯誤回退元件
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  showDetails, 
  toggleDetails,
  showErrorDetails = false 
}: ErrorFallbackProps) {
  const userMessage = getUserFriendlyMessage(error);

  return (
    <div className={cn(
      "min-h-[400px] flex flex-col items-center justify-center p-8",
      "bg-white border border-red-200 rounded-lg shadow-sm"
    )}>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          發生錯誤
        </h2>
      </div>
      
      <div className="text-center mb-8 max-w-md">
        <p className="text-gray-600 mb-4">
          {userMessage}
        </p>
        <p className="text-sm text-gray-500">
          如果問題持續發生，請聯絡技術支援
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={resetError}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md",
            "bg-blue-600 text-white hover:bg-blue-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-colors duration-200"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          重試
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md",
            "bg-gray-600 text-white hover:bg-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
            "transition-colors duration-200"
          )}
        >
          <Home className="h-4 w-4" />
          回到首頁
        </button>
      </div>

      {showErrorDetails && (
        <div className="w-full max-w-2xl">
          <button
            onClick={toggleDetails}
            className={cn(
              "flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700",
              "focus:outline-none focus:underline mb-3"
            )}
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showDetails ? '隱藏' : '顯示'}錯誤詳情
          </button>
          
          {showDetails && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">錯誤代碼:</span>
                  <span className="ml-2 font-mono text-red-600">{error.code}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">時間戳記:</span>
                  <span className="ml-2 font-mono text-gray-600">{error.timestamp}</span>
                </div>
                
                {error.source && (
                  <div>
                    <span className="font-medium text-gray-700">錯誤來源:</span>
                    <span className="ml-2 font-mono text-gray-600">{error.source}</span>
                  </div>
                )}
                
                {error.statusCode && (
                  <div>
                    <span className="font-medium text-gray-700">狀態碼:</span>
                    <span className="ml-2 font-mono text-gray-600">{error.statusCode}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">錯誤訊息:</span>
                  <div className="ml-2 mt-1 p-2 bg-red-50 border border-red-200 rounded font-mono text-xs text-red-800 overflow-auto">
                    {error.message}
                  </div>
                </div>
                
                {errorInfo && (
                  <div>
                    <span className="font-medium text-gray-700">元件堆疊:</span>
                    <div className="ml-2 mt-1 p-2 bg-gray-100 border border-gray-300 rounded font-mono text-xs text-gray-700 overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 錯誤邊界主元件
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = createError.custom(
      'COMPONENT_ERROR',
      error.message || '元件渲染錯誤',
      undefined,
      'client',
      { originalError: error.toString() }
    );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createError.custom(
      'COMPONENT_ERROR',
      error.message || '元件渲染錯誤',
      undefined,
      'client',
      { 
        originalError: error.toString(),
        componentStack: errorInfo.componentStack
      }
    );

    this.setState({
      error: appError,
      errorInfo,
    });

    // 記錄錯誤
    logError(appError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    });

    // 呼叫自訂錯誤處理函數
    this.props.onError?.(appError, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <div className={this.props.className}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            showDetails={this.state.showDetails}
            toggleDetails={this.toggleDetails}
            showErrorDetails={this.props.showErrorDetails}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// 高階元件包裝器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook 用於在函數元件中重置錯誤邊界
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // 這個 hook 可以用於手動觸發錯誤邊界
    throw createError.custom(
      'MANUAL_ERROR',
      error.message,
      undefined,
      'client',
      errorInfo
    );
  };
}

// 非同步錯誤處理 Hook
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    []
  );
}