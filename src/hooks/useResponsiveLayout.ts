/**
 * 統一的響應式佈局 Hook
 * 提供一致的斷點系統和佈局配置
 */

import { useWindowDimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

// 統一的斷點定義（與現有系統保持一致）
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  wideScreen: 1920
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop' | 'wideScreen';

interface ResponsiveLayout {
  breakpoint: Breakpoint;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isWideScreen: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  showSidebar: boolean;
  sidebarCollapsed: boolean;
  contentMaxWidth: number;
  contentPadding: number;
}

/**
 * 根據螢幕寬度獲取當前斷點
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wideScreen) return 'wideScreen';
  if (width >= BREAKPOINTS.largeDesktop) return 'largeDesktop';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * 獲取內容區域的配置
 */
function getContentConfig(breakpoint: Breakpoint) {
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
 * 統一的響應式佈局 Hook
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 計算當前斷點
  const breakpoint = getBreakpoint(width);
  
  // 計算各種狀態
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'largeDesktop' || breakpoint === 'wideScreen';
  const isLargeDesktop = breakpoint === 'largeDesktop' || breakpoint === 'wideScreen';
  const isWideScreen = breakpoint === 'wideScreen';
  const isPortrait = height > width;
  const isLandscape = width > height;

  // 自動調整側邊欄狀態
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // 平板橫向模式預設收合側邊欄
    if (isTablet && isLandscape) {
      setSidebarCollapsed(true);
    } else if (isDesktop) {
      setSidebarCollapsed(false);
    }
  }, [isTablet, isDesktop, isLandscape]);

  // 決定是否顯示側邊欄
  const showSidebar = Platform.OS === 'web' && (isDesktop || (isTablet && isLandscape));
  
  // 獲取內容配置
  const { maxWidth: contentMaxWidth, padding: contentPadding } = getContentConfig(breakpoint);

  return {
    breakpoint,
    screenWidth: width,
    screenHeight: height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isWideScreen,
    isPortrait,
    isLandscape,
    showSidebar,
    sidebarCollapsed,
    contentMaxWidth,
    contentPadding
  };
}

/**
 * 側邊欄狀態管理 Hook
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const { isTablet, isDesktop, isLandscape } = useResponsiveLayout();

  // 自動調整側邊欄狀態
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    if (isTablet && isLandscape) {
      setCollapsed(true);
    } else if (isDesktop) {
      setCollapsed(false);
    }
  }, [isTablet, isDesktop, isLandscape]);

  const toggle = () => setCollapsed(!collapsed);

  return {
    collapsed,
    setCollapsed,
    toggle
  };
}

/**
 * 響應式樣式輔助函數
 */
export function responsive<T>(styles: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  largeDesktop?: T;
  wideScreen?: T;
}): T | undefined {
  const { breakpoint } = useResponsiveLayout();
  
  // 從當前斷點開始向下查找
  const breakpointOrder: Breakpoint[] = ['wideScreen', 'largeDesktop', 'desktop', 'tablet', 'mobile'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (styles[bp]) {
      return styles[bp];
    }
  }
  
  return styles.mobile;
}