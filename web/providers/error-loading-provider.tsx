/**
 * 全域錯誤和載入狀態提供者
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppError, logError, getErrorSeverity } from '@/lib/errors';
import { LoadingState } from '@/lib/loading';

// 全域狀態類型
interface GlobalState {
  // 載入狀態
  globalLoading: boolean;
  loadingStates: Record<string, LoadingState>;
  
  // 錯誤狀態
  errors: Array<{
    id: string;
    error: AppError;
    timestamp: Date;
    dismissed?: boolean;
  }>;
  
  // 通知狀態
  notifications: Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    dismissed?: boolean;
    autoHide?: boolean;
    duration?: number;
  }>;
}

// 動作類型
type Action =
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_STATE'; payload: { key: string; state: LoadingState } }
  | { type: 'REMOVE_LOADING_STATE'; payload: string }
  | { type: 'ADD_ERROR'; payload: { id: string; error: AppError } }
  | { type: 'DISMISS_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'ADD_NOTIFICATION'; payload: { 
      id: string; 
      type: 'success' | 'info' | 'warning' | 'error';
      title: string;
      message?: string;
      autoHide?: boolean;
      duration?: number;
    }}
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// 初始狀態
const initialState: GlobalState = {
  globalLoading: false,
  loadingStates: {},
  errors: [],
  notifications: [],
};

// Reducer 函數
function errorLoadingReducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload };

    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.state,
        },
      };

    case 'REMOVE_LOADING_STATE':
      const { [action.payload]: removed, ...remainingStates } = state.loadingStates;
      return { ...state, loadingStates: remainingStates };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, {
          ...action.payload,
          timestamp: new Date(),
        }],
      };

    case 'DISMISS_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload ? { ...error, dismissed: true } : error
        ),
      };

    case 'CLEAR_ERRORS':
      return { ...state, errors: [] };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload 
            ? { ...notification, dismissed: true } 
            : notification
        ),
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    default:
      return state;
  }
}

// Context 類型
interface ErrorLoadingContextType {
  // 狀態
  state: GlobalState;
  
  // 載入狀態方法
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, state: LoadingState) => void;
  removeLoadingState: (key: string) => void;
  getLoadingState: (key: string) => LoadingState | undefined;
  isAnyLoading: () => boolean;
  
  // 錯誤方法
  addError: (error: AppError, options?: { id?: string }) => string;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  getActiveErrors: () => Array<{ id: string; error: AppError; timestamp: Date }>;
  
  // 通知方法
  addNotification: (notification: {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    autoHide?: boolean;
    duration?: number;
  }) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  getActiveNotifications: () => Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    autoHide?: boolean;
    duration?: number;
  }>;
}

// 建立 Context
const ErrorLoadingContext = createContext<ErrorLoadingContextType | undefined>(undefined);

// 生成唯一 ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Provider 元件
export function ErrorLoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(errorLoadingReducer, initialState);

  // 載入狀態方法
  const setGlobalLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  }, []);

  const setLoadingState = useCallback((key: string, loadingState: LoadingState) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key, state: loadingState } });
  }, []);

  const removeLoadingState = useCallback((key: string) => {
    dispatch({ type: 'REMOVE_LOADING_STATE', payload: key });
  }, []);

  const getLoadingState = useCallback((key: string) => {
    return state.loadingStates[key];
  }, [state.loadingStates]);

  const isAnyLoading = useCallback(() => {
    return state.globalLoading || Object.values(state.loadingStates).some(s => s.isLoading);
  }, [state.globalLoading, state.loadingStates]);

  // 錯誤方法
  const addError = useCallback((error: AppError, options?: { id?: string }) => {
    const id = options?.id || generateId();
    dispatch({ type: 'ADD_ERROR', payload: { id, error } });
    
    // 記錄錯誤
    logError(error, { context: 'global-error-handler' });
    
    return id;
  }, []);

  const dismissError = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: id });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const getActiveErrors = useCallback(() => {
    return state.errors.filter(error => !error.dismissed);
  }, [state.errors]);

  // 通知方法
  const addNotification = useCallback((notification: {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    autoHide?: boolean;
    duration?: number;
  }) => {
    const id = generateId();
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: { 
        id, 
        autoHide: true,
        duration: 5000,
        ...notification 
      }
    });
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  const getActiveNotifications = useCallback(() => {
    return state.notifications.filter(notification => !notification.dismissed);
  }, [state.notifications]);

  // 自動隱藏通知
  useEffect(() => {
    const activeNotifications = getActiveNotifications();
    
    activeNotifications.forEach(notification => {
      if (notification.autoHide && !notification.dismissed) {
        const timer = setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [state.notifications, getActiveNotifications, dismissNotification]);

  // Context 值
  const contextValue: ErrorLoadingContextType = {
    state,
    setGlobalLoading,
    setLoadingState,
    removeLoadingState,
    getLoadingState,
    isAnyLoading,
    addError,
    dismissError,
    clearErrors,
    getActiveErrors,
    addNotification,
    dismissNotification,
    clearNotifications,
    getActiveNotifications,
  };

  return (
    <ErrorLoadingContext.Provider value={contextValue}>
      {children}
    </ErrorLoadingContext.Provider>
  );
}

// Hook 用於使用 Context
export function useErrorLoading() {
  const context = useContext(ErrorLoadingContext);
  if (context === undefined) {
    throw new Error('useErrorLoading must be used within an ErrorLoadingProvider');
  }
  return context;
}

// 便利的 Hook
export function useGlobalLoading() {
  const { state, setGlobalLoading } = useErrorLoading();
  return [state.globalLoading, setGlobalLoading] as const;
}

export function useLoadingStates() {
  const { state, setLoadingState, removeLoadingState, getLoadingState, isAnyLoading } = useErrorLoading();
  return {
    loadingStates: state.loadingStates,
    setLoadingState,
    removeLoadingState,
    getLoadingState,
    isAnyLoading,
  };
}

export function useGlobalErrors() {
  const { state, addError, dismissError, clearErrors, getActiveErrors } = useErrorLoading();
  return {
    errors: state.errors,
    addError,
    dismissError,
    clearErrors,
    getActiveErrors,
  };
}

export function useNotifications() {
  const { state, addNotification, dismissNotification, clearNotifications, getActiveNotifications } = useErrorLoading();
  return {
    notifications: state.notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
    getActiveNotifications,
  };
}

// 高階元件
export function withErrorLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorLoadingProvider>
        <Component {...props} />
      </ErrorLoadingProvider>
    );
  };
}