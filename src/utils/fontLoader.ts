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
    // 暫時註解掉，使用 CDN 載入
    // await Font.loadAsync({
    //   // Ionicons 字體預載
    //   Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    // });
    
    console.log('✅ Using CDN fonts for web');
  } catch (error) {
    console.error('❌ Font loading failed:', error);
  }
};

export const preloadWebFonts = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  // 使用 CDN，不需要手動載入
  console.log('✅ Using CDN for Ionicons');
};