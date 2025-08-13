/**
 * 簡化的響應式 Hook
 * 根據 PRP-81 實作，提供統一的響應式狀態管理
 */

import { useState, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { UNIFIED_BREAKPOINTS } from '@/theme/responsive';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideScreen: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  screenWidth: number;
  screenHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * 統一的響應式 Hook
 * 提供簡單明確的響應式狀態
 */
export function useResponsive(): ResponsiveState {
  const { width, height } = useWindowDimensions();
  const [screenDimensions, setScreenDimensions] = useState({ width, height });
  
  // 在 Web 平台監聽視窗大小變化
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight });
    };
    
    // 初始設定
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 使用實際的視窗尺寸（Web）或 React Native 的尺寸（移動端）
  const actualWidth = Platform.OS === 'web' ? screenDimensions.width : width;
  const actualHeight = Platform.OS === 'web' ? screenDimensions.height : height;
  
  // 計算斷點
  let breakpoint: ResponsiveState['breakpoint'];
  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;
  let isWideScreen = false;
  
  if (actualWidth < UNIFIED_BREAKPOINTS.tablet) {
    breakpoint = 'mobile';
    isMobile = true;
  } else if (actualWidth < UNIFIED_BREAKPOINTS.desktop) {
    breakpoint = 'tablet';
    isTablet = true;
  } else if (actualWidth < UNIFIED_BREAKPOINTS.wideScreen) {
    breakpoint = 'desktop';
    isDesktop = true;
  } else {
    breakpoint = 'wide';
    isWideScreen = true;
    isDesktop = true; // 寬螢幕也算是桌面
  }
  
  // 方向
  const isPortrait = actualHeight > actualWidth;
  const isLandscape = actualWidth > actualHeight;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
    breakpoint,
    screenWidth: actualWidth,
    screenHeight: actualHeight,
    isPortrait,
    isLandscape };
}

/**
 * 導出預設 Hook
 */
export default useResponsive;