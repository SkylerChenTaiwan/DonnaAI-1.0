import { Platform } from 'react-native';

/**
 * 確保樣式對 Web 平台安全
 * 過濾掉所有可能導致 CSSStyleDeclaration 錯誤的屬性
 */
export const makeWebSafe = (style: any): any => {
  if (Platform.OS !== 'web') {
    return style;
  }
  
  if (!style) return style;
  
  // 如果是陣列，遞迴處理每個元素
  if (Array.isArray(style)) {
    return style.map(makeWebSafe);
  }
  
  // 複製樣式物件
  const safeStyle = { ...style };
  
  // 移除 Web 不支援的屬性
  const unsafeProps = [
    'shadowColor',
    'shadowOffset',
    'shadowOpacity', 
    'shadowRadius',
    'elevation',
    'overlayColor',
    'tintColor',
    'selectionColor'
  ];
  
  unsafeProps.forEach(prop => {
    delete safeStyle[prop];
  });
  
  // 處理 transform - 如果是陣列格式，轉換為字串
  if (safeStyle.transform && Array.isArray(safeStyle.transform)) {
    const transforms = safeStyle.transform
      .map(t => {
        const key = Object.keys(t)[0];
        const value = t[key];
        if (typeof value === 'number') {
          return `${key}(${value}px)`;
        }
        return `${key}(${value})`;
      })
      .join(' ');
    safeStyle.transform = transforms;
  }
  
  return safeStyle;
};

/**
 * 建立跨平台陰影樣式
 */
export const createShadow = (level: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const shadows = {
    none: {
      web: 'none',
      native: { shadowOpacity: 0, elevation: 0 }
    },
    sm: {
      web: '0px 1px 4px rgba(0,0,0,0.1)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1
      }
    },
    md: {
      web: '0px 2px 8px rgba(0,0,0,0.15)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3
      }
    },
    lg: {
      web: '0px 4px 16px rgba(0,0,0,0.2)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
      }
    },
    xl: {
      web: '0px 8px 32px rgba(0,0,0,0.25)',
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8
      }
    }
  };
  
  const shadow = shadows[level];
  
  return Platform.OS === 'web' 
    ? { boxShadow: shadow.web }
    : shadow.native;
};
