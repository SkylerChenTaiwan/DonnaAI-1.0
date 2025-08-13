/**
 * Web 平台檢測工具
 * 提供 Web 平台特定的檢測和判斷功能
 */

import { Platform } from 'react-native';

/**
 * 檢測是否為 Web 平台
 */
export const isWebPlatform = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * 檢測是否為行動裝置的 Web 瀏覽器
 * 使用統一的斷點系統而非 User Agent 檢測
 */
export const isMobileWeb = (): boolean => {
  if (!isWebPlatform()) return false;
  
  // 導入統一的斷點定義
  const { UNIFIED_BREAKPOINTS } = require('@/theme/responsive');
  const width = window.innerWidth;
  
  // 小於平板斷點視為手機
  return width < UNIFIED_BREAKPOINTS.tablet;
};

/**
 * 檢測是否為平板電腦的 Web 瀏覽器
 * 使用統一的斷點系統
 */
export const isTabletWeb = (): boolean => {
  if (!isWebPlatform()) return false;
  
  // 導入統一的斷點定義
  const { UNIFIED_BREAKPOINTS } = require('@/theme/responsive');
  const width = window.innerWidth;
  
  // 在平板和桌面斷點之間視為平板
  return width >= UNIFIED_BREAKPOINTS.tablet && width < UNIFIED_BREAKPOINTS.desktop;
};

/**
 * 檢測是否為桌面瀏覽器
 * 使用統一的斷點系統
 */
export const isDesktopWeb = (): boolean => {
  if (!isWebPlatform()) return false;
  
  // 導入統一的斷點定義
  const { UNIFIED_BREAKPOINTS } = require('@/theme/responsive');
  const width = window.innerWidth;
  
  // 大於或等於桌面斷點視為桌面
  return width >= UNIFIED_BREAKPOINTS.desktop;
};

/**
 * 獲取瀏覽器類型
 */
export const getBrowserType = (): string => {
  if (!isWebPlatform()) return 'not-web';
  
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  if (userAgent.indexOf('Firefox') > -1) return 'firefox';
  if (userAgent.indexOf('SamsungBrowser') > -1) return 'samsung';
  if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'opera';
  if (userAgent.indexOf('Trident') > -1) return 'ie';
  if (userAgent.indexOf('Edge') > -1) return 'edge-legacy';
  if (userAgent.indexOf('Edg') > -1) return 'edge';
  if (userAgent.indexOf('Chrome') > -1) return 'chrome';
  if (userAgent.indexOf('Safari') > -1) return 'safari';
  
  return 'unknown';
};

/**
 * 檢查瀏覽器功能支援
 */
export const checkWebFeatures = () => {
  if (!isWebPlatform()) {
    return {
      webAudio: false,
      notifications: false,
      indexedDB: false,
      serviceWorker: false,
      webRTC: false,
      fileAPI: false,
      webGL: false };
  }

  return {
    webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
    notifications: 'Notification' in window,
    indexedDB: !!window.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
    webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })() };
};

/**
 * 獲取螢幕資訊
 */
export const getWebScreenInfo = () => {
  if (!isWebPlatform()) {
    return {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      orientation: 'portrait' as 'portrait' | 'landscape',
      isTouchDevice: false };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: width > height ? 'landscape' as const : 'portrait' as const,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0 };
};

/**
 * 檢查是否支援 PWA
 */
export const isPWACapable = (): boolean => {
  if (!isWebPlatform()) return false;
  
  const features = checkWebFeatures();
  return features.serviceWorker && features.notifications && features.indexedDB;
};

/**
 * 檢查是否在 PWA 模式下運行
 */
export const isRunningAsPWA = (): boolean => {
  if (!isWebPlatform()) return false;
  
  // 檢查是否在獨立模式下運行
  const isStandalone = (window.matchMedia('(display-mode: standalone)').matches) ||
    ((window.navigator as any).standalone) || // iOS
    document.referrer.includes('android-app://'); // Android
    
  return isStandalone;
};

/**
 * 獲取最佳的儲存方案
 */
export const getWebStorageMethod = () => {
  if (!isWebPlatform()) return 'none';
  
  const features = checkWebFeatures();
  
  if (features.indexedDB) return 'indexedDB';
  if (window.localStorage) return 'localStorage';
  
  return 'memory';
};

/**
 * 檢查是否為安全上下文（HTTPS）
 */
export const isSecureContext = (): boolean => {
  if (!isWebPlatform()) return true; // 原生應用視為安全
  
  return window.isSecureContext || window.location.protocol === 'https:';
};

/**
 * 獲取 Web 平台的限制
 */
export const getWebLimitations = () => {
  if (!isWebPlatform()) {
    return {
      hasAudioRecording: true,
      hasBackgroundAudio: true,
      hasFileSystemAccess: true,
      hasPushNotifications: true,
      hasOfflineCapability: true };
  }

  const features = checkWebFeatures();
  
  return {
    hasAudioRecording: features.webRTC,
    hasBackgroundAudio: false, // Web 無法在背景播放音訊
    hasFileSystemAccess: features.fileAPI,
    hasPushNotifications: features.notifications && features.serviceWorker,
    hasOfflineCapability: features.serviceWorker && features.indexedDB };
};

/**
 * 平台特定的樣式調整
 */
export const getWebStyles = () => {
  const baseStyles = {
    container: {},
    scrollView: {},
    touchable: {} };

  if (!isWebPlatform()) return baseStyles;

  const screenInfo = getWebScreenInfo();
  const isDesktop = isDesktopWeb();

  return {
    container: {
      ...(isDesktop && {
        maxWidth: 1200,
        marginHorizontal: 'auto' as const }) },
    scrollView: {
      // Web 平台的滾動行為
      scrollBehavior: 'smooth' as const,
      WebkitOverflowScrolling: 'touch' as const },
    touchable: {
      // 桌面平台的游標樣式
      ...(isDesktop && {
        cursor: 'pointer' as const }),
      // 觸控裝置的樣式
      ...(!screenInfo.isTouchDevice && {
        ':hover': {
          opacity: 0.8 } }) } };
};