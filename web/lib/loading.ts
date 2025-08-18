/**
 * 載入狀態管理工具
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, logError } from './errors';

// 載入狀態類型
export interface LoadingState {
  isLoading: boolean;
  error: AppError | null;
  data: any;
  lastUpdated?: Date;
}

// 載入操作結果
export interface LoadingResult<T = any> {
  data?: T;
  error?: AppError;
  success: boolean;
}

// 載入管理器配置
export interface LoadingManagerConfig {
  timeout?: number; // 毫秒
  retryAttempts?: number;
  retryDelay?: number; // 毫秒
  onError?: (error: AppError) => void;
  onSuccess?: (data: any) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// 預設配置
const DEFAULT_CONFIG: LoadingManagerConfig = {
  timeout: 30000, // 30 秒
  retryAttempts: 3,
  retryDelay: 1000, // 1 秒
};

// 載入狀態 Hook
export function useLoadingState<T = any>(initialData?: T): {
  state: LoadingState;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  setData: (data: T) => void;
  reset: () => void;
  execute: <R = T>(
    asyncOperation: () => Promise<R>,
    config?: LoadingManagerConfig
  ) => Promise<LoadingResult<R>>;
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData || null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef<number>(0);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: AppError | null) => {
    setState(prev => ({ 
      ...prev, 
      error, 
      isLoading: false,
      lastUpdated: error ? new Date() : prev.lastUpdated
    }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ 
      ...prev, 
      data, 
      error: null, 
      isLoading: false,
      lastUpdated: new Date()
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData || null,
    });
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialData]);

  const execute = useCallback(async <R = T>(
    asyncOperation: () => Promise<R>,
    config: LoadingManagerConfig = {}
  ): Promise<LoadingResult<R>> => {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    
    try {
      setLoading(true);
      setError(null);
      
      mergedConfig.onStart?.();

      // 設定超時
      if (mergedConfig.timeout) {
        timeoutRef.current = setTimeout(() => {
          throw new Error('Operation timeout');
        }, mergedConfig.timeout);
      }

      const result = await asyncOperation();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setData(result as any);
      mergedConfig.onSuccess?.(result);
      mergedConfig.onEnd?.();
      
      retryCountRef.current = 0;
      
      return { data: result, success: true };
      
    } catch (error) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const appError = error instanceof Error 
        ? { 
            code: 'OPERATION_FAILED', 
            message: error.message,
            timestamp: new Date().toISOString(),
            source: 'client' as const
          } as AppError
        : error as AppError;

      // 重試邏輯
      if (retryCountRef.current < (mergedConfig.retryAttempts || 0)) {
        retryCountRef.current++;
        
        await new Promise(resolve => 
          setTimeout(resolve, mergedConfig.retryDelay || 1000)
        );
        
        return execute(asyncOperation, config);
      }

      setError(appError);
      mergedConfig.onError?.(appError);
      mergedConfig.onEnd?.();
      
      logError(appError, { 
        operation: 'useLoadingState.execute',
        retryAttempts: retryCountRef.current 
      });
      
      return { error: appError, success: false };
    }
  }, [setLoading, setError, setData]);

  // 清理超時
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    setLoading,
    setError,
    setData,
    reset,
    execute,
  };
}

// 多重載入狀態管理
export function useMultipleLoadingStates() {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { isLoading: false, error: null, data: null };
  }, [states]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], isLoading: loading }
    }));
  }, []);

  const setError = useCallback((key: string, error: AppError | null) => {
    setStates(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        error, 
        isLoading: false,
        lastUpdated: error ? new Date() : prev[key]?.lastUpdated
      }
    }));
  }, []);

  const setData = useCallback((key: string, data: any) => {
    setStates(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        data, 
        error: null, 
        isLoading: false,
        lastUpdated: new Date()
      }
    }));
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: { isLoading: false, error: null, data: null }
      }));
    } else {
      setStates({});
    }
  }, []);

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.isLoading);
  }, [states]);

  const hasAnyError = useCallback(() => {
    return Object.values(states).some(state => state.error);
  }, [states]);

  const getAllErrors = useCallback(() => {
    return Object.entries(states)
      .filter(([_, state]) => state.error)
      .map(([key, state]) => ({ key, error: state.error! }));
  }, [states]);

  return {
    states,
    getState,
    setLoading,
    setError,
    setData,
    reset,
    isAnyLoading,
    hasAnyError,
    getAllErrors,
  };
}

// API 呼叫載入狀態 Hook
export function useApiCall<T = any>() {
  return useLoadingState<T>();
}

// 去抖動載入狀態 Hook
export function useDebouncedLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    // 如果設定為不載入，立即更新去抖動狀態
    if (!loading) {
      setDebouncedLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, []);

  return {
    isLoading: debouncedLoading,
    setLoading,
  };
}

// 載入狀態工具函數
export const LoadingUtils = {
  // 延遲執行（用於模擬載入或防止閃爍）
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 組合多個 Promise 的載入狀態
  combineLoadingStates: (...states: LoadingState[]): LoadingState => {
    const isLoading = states.some(state => state.isLoading);
    const errors = states.filter(state => state.error).map(state => state.error!);
    const error = errors.length > 0 ? errors[0] : null;
    const data = states.map(state => state.data);
    
    return {
      isLoading,
      error,
      data: data.length === 1 ? data[0] : data,
      lastUpdated: states.reduce((latest, state) => {
        if (!state.lastUpdated) return latest;
        if (!latest) return state.lastUpdated;
        return state.lastUpdated > latest ? state.lastUpdated : latest;
      }, undefined as Date | undefined),
    };
  },
  
  // 重試工具
  withRetry: async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        await LoadingUtils.delay(delay * attempt);
      }
    }
    
    throw lastError;
  },
};