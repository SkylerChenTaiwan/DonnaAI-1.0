/**
 * Web 平台字體載入 Polyfill
 * 解決 @expo/vector-icons 在 Web 平台的 OTS parsing error
 */

import { Platform } from 'react-native';

// 只在 Web 平台執行
if (Platform.OS === 'web') {
  // 檢查是否已經由 HTML 載入了字體
  const hasExternalFonts = document.querySelector('link[href*="fonts.googleapis.com"]') ||
                          document.querySelector('style')?.textContent?.includes('Ionicons');
  
  if (hasExternalFonts) {
    console.log('✅ 字體已由 HTML 載入，跳過 polyfill');
  } else {
    // 如果 HTML 沒有載入字體，才動態載入
    // 使用 CDN 而非本地路徑，避免 NetworkError
    const style = document.createElement('style');
    
    style.textContent = `
      @font-face {
        font-family: 'Ionicons';
        src: url('https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/fonts/ionicons.woff2') format('woff2'),
             url('https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/fonts/ionicons.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'MaterialIcons';
        src: local('Material Icons'),
             local('MaterialIcons-Regular'),
             url('https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* 只載入實際使用的字體，避免不必要的網路請求 */
    `;
    
    document.head.appendChild(style);
    console.log('✅ Web 字體 polyfill 已載入（使用 CDN）');
  }
  
  // 添加全域錯誤處理，捕獲字體載入錯誤
  window.addEventListener('error', (event) => {
    // 過濾字體相關的錯誤
    if (event.message?.includes('Failed to decode') || 
        event.message?.includes('OTS parsing') ||
        (event.message?.includes('NetworkError') && event.filename?.includes('font'))) {
      console.warn('字體載入錯誤已忽略:', event.message);
      event.preventDefault(); // 防止錯誤冒泡
      return true;
    }
  }, true);
  
  // 監聽未處理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('NetworkError') ||
        event.reason?.message?.includes('Failed to fetch')) {
      console.warn('網路請求錯誤已忽略:', event.reason?.message);
      event.preventDefault(); // 防止錯誤冒泡
      return true;
    }
  });
}

export {};