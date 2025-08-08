/**
 * Web 平台字體載入 Polyfill
 * 
 * 注意：已由 scripts/fix-web-icons.js 在 HTML 中處理
 * 這個檔案只處理錯誤捕獲，不再載入字體
 */

import { Platform } from 'react-native';

// 只在 Web 平台執行
if (Platform.OS === 'web') {
  // 不再動態載入字體，避免衝突
  // 字體載入已由 HTML 處理
  
  // 只添加全域錯誤處理，捕獲任何殘留的字體載入錯誤
  window.addEventListener('error', (event) => {
    // 過濾字體和網路相關的錯誤
    if (event.message?.includes('Failed to decode') || 
        event.message?.includes('OTS parsing') ||
        event.message?.includes('NetworkError') ||
        event.message?.includes('ERR_ABORTED') ||
        event.message?.includes('CORS')) {
      console.warn('資源載入錯誤已忽略:', event.message);
      event.preventDefault(); // 防止錯誤冒泡
      return true;
    }
  }, true);
  
  // 監聽未處理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('NetworkError') ||
        event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('ERR_ABORTED')) {
      console.warn('Promise rejection 已忽略:', event.reason?.message);
      event.preventDefault(); // 防止錯誤冒泡
      return true;
    }
  });
  
  console.log('✅ 錯誤處理已啟用（字體由 HTML 載入）');
}

export {};