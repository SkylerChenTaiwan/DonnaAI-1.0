/**
 * 全域樣式包裝器 - 確保 Web 平台安全
 */
import { Platform, StyleSheet } from 'react-native';

// 儲存原始的 StyleSheet.create
const originalCreate = StyleSheet.create;

// 覆寫 StyleSheet.create
StyleSheet.create = function(styles) {
  if (Platform.OS === 'web') {
    // Web 平台：深度清理所有樣式
    const cleanedStyles = {};
    
    for (const key in styles) {
      const style = styles[key];
      cleanedStyles[key] = cleanStyleForWeb(style);
    }
    
    return originalCreate.call(this, cleanedStyles);
  }
  
  // Native 平台：保持原樣
  return originalCreate.call(this, styles);
};

// 清理 Web 樣式的函數
function cleanStyleForWeb(style) {
  if (!style) return style;
  
  if (Array.isArray(style)) {
    return style.map(cleanStyleForWeb);
  }
  
  const cleaned = { ...style };
  
  // 移除所有 Native 專用屬性
  const nativeOnlyProps = [
    'shadowColor',
    'shadowOffset', 
    'shadowOpacity',
    'shadowRadius',
    'elevation',
    'overlayColor',
    'tintColor',
    'selectionColor'
  ];
  
  nativeOnlyProps.forEach(prop => {
    delete cleaned[prop];
  });
  
  // 處理 transform
  if (cleaned.transform && Array.isArray(cleaned.transform)) {
    delete cleaned.transform;
  }
  
  return cleaned;
}

// 導出清理函數供直接使用
export const webSafeStyle = (style) => {
  if (Platform.OS === 'web') {
    return cleanStyleForWeb(style);
  }
  return style;
};

// 導出陰影創建函數
export const createShadow = (level = 'md') => {
  if (Platform.OS === 'web') {
    const shadows = {
      none: { boxShadow: 'none' },
      sm: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
      md: { boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' },
      lg: { boxShadow: '0px 4px 16px rgba(0,0,0,0.2)' },
      xl: { boxShadow: '0px 8px 32px rgba(0,0,0,0.25)' }
    };
    return shadows[level] || shadows.md;
  }
  
  // Native 陰影
  const shadows = {
    none: {
      shadowOpacity: 0,
      elevation: 0
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8
    }
  };
  
  return shadows[level] || shadows.md;
};

// 自動初始化
console.log('[StyleWrapper] Initialized - All styles will be cleaned for Web platform');
