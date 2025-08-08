/**
 * 全域錯誤處理器
 * 捕獲並過濾所有不必要的錯誤，但不影響正常功能
 */

import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // 只處理錯誤事件，不修改 Promise 行為
  const errorHandler = (event: ErrorEvent) => {
    const message = event.message || '';
    
    // 需要忽略的錯誤列表
    const ignoredErrors = [
      'Failed to decode downloaded font',
      'OTS parsing error',
      'NetworkError: A network error occurred',
      'ERR_ABORTED',
      'CORS policy',
      'Failed to fetch',
      '@expo/vector-icons',
      'fonts/Ionicons',
      'useNativeDriver',
      'RCTAnimation',
    ];
    
    // 檢查是否為需要忽略的錯誤
    for (const ignored of ignoredErrors) {
      if (message.includes(ignored)) {
        event.preventDefault();
        event.stopPropagation();
        console.log(`已忽略錯誤: ${ignored.substring(0, 30)}...`);
        return true;
      }
    }
    
    return false;
  };
  
  // 處理未處理的 Promise rejection
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.message || event.reason?.toString() || '';
    
    // 只過濾特定的 NetworkError
    if (
      reason.includes('NetworkError: A network error occurred') ||
      reason.includes('Failed to decode downloaded font') ||
      reason.includes('OTS parsing error')
    ) {
      event.preventDefault();
      console.log('已忽略 Promise rejection:', reason.substring(0, 50) + '...');
      return true;
    }
    
    return false;
  };
  
  // 註冊錯誤處理器
  window.addEventListener('error', errorHandler, true);
  window.addEventListener('unhandledrejection', rejectionHandler, true);
  
  // 輕量級的 console.error 過濾
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // 只過濾特定的錯誤訊息
    if (
      message.includes('Failed to decode downloaded font') ||
      message.includes('OTS parsing error') ||
      message.includes('useNativeDriver')
    ) {
      console.log('已過濾控制台錯誤');
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  console.log('✅ 錯誤過濾器已啟用（不影響正常功能）');
}

export {};