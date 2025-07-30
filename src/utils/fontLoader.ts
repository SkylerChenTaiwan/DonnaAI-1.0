/**
 * Web 平台字體預載工具
 * 確保 Ionicons 和其他向量圖示字體在 Web 上正確載入
 */

import { Platform } from 'react-native';
import * as Font from 'expo-font';

export const loadFonts = async () => {
  if (Platform.OS !== 'web') {
    return; // 原生平台不需要特殊處理
  }

  try {
    await Font.loadAsync({
      // Ionicons 字體預載
      Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    });
    
    console.log('✅ Fonts loaded successfully');
  } catch (error) {
    console.error('❌ Font loading failed:', error);
  }
};

export const preloadWebFonts = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  // 創建 font-face CSS 規則
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Ionicons';
      src: url('/_expo/static/media/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf') format('truetype');
      font-display: swap;
    }
  `;
  
  document.head.appendChild(style);
  
  // 預載字體
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = '/_expo/static/media/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf';
  link.as = 'font';
  link.type = 'font/ttf';
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
  
  console.log('✅ Web fonts preloaded');
};