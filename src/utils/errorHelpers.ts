/**
 * 錯誤處理輔助函數
 * 提供錯誤分類、格式化和恢復建議
 */

import { Alert, Platform } from 'react-native';
import { 
  ErrorCategory, 
  ErrorRecoverySuggestion,
  ErrorReport 
} from '../types/error';
import { ERROR_TYPES, DEFAULT_VALUES } from '../config/constants';

/**
 * 錯誤分類映射
 */
const ERROR_PATTERNS: Record<string, ErrorCategory> = {
  'network': ErrorCategory.NETWORK,
  'fetch': ErrorCategory.NETWORK,
  'timeout': ErrorCategory.NETWORK,
  'connection': ErrorCategory.NETWORK,
  'offline': ErrorCategory.NETWORK,
  
  'auth': ErrorCategory.AUTH,
  'unauthorized': ErrorCategory.AUTH,
  'forbidden': ErrorCategory.AUTH,
  'token': ErrorCategory.AUTH,
  'login': ErrorCategory.AUTH,
  'permission': ErrorCategory.PERMISSION,
  
  'validation': ErrorCategory.VALIDATION,
  'invalid': ErrorCategory.VALIDATION,
  'required': ErrorCategory.VALIDATION,
  'format': ErrorCategory.VALIDATION,
  
  'firebase': ErrorCategory.FIREBASE,
  'firestore': ErrorCategory.FIREBASE,
  'storage': ErrorCategory.STORAGE,
  'upload': ErrorCategory.STORAGE,
  'download': ErrorCategory.STORAGE,
  
  'sync': ErrorCategory.SYNC,
  'conflict': ErrorCategory.SYNC,
  'merge': ErrorCategory.SYNC,
  
  'component': ErrorCategory.COMPONENT,
  'render': ErrorCategory.COMPONENT,
  'lifecycle': ErrorCategory.COMPONENT
};

/**
 * 分類錯誤
 */
export function categorizeError(error: Error | string): ErrorCategory {
  const message = (typeof error === 'string' ? error : error.message).toLowerCase();
  
  for (const [pattern, category] of Object.entries(ERROR_PATTERNS)) {
    if (message.includes(pattern)) {
      return category;
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * 取得錯誤的本地化訊息
 */
export function getLocalizedErrorMessage(
  error: Error | string,
  fallback: string = DEFAULT_VALUES.DEFAULT_ERROR_MESSAGE
): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const category = categorizeError(error);
  
  // 根據錯誤類別返回友善的中文訊息
  const localizedMessages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: '網路連線發生問題，請檢查您的網路設定',
    [ErrorCategory.AUTH]: '驗證失敗，請重新登入',
    [ErrorCategory.VALIDATION]: '輸入資料格式不正確，請檢查後重試',
    [ErrorCategory.PERMISSION]: '您沒有權限執行此操作',
    [ErrorCategory.FIREBASE]: 'Firebase 服務暫時無法使用',
    [ErrorCategory.STORAGE]: '儲存空間操作失敗',
    [ErrorCategory.SYNC]: '資料同步發生問題',
    [ErrorCategory.COMPONENT]: '頁面載入失敗',
    [ErrorCategory.UNKNOWN]: fallback
  };
  
  // 檢查特定錯誤訊息
  if (errorMessage.includes('No internet')) {
    return '無網路連線，請檢查您的網路設定';
  }
  
  if (errorMessage.includes('User not found')) {
    return '找不到使用者帳號';
  }
  
  if (errorMessage.includes('Wrong password')) {
    return '密碼錯誤，請重新輸入';
  }
  
  if (errorMessage.includes('Email already in use')) {
    return '此電子郵件已被使用';
  }
  
  if (errorMessage.includes('Too many requests')) {
    return '請求過於頻繁，請稍後再試';
  }
  
  return localizedMessages[category] || fallback;
}

/**
 * 取得錯誤恢復建議
 */
export function getErrorRecoverySuggestions(
  error: Error | string
): ErrorRecoverySuggestion[] {
  const category = categorizeError(error);
  const suggestions: ErrorRecoverySuggestion[] = [];
  
  switch (category) {
    case ErrorCategory.NETWORK:
      suggestions.push(
        {
          action: '檢查網路',
          description: '確認您的裝置已連接到網路',
          handler: async () => {
            // 可以整合網路檢查邏輯
            Alert.alert('提示', '請檢查您的 Wi-Fi 或行動數據連線');
          }
        },
        {
          action: '重試',
          description: '再次嘗試執行操作',
          handler: undefined // 由呼叫者提供重試邏輯
        }
      );
      break;
      
    case ErrorCategory.AUTH:
      suggestions.push(
        {
          action: '重新登入',
          description: '登出後重新登入您的帳號',
          handler: async () => {
            // 可以整合登出邏輯
            Alert.alert('提示', '請重新登入您的帳號');
          }
        }
      );
      break;
      
    case ErrorCategory.VALIDATION:
      suggestions.push(
        {
          action: '檢查輸入',
          description: '確認所有必填欄位都已正確填寫',
          handler: undefined
        }
      );
      break;
      
    case ErrorCategory.STORAGE:
      suggestions.push(
        {
          action: '清理空間',
          description: '釋放裝置儲存空間後重試',
          handler: async () => {
            Alert.alert('提示', '請前往設定清理裝置儲存空間');
          }
        }
      );
      break;
      
    default:
      suggestions.push(
        {
          action: '聯絡支援',
          description: '如果問題持續，請聯絡技術支援',
          handler: async () => {
            Alert.alert(
              '聯絡支援',
              '請將錯誤資訊傳送至 support@donna-ai.com',
              [{ text: '確定' }]
            );
          }
        }
      );
  }
  
  return suggestions;
}

/**
 * 格式化錯誤堆疊
 */
export function formatErrorStack(
  stack?: string,
  maxLines: number = 10
): string[] {
  if (!stack) return ['無堆疊資訊'];
  
  const lines = stack.split('\n');
  const formattedLines: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const line = lines[i].trim();
    
    // 跳過空行
    if (!line) continue;
    
    // 高亮應用程式碼
    if (line.includes('/src/') && !line.includes('node_modules')) {
      formattedLines.push(`➤ ${line}`);
    } else {
      formattedLines.push(`  ${line}`);
    }
  }
  
  if (lines.length > maxLines) {
    formattedLines.push(`  ... 還有 ${lines.length - maxLines} 行`);
  }
  
  return formattedLines;
}

/**
 * 判斷錯誤嚴重程度
 */
export function getErrorSeverity(error: Error | string): ErrorReport['severity'] {
  const category = categorizeError(error);
  const message = (typeof error === 'string' ? error : error.message).toLowerCase();
  
  // 關鍵錯誤
  if (message.includes('fatal') || 
      message.includes('crash') ||
      message.includes('critical')) {
    return 'critical';
  }
  
  // 高嚴重性
  if (category === ErrorCategory.AUTH ||
      category === ErrorCategory.PERMISSION ||
      message.includes('failed') ||
      message.includes('error')) {
    return 'high';
  }
  
  // 中等嚴重性
  if (category === ErrorCategory.NETWORK ||
      category === ErrorCategory.VALIDATION ||
      message.includes('warning')) {
    return 'medium';
  }
  
  // 低嚴重性
  return 'low';
}

/**
 * 安全地執行異步操作
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    fallback?: T;
    onError?: (error: Error) => void;
    showAlert?: boolean;
    alertTitle?: string;
  } = {}
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.error('異步操作失敗:', error);
    
    if (options.onError) {
      options.onError(error as Error);
    }
    
    if (options.showAlert) {
      const message = getLocalizedErrorMessage(error as Error);
      Alert.alert(
        options.alertTitle || '錯誤',
        message,
        [{ text: '確定' }]
      );
    }
    
    return options.fallback;
  }
}

/**
 * 建立錯誤處理器
 */
export function createErrorHandler(
  context: string,
  options: {
    showAlert?: boolean;
    logError?: boolean;
    severity?: ErrorReport['severity'];
  } = {}
) {
  return (error: Error) => {
    if (options.logError !== false) {
      console.error(`[${context}] 錯誤:`, error);
    }
    
    if (options.showAlert) {
      const message = getLocalizedErrorMessage(error);
      const suggestions = getErrorRecoverySuggestions(error);
      
      const buttons = suggestions.map(suggestion => ({
        text: suggestion.action,
        onPress: suggestion.handler
      }));
      
      buttons.push({ text: '關閉', style: 'cancel' });
      
      Alert.alert('錯誤', message, buttons);
    }
  };
}

/**
 * 錯誤重試邏輯
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts || 3;
  const baseDelay = options.delay || 1000;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (options.onRetry) {
        options.onRetry(attempt, lastError);
      }
      
      if (attempt < maxAttempts) {
        const delay = options.backoff 
          ? baseDelay * Math.pow(2, attempt - 1)
          : baseDelay;
          
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * 檢查是否為可恢復的錯誤
 */
export function isRecoverableError(error: Error | string): boolean {
  const category = categorizeError(error);
  const message = (typeof error === 'string' ? error : error.message).toLowerCase();
  
  // 不可恢復的錯誤
  const nonRecoverablePatterns = [
    'fatal',
    'corrupt',
    'invalid state',
    'not implemented',
    'unsupported'
  ];
  
  for (const pattern of nonRecoverablePatterns) {
    if (message.includes(pattern)) {
      return false;
    }
  }
  
  // 可恢復的錯誤類別
  const recoverableCategories = [
    ErrorCategory.NETWORK,
    ErrorCategory.AUTH,
    ErrorCategory.VALIDATION,
    ErrorCategory.SYNC
  ];
  
  return recoverableCategories.includes(category);
}