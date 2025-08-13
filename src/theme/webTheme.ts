/**
 * Web 平台主題適配器
 * 提供 CSS-in-JS 主題物件和動態主題切換支援
 */

import { DesignSystem, webTokens, generateCSSVariables } from './designSystem';
import type { Theme, ThemeMode, DesignTokens } from './platformTokens';

// Web 主題介面
export interface WebTheme {
  mode: ThemeMode;
  colors: typeof DesignSystem.colors;
  typography: typeof DesignSystem.typography;
  spacing: typeof DesignSystem.spacing;
  shadows: {
    // React Native 格式（用於 styled-components）
    native: typeof DesignSystem.shadows;
    // Web CSS 格式
    css: typeof webTokens.webShadows;
  };
  borders: {
    radius: typeof DesignSystem.borderRadius;
  };
  transitions: typeof DesignSystem.transitions;
  breakpoints: typeof webTokens.breakpoints;
  zIndex: typeof webTokens.zIndex;
  cssVariables: typeof webTokens.cssVariables;
}

// 淺色主題
export const lightTheme: WebTheme = {
  mode: 'light',
  colors: DesignSystem.colors,
  typography: DesignSystem.typography,
  spacing: DesignSystem.spacing,
  shadows: {
    native: DesignSystem.shadows,
    css: webTokens.webShadows! },
  borders: {
    radius: DesignSystem.borderRadius },
  transitions: DesignSystem.transitions,
  breakpoints: webTokens.breakpoints!,
  zIndex: webTokens.zIndex!,
  cssVariables: webTokens.cssVariables! };

// 深色主題（基於淺色主題的反轉）
export const darkTheme: WebTheme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    ...DesignSystem.colors,
    // 反轉背景色
    background: {
      primary: '#2C2C2C',
      surface: '#2A2A2A',
      elevated: '#3A3A3A',
      input: '#333333' },
    // 反轉文字色
    text: {
      primary: '#2C2C2C',
      secondary: '#CCCCCC',
      tertiary: '#999999',
      disabled: '#666666',
      inverse: '#1A1A1A' },
    // 調整邊框色
    border: {
      light: '#404040',
      default: '#555555',
      medium: '#666666',
      dark: '#777777' } },
  cssVariables: {
    ...webTokens.cssVariables!,
    // 更新深色主題的 CSS 變數
    '--color-background-primary': '#1A1A1A',
    '--color-background-surface': '#2A2A2A',
    '--color-background-input': '#333333',
    '--color-text-primary': '#FFFFFF',
    '--color-text-secondary': '#CCCCCC',
    '--color-border-default': '#555555',
    '--color-border-light': '#404040' } };

// 主題管理器類別
export class WebThemeManager {
  private currentTheme: WebTheme = lightTheme;
  private listeners: Set<(theme: WebTheme) => void> = new Set();

  /**
   * 取得當前主題
   */
  getCurrentTheme(): WebTheme {
    return this.currentTheme;
  }

  /**
   * 設定主題
   */
  setTheme(theme: WebTheme): void {
    this.currentTheme = theme;
    this.updateDocumentStyles();
    this.notifyListeners();
  }

  /**
   * 切換主題模式
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme.mode === 'light' ? darkTheme : lightTheme;
    this.setTheme(newTheme);
  }

  /**
   * 訂閱主題變更
   */
  subscribe(listener: (theme: WebTheme) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有監聽者
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  /**
   * 更新 document 的 CSS 變數
   */
  private updateDocumentStyles(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // 設定 CSS 變數
    Object.entries(this.currentTheme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // 設定主題模式 class
    root.classList.toggle('theme-dark', this.currentTheme.mode === 'dark');
    root.classList.toggle('theme-light', this.currentTheme.mode === 'light');
  }

  /**
   * 從 localStorage 載入主題偏好
   */
  loadThemePreference(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const savedTheme = localStorage.getItem('theme-preference');
      if (savedTheme === 'dark') {
        this.setTheme(darkTheme);
      } else if (savedTheme === 'light') {
        this.setTheme(lightTheme);
      } else {
        // 使用系統偏好
        this.useSystemTheme();
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      this.useSystemTheme();
    }
  }

  /**
   * 儲存主題偏好到 localStorage
   */
  saveThemePreference(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('theme-preference', this.currentTheme.mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * 使用系統主題偏好
   */
  private useSystemTheme(): void {
    if (typeof window === 'undefined') return;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark ? darkTheme : lightTheme);
    
    // 監聽系統主題變更
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme-preference')) {
        this.setTheme(e.matches ? darkTheme : lightTheme);
      }
    });
  }

  /**
   * 初始化主題管理器
   */
  initialize(): void {
    this.loadThemePreference();
  }
}

// 單例主題管理器
export const webThemeManager = new WebThemeManager();

// 建立主題物件（用於 styled-components）
export const createStyledTheme = (theme: WebTheme) => ({
  colors: theme.colors,
  typography: theme.typography,
  spacing: theme.spacing,
  shadows: theme.shadows.css,
  borders: theme.borders,
  transitions: theme.transitions,
  breakpoints: theme.breakpoints,
  zIndex: theme.zIndex,
  mode: theme.mode });

// CSS-in-JS 樣式生成器
export const createCSSInJS = (theme: WebTheme) => ({
  // 顏色工具函數
  color: (name: keyof typeof theme.colors | string): string => {
    const colorPath = name.split('.');
    let color: any = theme.colors;
    
    for (const path of colorPath) {
      color = color?.[path];
    }
    
    return color || name;
  },
  
  // 間距工具函數
  spacing: (multiplier: number): string => {
    return `${theme.spacing.md * multiplier}px`;
  },
  
  // 響應式工具函數
  breakpoint: (bp: keyof typeof theme.breakpoints) => {
    return `@media ${theme.breakpoints[bp]}`;
  },
  
  // 陰影工具函數
  shadow: (level: keyof typeof theme.shadows.css): string => {
    return theme.shadows.css[level];
  },
  
  // 過渡動畫工具函數
  transition: (property: string = 'all', duration: keyof typeof theme.transitions = 'normal'): string => {
    return `${property} ${theme.transitions[duration]}ms ease`;
  } });

// 生成全域 CSS 字串
export const generateGlobalCSS = (theme: WebTheme): string => {
  return `
    :root {
      ${generateCSSVariables()}
    }
    
    .theme-light {
      color-scheme: light;
    }
    
    .theme-dark {
      color-scheme: dark;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: ${theme.typography.body.fontSize}px;
      line-height: ${theme.typography.body.lineHeight / theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
      background-color: ${theme.colors.background.primary};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    button, input, textarea, select {
      font-family: inherit;
    }
    
    button {
      cursor: pointer;
      border: none;
      background: none;
      padding: 0;
    }
    
    a {
      color: ${theme.colors.primary};
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
  `;
};

// Hook 用於 React 元件
export const useWebTheme = () => {
  const [theme, setTheme] = React.useState(webThemeManager.getCurrentTheme());
  
  React.useEffect(() => {
    const unsubscribe = webThemeManager.subscribe(setTheme);
    return unsubscribe;
  }, []);
  
  return {
    theme,
    setTheme: webThemeManager.setTheme.bind(webThemeManager),
    toggleTheme: webThemeManager.toggleTheme.bind(webThemeManager),
    isDark: theme.mode === 'dark',
    isLight: theme.mode === 'light' };
};

// React import 修正
import React from 'react';