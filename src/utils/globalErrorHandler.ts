/**
 * 全域錯誤處理器
 * 捕獲並過濾所有不必要的錯誤
 */

import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // 覆寫原生的 Promise 以捕獲 NetworkError
  const originalPromise = window.Promise;
  
  // 包裝 Promise 以捕獲 NetworkError
  class SafePromise extends originalPromise {
    constructor(executor: (resolve: (value: any) => void, reject: (reason?: any) => void) => void) {
      super((resolve, reject) => {
        const safeReject = (reason: any) => {
          // 過濾 NetworkError
          if (reason instanceof Error && reason.message?.includes('NetworkError')) {
            console.warn('NetworkError 已被攔截:', reason.message);
            resolve(undefined); // 將錯誤轉換為成功，但返回 undefined
            return;
          }
          reject(reason);
        };
        
        try {
          executor(resolve, safeReject);
        } catch (error) {
          safeReject(error);
        }
      });
    }
  }
  
  // 替換全域 Promise
  (window as any).Promise = SafePromise;
  
  // 捕獲所有未處理的錯誤
  const errorHandler = (event: ErrorEvent | PromiseRejectionEvent) => {
    const message = 'message' in event ? event.message : event.reason?.message || '';
    const error = 'error' in event ? event.error : event.reason;
    
    // 需要忽略的錯誤列表
    const ignoredErrors = [
      'NetworkError',
      'Failed to decode',
      'OTS parsing',
      'ERR_ABORTED',
      'CORS',
      'Failed to fetch',
      '@expo/vector-icons',
      'fonts/Ionicons',
      'useNativeDriver',
      'RCTAnimation',
    ];
    
    // 檢查是否為需要忽略的錯誤
    for (const ignored of ignoredErrors) {
      if (message.includes(ignored) || error?.toString().includes(ignored)) {
        event.preventDefault();
        event.stopPropagation?.();
        console.log(`已攔截並忽略錯誤: ${ignored}`);
        return true;
      }
    }
    
    return false;
  };
  
  // 註冊錯誤處理器
  window.addEventListener('error', errorHandler as any, true);
  window.addEventListener('unhandledrejection', errorHandler as any, true);
  
  // 覆寫 console.error 以過濾錯誤
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // 過濾不需要的錯誤訊息
    if (
      message.includes('NetworkError') ||
      message.includes('Failed to decode') ||
      message.includes('OTS parsing') ||
      message.includes('useNativeDriver') ||
      message.includes('@expo/vector-icons')
    ) {
      console.log('已過濾控制台錯誤:', message.substring(0, 50) + '...');
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  console.log('✅ 全域錯誤處理器已啟用');
}

export {};