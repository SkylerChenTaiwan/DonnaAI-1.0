/**
 * 統一的響應式佈局 Hook
 * 提供一致的斷點系統和佈局配置
 */

import { useWindowDimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { 
  UNIFIED_BREAKPOINTS, 
  Breakpoint, 
  getBreakpoint, 
  getContentConfig,
  selectResponsiveStyle,
  ResponsiveStyle 
} from '@/theme/responsive';

// 為了向後相容，導出別名
export const BREAKPOINTS = UNIFIED_BREAKPOINTS;

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

// 函數已經從 theme/responsive.ts 引入

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
export function responsive<T>(styles: ResponsiveStyle<T>): T | undefined {
  const { breakpoint } = useResponsiveLayout();
  return selectResponsiveStyle(breakpoint, styles);
}