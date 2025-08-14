import { Platform } from 'react-native';
/**
 * 設計系統常量
 * 基於 Notion 風格的單色灰階設計系統
 * 擴展支援跨平台 Web 和 Native
 */

import type { WebTokens, DesignTokens } from './platformTokens';

export const DesignSystem = {
  colors: {
    // 主色調 - 深灰色用於按鈕和互動元素（Linear 風格）
    primary: '#2C2C2C',
    
    // 背景色
    background: {
      primary: '#FFFFFF',  // 主背景 - 純白
      surface: '#FFFFFF',  // 卡片背景 - 純白
      elevated: '#FFFFFF', // 提升的背景 - 純白
      input: '#FAFAFA',    // 輸入欄位背景 - 極淺灰
    },
    
    // 按鈕專用色彩系統
    button: {
      // 主要按鈕
      primary: {
        default: '#2C2C2C',
        hover: '#3C3C3C',
        pressed: '#1C1C1C' },
      // 次要按鈕
      secondary: {
        default: '#F7F7F7',
        hover: '#ECECEC',
        pressed: '#E0E0E0' },
      // 輪廓按鈕
      outline: {
        border: '#D0D0D0',
        borderHover: '#A0A0A0',
        background: 'transparent',
        backgroundHover: 'rgba(0, 0, 0, 0.03)' },
      // Ghost 按鈕
      ghost: {
        background: 'transparent',
        backgroundHover: 'rgba(0, 0, 0, 0.05)' },
      // 文字按鈕
      text: {
        color: '#2C2C2C',
        underline: 'rgba(44, 44, 44, 0.3)' } },
    
    // 文字色
    text: {
      primary: '#2C2C2C',   // 主要文字
      secondary: '#666666', // 次要文字
      tertiary: '#999999',  // 第三級文字
      disabled: '#CCCCCC',  // 禁用文字
      inverse: '#FFFFFF',   // 反色文字（用於深色背景）
    },
    
    // 邊框色
    border: {
      light: '#E5E7EB',    // 淺邊框
      default: '#D1D5DB',  // 預設邊框
      medium: '#B5B5B5',   // 中等邊框 - 提升對比度
      dark: '#9CA3AF',     // 深邊框
    },
    
    // 狀態色 - 僅保留必要的功能色
    status: {
      success: '#34C759',  // 成功綠
      warning: '#FF9500',  // 警告橙
      error: '#FF3B30',    // 錯誤紅
      info: '#5856D6',     // 資訊紫（保留但減少使用）
    },
    
    // 灰階
    gray: {
      50: '#FAFAFA',
      100: '#F8F8F8',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717' },
    
    // 灰階簡寫（為了向後相容）
    gray50: '#FAFAFA',
    gray100: '#F8F8F8',
    gray200: '#E5E5E5',
    gray300: '#D4D4D4',
    gray400: '#A3A3A3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    
    // 狀態色簡寫（為了向後相容）
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5856D6' },
  
  // 間距系統
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48 },
  
  // 圓角系統
  borderRadius: {
    button: 6,  // 按鈕專用 - 更細膩的圓角
    sm: 8,      // 小元素
    md: 12,     // 卡片、容器
    lg: 16,     // 大卡片、模態框
    xl: 24,     // 特大圓角
    full: 9999, // 完全圓角
  },
  
  // 陰影系統
  shadows: {
    none: {
      shadowColor: 'transparent',
      ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 0 } }),
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0 },
    sm: {
      shadowColor: '#000',
      ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }),
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2 },
    md: {
      shadowColor: '#000',
      ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4 },
    lg: {
      shadowColor: '#000',
      ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }),
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8 } },
  
  // 字體大小系統
  typography: {
    // 標題
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const },
    h4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const },
    
    // 正文
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const },
    
    // 標籤
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const },
    
    // 按鈕
    button: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const },
    buttonSmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const },
    buttonLarge: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const } },
  
  // 過渡動畫
  transitions: {
    fast: 150,
    normal: 250,
    slow: 350 } };

// 輔助函數：生成一致的按鈕樣式
export const getButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  // 基礎樣式 - 無陰影
  const base = {
    borderRadius: DesignSystem.borderRadius.button,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    borderWidth: 0,
    ...DesignSystem.shadows.none };
  
  // 尺寸樣式
  const sizeStyles = {
    small: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      ...DesignSystem.typography.buttonSmall },
    medium: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      ...DesignSystem.typography.button },
    large: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      ...DesignSystem.typography.buttonLarge } };
  
  // 變體樣式
  const variantStyles = {
    primary: {
      backgroundColor: DesignSystem.colors.button.primary.default,
      color: DesignSystem.colors.text.inverse },
    secondary: {
      backgroundColor: DesignSystem.colors.button.secondary.default,
      color: DesignSystem.colors.primary },
    outline: {
      backgroundColor: DesignSystem.colors.button.outline.background,
      borderWidth: 1,
      borderColor: DesignSystem.colors.button.outline.border,
      color: DesignSystem.colors.primary },
    ghost: {
      backgroundColor: DesignSystem.colors.button.ghost.background,
      color: DesignSystem.colors.primary },
    text: {
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
      color: DesignSystem.colors.button.text.color } };
  
  return {
    ...base,
    ...sizeStyles[size],
    ...variantStyles[variant] };
};

// 輔助函數：生成一致的卡片樣式
export const getCardStyle = (elevated = false) => ({
  backgroundColor: DesignSystem.colors.background.surface,
  borderRadius: DesignSystem.borderRadius.md,
  padding: DesignSystem.spacing.md,
  ...(elevated ? DesignSystem.shadows.md : DesignSystem.shadows.sm) });

// 輔助函數：生成一致的文字樣式
export const getTextStyle = (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
  const colors = {
    primary: DesignSystem.colors.text.primary,
    secondary: DesignSystem.colors.text.secondary,
    tertiary: DesignSystem.colors.text.tertiary };
  
  return {
    color: colors[variant],
    ...DesignSystem.typography.body };
};

// Web 平台專用的設計 Tokens
export const webTokens: Partial<WebTokens> = {
  // CSS 變數定義
  cssVariables: {
    // 顏色
    '--color-primary': DesignSystem.colors.primary,
    '--color-background-primary': DesignSystem.colors.background.primary,
    '--color-background-surface': DesignSystem.colors.background.surface,
    '--color-background-input': DesignSystem.colors.background.input,
    '--color-text-primary': DesignSystem.colors.text.primary,
    '--color-text-secondary': DesignSystem.colors.text.secondary,
    '--color-border-default': DesignSystem.colors.border.default,
    '--color-border-light': DesignSystem.colors.border.light,
    '--color-success': DesignSystem.colors.success,
    '--color-warning': DesignSystem.colors.warning,
    '--color-error': DesignSystem.colors.error,
    
    // 間距
    '--spacing-xs': `${DesignSystem.spacing.xs}px`,
    '--spacing-sm': `${DesignSystem.spacing.sm}px`,
    '--spacing-md': `${DesignSystem.spacing.md}px`,
    '--spacing-lg': `${DesignSystem.spacing.lg}px`,
    '--spacing-xl': `${DesignSystem.spacing.xl}px`,
    '--spacing-xxl': `${DesignSystem.spacing.xxl}px`,
    
    // 字體
    '--font-size-h1': `${DesignSystem.typography.h1.fontSize}px`,
    '--font-size-h2': `${DesignSystem.typography.h2.fontSize}px`,
    '--font-size-h3': `${DesignSystem.typography.h3.fontSize}px`,
    '--font-size-body': `${DesignSystem.typography.body.fontSize}px`,
    
    // 圓角
    '--border-radius-sm': `${DesignSystem.borderRadius.sm}px`,
    '--border-radius-md': `${DesignSystem.borderRadius.md}px`,
    '--border-radius-lg': `${DesignSystem.borderRadius.lg}px`,
    
    // 動畫
    '--transition-fast': `${DesignSystem.transitions.fast}ms`,
    '--transition-normal': `${DesignSystem.transitions.normal}ms`,
    '--transition-slow': `${DesignSystem.transitions.slow}ms` },
  
  // 媒體查詢斷點
  breakpoints: {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    wide: '(min-width: 1440px)' },
  
  // Web 專用陰影（轉換 React Native 陰影到 CSS）
  webShadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.15)' },
  
  // Z-index 層級管理
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    overlay: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400 } };

// 生成 CSS 變數字串（用於注入到 document）
export const generateCSSVariables = (): string => {
  return Object.entries(webTokens.cssVariables || {})
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
};

// 取得響應式斷點檢查函數
export const createBreakpointChecker = () => {
  const checkBreakpoint = (breakpoint: keyof typeof webTokens.breakpoints) => {
    if (typeof window === 'undefined') return false;
    
    const query = webTokens.breakpoints?.[breakpoint];
    return query ? window.matchMedia(query).matches : false;
  };
  
  return {
    isMobile: () => checkBreakpoint('mobile'),
    isTablet: () => checkBreakpoint('tablet'),
    isDesktop: () => checkBreakpoint('desktop'),
    isWide: () => checkBreakpoint('wide') };
};