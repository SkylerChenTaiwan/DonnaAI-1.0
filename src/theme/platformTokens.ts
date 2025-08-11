/**
 * 跨平台設計 Token 定義
 * 提供統一的設計語言，支援 React Native 和 Web 平台
 */

// 基礎設計 Token 介面
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  motion: MotionTokens;
}

// 顏色 Token
export interface ColorTokens {
  // 品牌色
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // 主色
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // 語義色
  semantic: {
    success: { light: string; dark: string };
    warning: { light: string; dark: string };
    error: { light: string; dark: string };
    info: { light: string; dark: string };
  };
  
  // 功能色
  background: {
    primary: string;
    surface: string;
    elevated: string;
    input: string;
  };
  
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  
  border: {
    light: string;
    default: string;
    medium: string;
    dark: string;
  };
  
  // 按鈕狀態
  button: {
    primary: {
      default: string;
      hover: string;
      pressed: string;
    };
    secondary: {
      default: string;
      hover: string;
      pressed: string;
    };
  };
}

// 字體 Token
export interface TypographyTokens {
  fontFamily: {
    primary: string;
    mono: string;
  };
  
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

// 間距 Token
export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  '3xl': number;
  '4xl': number;
}

// 陰影 Token
export interface ShadowTokens {
  none: ShadowToken;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
}

export interface ShadowToken {
  // React Native 格式
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
  
  // Web CSS 格式
  boxShadow: string;
}

// 邊框 Token
export interface BorderTokens {
  width: {
    thin: number;
    medium: number;
    thick: number;
  };
  
  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  style: {
    solid: string;
    dashed: string;
    dotted: string;
  };
}

// 動畫 Token
export interface MotionTokens {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

// Web 專用 Token 擴展
export interface WebTokens extends DesignTokens {
  // CSS 變數對應
  cssVariables: Record<string, string>;
  
  // 媒體查詢
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  
  // Web 特有的陰影
  webShadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Z-index 層級
  zIndex: {
    hide: number;
    base: number;
    dropdown: number;
    overlay: number;
    modal: number;
    popover: number;
    tooltip: number;
  };
}

// Native 專用 Token 擴展
export interface NativeTokens extends DesignTokens {
  // Native 特有屬性
  haptics: {
    light: string;
    medium: string;
    heavy: string;
  };
  
  // Native 特有的陰影（elevation）
  elevations: {
    none: number;
    low: number;
    medium: number;
    high: number;
  };
}

// 主題模式
export type ThemeMode = 'light' | 'dark';

// 主題介面
export interface Theme {
  mode: ThemeMode;
  tokens: DesignTokens;
  webTokens?: Partial<WebTokens>;
  nativeTokens?: Partial<NativeTokens>;
}