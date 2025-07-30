/**
 * Web 字體修復工具
 * 為 @expo/vector-icons 提供正確的字體載入
 */

import { Platform } from 'react-native';

export const fixWebFonts = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  // 建立字體對應表
  const fontMap = {
    'Ionicons': 'https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/fonts/ionicons.ttf',
    'FontAwesome': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf',
    'MaterialIcons': 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
    'MaterialCommunityIcons': 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/fonts/materialdesignicons-webfont.ttf'
  };

  // 為每個字體創建 @font-face 規則
  const style = document.createElement('style');
  let cssText = '';

  Object.entries(fontMap).forEach(([fontFamily, url]) => {
    cssText += `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${url}') format('truetype');
        font-display: swap;
      }
    `;
  });

  style.textContent = cssText;
  document.head.appendChild(style);

  console.log('✅ Web fonts fixed with CDN URLs');
};