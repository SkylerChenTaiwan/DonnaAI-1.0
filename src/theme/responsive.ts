/**
 * 統一的響應式斷點系統
 * 解決多個佈局系統使用不同斷點定義的問題
 * 
 * Created for: PRP-61 Web 響應式佈局統一化
 * Purpose: 提供全應用程式一致的斷點定義和響應式工具
 */

import { Platform } from 'react-native';

/**
 * 統一的斷點定義
 * 所有響應式相關的組件和工具都應該引用這個定義
 */
export const UNIFIED_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  wideScreen: 1920
} as const;

/**
 * 側邊欄顯示斷點
 * 平板橫向(768px)以上顯示側邊欄
 */
export const SIDEBAR_BREAKPOINT = UNIFIED_BREAKPOINTS.tablet;

/**
 * 桌面版斷點
 * 1024px 以上視為桌面版
 */
export const DESKTOP_BREAKPOINT = UNIFIED_BREAKPOINTS.desktop;

/**
 * 斷點類型定義
 */
export type Breakpoint = keyof typeof UNIFIED_BREAKPOINTS;

/**
 * 響應式樣式類型
 */
export type ResponsiveStyle<T> = {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  largeDesktop?: T;
  wideScreen?: T;
  default?: T;
};

/**
 * 根據螢幕寬度獲取當前斷點
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= UNIFIED_BREAKPOINTS.wideScreen) return 'wideScreen';
  if (width >= UNIFIED_BREAKPOINTS.largeDesktop) return 'largeDesktop';
  if (width >= UNIFIED_BREAKPOINTS.desktop) return 'desktop';
  if (width >= UNIFIED_BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * 檢查是否為特定斷點或以上
 */
export function isBreakpointOrLarger(width: number, breakpoint: Breakpoint): boolean {
  return width >= UNIFIED_BREAKPOINTS[breakpoint];
}

/**
 * 獲取內容區域的配置
 */
export function getContentConfig(breakpoint: Breakpoint) {
  switch (breakpoint) {
    case 'wideScreen':
      return { maxWidth: 1600, padding: 48 };
    case 'largeDesktop':
      return { maxWidth: 1440, padding: 32 };
    case 'desktop':
      return { maxWidth: 1200, padding: 24 };
    case 'tablet':
      return { maxWidth: 768, padding: 20 };
    case 'mobile':
    default:
      return { maxWidth: 480, padding: 16 };
  }
}

/**
 * 響應式樣式選擇器
 * 根據當前斷點選擇合適的樣式
 */
export function selectResponsiveStyle<T>(
  breakpoint: Breakpoint,
  styles: ResponsiveStyle<T>
): T | undefined {
  // 從當前斷點開始向下查找
  const breakpointOrder: Breakpoint[] = ['wideScreen', 'largeDesktop', 'desktop', 'tablet', 'mobile'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    // 使用安全的屬性存取方式
    const styleValue = bp === 'wideScreen' ? styles.wideScreen :
                      bp === 'largeDesktop' ? styles.largeDesktop :
                      bp === 'desktop' ? styles.desktop :
                      bp === 'tablet' ? styles.tablet :
                      bp === 'mobile' ? styles.mobile :
                      undefined;
    
    if (styleValue !== undefined) {
      return styleValue;
    }
  }
  
  return styles.default || styles.mobile;
}

/**
 * 網格系統配置
 */
export const GRID_CONFIG = {
  mobile: { columns: 1, gap: 16 },
  tablet: { columns: 2, gap: 20 },
  desktop: { columns: 3, gap: 24 },
  largeDesktop: { columns: 4, gap: 24 },
  wideScreen: { columns: 4, gap: 32 }
} as const;

/**
 * 側邊欄寬度配置
 */
export const SIDEBAR_WIDTH = {
  collapsed: 64,
  mobile: 280,
  tablet: 280,
  desktop: 320,
  largeDesktop: 320,
  wideScreen: 360
} as const;

/**
 * 頁面佈局分類
 * 用於決定哪些頁面需要側邊欄導航
 */
export const PAGE_CATEGORIES = {
  // 主要 Tab 頁面
  tabs: ['Home', 'Database', 'Tools', 'Settings'],
  
  // 管理頁面（需要側邊欄）
  admin: [
    'Organizations',
    'OrganizationDetailScreen',
    'UserManagement', 
    'AdminDashboard',
    'LegacyDataImportScreen'
  ],
  
  // 詳細檢視頁面（需要側邊欄）
  details: [
    'CustomerDetail',
    'RecordDetail',
    'TaskDetail',
    'PersonnelDetail'
  ],
  
  // Modal 和小工具頁面（不需要側邊欄）
  modals: [
    'CreateTask',
    'CreateRecord',
    'CreateCustomer',
    'EditProfile'
  ],
  
  // 認證相關頁面（不需要側邊欄）
  auth: [
    'Login',
    'Register',
    'ForgotPassword',
    'ResetPassword'
  ]
} as const;

/**
 * 檢查頁面是否需要側邊欄
 */
export function shouldShowSidebarForRoute(routeName: string): boolean {
  // 認證和 Modal 頁面不顯示側邊欄
  if (PAGE_CATEGORIES.auth.includes(routeName as any) || 
      PAGE_CATEGORIES.modals.includes(routeName as any)) {
    return false;
  }
  
  // 其他頁面在 Web 平台顯示側邊欄
  return Platform.OS === 'web';
}

/**
 * 響應式內邊距配置
 */
export const RESPONSIVE_PADDING = {
  mobile: { horizontal: 16, vertical: 16 },
  tablet: { horizontal: 24, vertical: 20 },
  desktop: { horizontal: 32, vertical: 24 },
  largeDesktop: { horizontal: 40, vertical: 32 },
  wideScreen: { horizontal: 48, vertical: 40 }
} as const;

/**
 * 導出兼容性別名（為了向後兼容）
 */
export const breakpoints = UNIFIED_BREAKPOINTS;
export const BREAKPOINTS = UNIFIED_BREAKPOINTS;