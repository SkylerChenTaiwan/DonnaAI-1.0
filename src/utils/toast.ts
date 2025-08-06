/**
 * Toast 通知工具
 * 提供統一的通知訊息顯示介面
 */

import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

/**
 * 顯示 Toast 通知
 * 在 React Native 中使用 Alert 作為替代方案
 * 
 * @param type - 通知類型
 * @param message - 通知訊息
 * @param options - 額外選項（目前未使用）
 */
export const showToast = (
  type: ToastType,
  message: string,
  options?: ToastOptions
) => {
  // 根據類型決定標題
  const getTitle = () => {
    switch (type) {
      case 'success':
        return '成功';
      case 'error':
        return '錯誤';
      case 'warning':
        return '警告';
      case 'info':
        return '提示';
      default:
        return '通知';
    }
  };

  // 在開發環境中也輸出到 console
  if (__DEV__) {
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    console.log(`${emoji[type]} ${getTitle()}: ${message}`);
  }

  // 使用 Alert 顯示通知
  // 注意：React Native 的 Alert 只支援 iOS 和 Android
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Alert.alert(
      getTitle(),
      message,
      [{ text: '確定', style: 'default' }],
      { cancelable: true }
    );
  }
};

/**
 * 快捷方法：顯示成功通知
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  showToast('success', message, options);
};

/**
 * 快捷方法：顯示錯誤通知
 */
export const showError = (message: string, options?: ToastOptions) => {
  showToast('error', message, options);
};

/**
 * 快捷方法：顯示警告通知
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  showToast('warning', message, options);
};

/**
 * 快捷方法：顯示資訊通知
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  showToast('info', message, options);
};

// 導出預設的 toast 物件，提供鏈式調用
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};

// 為了兼容性，提供別名
export const showSuccessToast = showSuccess;
export const showErrorToast = showError;