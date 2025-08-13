/**
 * Web 平台專用樣式
 * 提供響應式設計和桌面瀏覽器優化
 */

import { StyleSheet, Platform } from 'react-native';
import { getWebScreenInfo, isDesktopWeb, isTabletWeb, isMobileWeb } from '@/utils/web-detector';
import { UNIFIED_BREAKPOINTS, getBreakpoint, Breakpoint } from '@/theme/responsive';

// 使用統一的斷點定義
export const breakpoints = UNIFIED_BREAKPOINTS;

// 獲取當前斷點
export const getCurrentBreakpoint = (): Breakpoint => {
  if (Platform.OS !== 'web') return 'mobile';
  
  const { width } = getWebScreenInfo();
  return getBreakpoint(width);
};

// 響應式樣式助手
export const responsive = <T extends Record<string, any>>(styles: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  largeDesktop?: T;
  wideScreen?: T;
  default: T;
}): T => {
  if (Platform.OS !== 'web') return styles.default;
  
  const breakpoint = getCurrentBreakpoint();
  // 使用安全的屬性存取方式
  return breakpoint === 'mobile' ? (styles.mobile || styles.default) :
         breakpoint === 'tablet' ? (styles.tablet || styles.default) :
         breakpoint === 'desktop' ? (styles.desktop || styles.default) :
         breakpoint === 'largeDesktop' ? (styles.largeDesktop || styles.default) :
         breakpoint === 'wideScreen' ? (styles.wideScreen || styles.default) :
         styles.default;
};

// Web 專用基礎樣式
export const webStyles = StyleSheet.create({
  // 容器樣式
  container: {
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1200,
        marginHorizontal: 'auto' as any,
        paddingHorizontal: responsive({
          mobile: 16,
          tablet: 24,
          desktop: 32,
          default: 16,
        }),
      },
      default: {},
    }),
  },

  // 響應式網格容器
  gridContainer: {
    ...Platform.select({
      web: {
        display: 'grid' as any,
        gridTemplateColumns: responsive({
          mobile: '1fr',
          tablet: 'repeat(2, 1fr)',
          desktop: 'repeat(3, 1fr)',
          largeDesktop: 'repeat(4, 1fr)',
          default: '1fr',
        }),
        gap: 16,
      },
      default: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
      },
    }),
  },

  // 側邊欄佈局
  sidebarLayout: {
    ...Platform.select({
      web: {
        display: 'flex' as any,
        flexDirection: 'row' as const,
        gap: 24,
      },
      default: {},
    }),
  },

  sidebar: {
    ...Platform.select({
      web: {
        width: responsive({
          mobile: '100%',
          tablet: 280,
          desktop: 320,
          default: '100%',
        }),
        flexShrink: 0,
      },
      default: {},
    }),
  },

  mainContent: {
    ...Platform.select({
      web: {
        flex: 1,
        minWidth: 0, // 防止內容溢出
      },
      default: {
        flex: 1,
      },
    }),
  },

  // 滾動容器
  scrollView: {
    ...Platform.select({
      web: {
        height: '100%',
        overflowY: 'auto' as any,
        overflowX: 'hidden' as any,
        WebkitOverflowScrolling: 'touch' as any,
        scrollBehavior: 'smooth' as any,
      },
      default: {},
    }),
  },

  // 觸控優化
  touchable: {
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        userSelect: 'none' as any,
        transition: 'all 0.2s ease' as any,
        ':hover': {
          opacity: 0.8,
        },
        ':active': {
          transform: 'scale(0.98)',
        },
      },
      default: {},
    }),
  },

  // 文字選擇
  selectableText: {
    ...Platform.select({
      web: {
        userSelect: 'text' as any,
        cursor: 'text' as any,
      },
      default: {},
    }),
  },

  // 隱藏滾動條
  hideScrollbar: {
    ...Platform.select({
      web: {
        scrollbarWidth: 'none' as any,
        msOverflowStyle: 'none' as any,
        '::-webkit-scrollbar': {
          display: 'none',
        },
      },
      default: {},
    }),
  },

  // 桌面優化的模態框
  modalOverlay: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex' as any,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      },
      default: {},
    }),
  },

  modalContent: {
    ...Platform.select({
      web: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: responsive({
          mobile: '90%',
          tablet: 600,
          desktop: 800,
          default: '90%',
        }),
        maxHeight: '90vh',
        overflowY: 'auto' as any,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' as any,
      },
      default: {},
    }),
  },

  // 固定頭部
  fixedHeader: {
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      default: {},
    }),
  },

  // 浮動操作按鈕
  fab: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: responsive({
          mobile: 16,
          tablet: 24,
          desktop: 32,
          default: 16,
        }),
        right: responsive({
          mobile: 16,
          tablet: 24,
          desktop: 32,
          default: 16,
        }),
        zIndex: 999,
      },
      default: {
        position: 'absolute' as const,
        bottom: 16,
        right: 16,
      },
    }),
  },
});

// 條件樣式助手
export const webOnly = (styles: any) => {
  return Platform.OS === 'web' ? styles : {};
};

export const desktopOnly = (styles: any) => {
  return Platform.OS === 'web' && isDesktopWeb() ? styles : {};
};

export const mobileOnly = (styles: any) => {
  return Platform.OS !== 'web' || isMobileWeb() ? styles : {};
};

// 媒體查詢助手（用於更複雜的響應式需求）
export const mediaQuery = (
  minWidth?: number,
  maxWidth?: number,
  styles?: any
) => {
  if (Platform.OS !== 'web') return {};
  
  const { width } = getWebScreenInfo();
  const matchesMin = !minWidth || width >= minWidth;
  const matchesMax = !maxWidth || width <= maxWidth;
  
  return matchesMin && matchesMax ? styles : {};
};

// 動畫和過渡效果
export const transitions = {
  default: Platform.select({
    web: {
      transition: 'all 0.3s ease' as any,
    },
    default: {},
  }),
  
  fast: Platform.select({
    web: {
      transition: 'all 0.15s ease' as any,
    },
    default: {},
  }),
  
  slow: Platform.select({
    web: {
      transition: 'all 0.5s ease' as any,
    },
    default: {},
  }),
};

// 陰影效果（Web 優化）
export const shadows = {
  small: Platform.select({
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' as any,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  
  medium: Platform.select({
    web: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' as any,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
  
  large: Platform.select({
    web: {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' as any,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};