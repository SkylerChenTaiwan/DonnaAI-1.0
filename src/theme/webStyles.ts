/**
 * Web CSS 轉換器和樣式優先級管理
 * 處理 React Native 樣式到 CSS 的轉換和全域 CSS 衝突解決
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { DesignSystem, webTokens } from './designSystem';
import { PlatformAdapter } from '../components/adaptive/platform/PlatformAdapter';

type RNStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Web 樣式轉換器
 * 提供 React Native 到 CSS 的高級轉換功能
 */
export class WebStyleConverter {
  private platformAdapter: PlatformAdapter;

  constructor() {
    this.platformAdapter = PlatformAdapter.getInstance();
  }

  /**
   * 轉換 React Native 樣式到 Web CSS
   */
  convert(style: RNStyle, options: ConvertOptions = {}): CSSProperties {
    if (!style) return {};

    const {
      useImportant = false,
      prefix = '',
      responsive = false,
      designTokens = true } = options;

    let convertedStyle = this.basicConvert(style, { designTokens });

    // 處理響應式
    if (responsive) {
      convertedStyle = this.addResponsiveStyle(convertedStyle);
    }

    // 添加前綴
    if (prefix) {
      convertedStyle = this.addPrefix(convertedStyle, prefix);
    }

    // 添加 !important
    if (useImportant) {
      convertedStyle = this.addImportant(convertedStyle);
    }

    return convertedStyle;
  }

  /**
   * 基礎轉換
   */
  private basicConvert(style: RNStyle, options: { designTokens: boolean }): CSSProperties {
    const cssStyle: CSSProperties = {};

    Object.entries(style).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // 設計 Token 替換
      if (options.designTokens) {
        value = this.replaceWithDesignToken(key, value);
      }

      const converted = this.convertProperty(key, value);
      if (converted) {
        Object.assign(cssStyle, converted);
      }
    });

    return cssStyle;
  }

  /**
   * 使用設計 Token 替換硬編碼值
   */
  private replaceWithDesignToken(key: string, value: any): any {
    // 顏色替換
    if (this.isColorProperty(key) && typeof value === 'string') {
      const tokenColor = this.findColorToken(value);
      return tokenColor || value;
    }

    // 間距替換
    if (this.isSpacingProperty(key) && typeof value === 'number') {
      const tokenSpacing = this.findSpacingToken(value);
      return tokenSpacing || value;
    }

    // 字體大小替換
    if (key === 'fontSize' && typeof value === 'number') {
      const tokenFontSize = this.findFontSizeToken(value);
      return tokenFontSize || value;
    }

    return value;
  }

  /**
   * 轉換單個屬性
   */
  private convertProperty(key: string, value: any): CSSProperties | null {
    // 使用 WebStyleAdapter 的轉換邏輯
    const adapter = this.platformAdapter.getStyleAdapter();
    return (adapter as any).convertProperty?.(key, value) || this.fallbackConvert(key, value);
  }

  /**
   * 回退轉換邏輯
   */
  private fallbackConvert(key: string, value: any): CSSProperties | null {
    // 直接映射的屬性
    const directMap: Record<string, string> = {
      backgroundColor: 'backgroundColor',
      color: 'color',
      fontSize: 'fontSize',
      fontWeight: 'fontWeight',
      opacity: 'opacity',
      width: 'width',
      height: 'height' };

    if (directMap[key]) {
      return { [directMap[key]]: value };
    }

    return null;
  }

  /**
   * 添加響應式樣式
   */
  private addResponsiveStyle(style: CSSProperties): CSSProperties {
    if (!webTokens.breakpoints) return style;

    const responsiveStyle: CSSProperties = { ...style };

    // 為小螢幕添加調整
    if (style.fontSize) {
      responsiveStyle[`@media ${webTokens.breakpoints.mobile}`] = {
        fontSize: `calc(${style.fontSize} * 0.9)` };
    }

    // 為大螢幕添加調整
    if (style.padding || style.margin) {
      responsiveStyle[`@media ${webTokens.breakpoints.desktop}`] = {
        padding: style.padding ? `calc(${style.padding} * 1.1)` : undefined,
        margin: style.margin ? `calc(${style.margin} * 1.1)` : undefined };
    }

    return responsiveStyle;
  }

  /**
   * 添加 CSS 前綴
   */
  private addPrefix(style: CSSProperties, prefix: string): CSSProperties {
    const prefixedStyle: CSSProperties = {};

    Object.entries(style).forEach(([key, value]) => {
      if (key.startsWith('@') || key.startsWith(':')) {
        // 媒體查詢和偽類保持不變
        prefixedStyle[key] = value;
      } else {
        prefixedStyle[key] = value;
      }
    });

    return prefixedStyle;
  }

  /**
   * 添加 !important 標記
   */
  private addImportant(style: CSSProperties): CSSProperties {
    const importantStyle: CSSProperties = {};

    Object.entries(style).forEach(([key, value]) => {
      if (typeof value === 'string' && !value.includes('!important')) {
        importantStyle[key as keyof CSSProperties] = `${value} !important` as any;
      } else {
        importantStyle[key as keyof CSSProperties] = value;
      }
    });

    return importantStyle;
  }

  /**
   * 是否為顏色屬性
   */
  private isColorProperty(key: string): boolean {
    return ['color', 'backgroundColor', 'borderColor', 'shadowColor'].includes(key);
  }

  /**
   * 是否為間距屬性
   */
  private isSpacingProperty(key: string): boolean {
    const spacingProps = [
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'marginHorizontal', 'marginVertical',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'paddingHorizontal', 'paddingVertical',
      'top', 'right', 'bottom', 'left',
    ];
    return spacingProps.includes(key);
  }

  /**
   * 尋找對應的顏色 Token
   */
  private findColorToken(value: string): string | null {
    const colors = DesignSystem.colors;
    
    // 檢查主要顏色
    if (colors.primary === value) return 'var(--color-primary)';
    
    // 檢查背景色
    Object.entries(colors.background).forEach(([key, color]) => {
      if (color === value) return `var(--color-background-${key})`;
    });
    
    // 檢查文字色
    Object.entries(colors.text).forEach(([key, color]) => {
      if (color === value) return `var(--color-text-${key})`;
    });
    
    return null;
  }

  /**
   * 尋找對應的間距 Token
   */
  private findSpacingToken(value: number): string | null {
    const spacing = DesignSystem.spacing;
    
    Object.entries(spacing).forEach(([key, space]) => {
      if (space === value) return `var(--spacing-${key})`;
    });
    
    return null;
  }

  /**
   * 尋找對應的字體大小 Token
   */
  private findFontSizeToken(value: number): string | null {
    const typography = DesignSystem.typography;
    
    Object.entries(typography).forEach(([key, typo]) => {
      if (typo.fontSize === value) return `var(--font-size-${key})`;
    });
    
    return null;
  }
}

/**
 * 轉換選項介面
 */
export interface ConvertOptions {
  useImportant?: boolean;
  prefix?: string;
  responsive?: boolean;
  designTokens?: boolean;
}

/**
 * CSS 優先級管理器
 * 解決與全域 CSS 的衝突問題
 */
export class CSSPriorityManager {
  private globalCSSSelectors: Set<string> = new Set();

  /**
   * 註冊全域 CSS 選擇器
   */
  registerGlobalCSS(selectors: string[]): void {
    selectors.forEach(selector => this.globalCSSSelectors.add(selector));
  }

  /**
   * 產生高優先級樣式
   */
  createHighPriorityStyle(
    style: CSSProperties,
    selector: string = ''
  ): CSSProperties {
    const highPriorityStyle: CSSProperties = {};

    Object.entries(style).forEach(([key, value]) => {
      if (this.needsHighPriority(key, selector)) {
        if (typeof value === 'string' && !value.includes('!important')) {
          highPriorityStyle[key as keyof CSSProperties] = `${value} !important` as any;
        } else {
          highPriorityStyle[key as keyof CSSProperties] = value;
        }
      } else {
        highPriorityStyle[key as keyof CSSProperties] = value;
      }
    });

    return highPriorityStyle;
  }

  /**
   * 檢查是否需要高優先級
   */
  private needsHighPriority(property: string, selector: string): boolean {
    // 如果全域 CSS 包含相同的選擇器，則需要高優先級
    if (this.globalCSSSelectors.has(selector)) {
      return true;
    }

    // 特定屬性總是需要高優先級
    const alwaysHighPriority = ['color', 'backgroundColor', 'fontSize', 'fontWeight'];
    return alwaysHighPriority.includes(property);
  }

  /**
   * 產生 CSS-in-JS 物件（帶有優先級管理）
   */
  createCSSInJS(styles: Record<string, RNStyle>): Record<string, CSSProperties> {
    const converter = new WebStyleConverter();
    const cssInJS: Record<string, CSSProperties> = {};

    Object.entries(styles).forEach(([key, style]) => {
      const convertedStyle = converter.convert(style, { designTokens: true });
      cssInJS[key] = this.createHighPriorityStyle(convertedStyle, key);
    });

    return cssInJS;
  }
}

/**
 * 工具函數：快速轉換樣式
 */
export const convertStyle = (
  style: RNStyle,
  options: ConvertOptions = {}
): CSSProperties => {
  const converter = new WebStyleConverter();
  return converter.convert(style, options);
};

/**
 * 工具函數：建立響應式樣式
 */
export const createResponsiveStyle = (styles: {
  mobile?: RNStyle;
  tablet?: RNStyle;
  desktop?: RNStyle;
  base?: RNStyle;
}): CSSProperties => {
  const converter = new WebStyleConverter();
  const responsiveStyle: CSSProperties = {};

  // 基礎樣式
  if (styles.base) {
    Object.assign(responsiveStyle, converter.convert(styles.base));
  }

  // 手機樣式
  if (styles.mobile && webTokens.breakpoints) {
    responsiveStyle[`@media ${webTokens.breakpoints.mobile}`] = converter.convert(styles.mobile);
  }

  // 平板樣式
  if (styles.tablet && webTokens.breakpoints) {
    responsiveStyle[`@media ${webTokens.breakpoints.tablet}`] = converter.convert(styles.tablet);
  }

  // 桌面樣式
  if (styles.desktop && webTokens.breakpoints) {
    responsiveStyle[`@media ${webTokens.breakpoints.desktop}`] = converter.convert(styles.desktop);
  }

  return responsiveStyle;
};

/**
 * 工具函數：建立主題感知樣式
 */
export const createThemedStyle = (
  lightStyle: RNStyle,
  darkStyle?: RNStyle
): CSSProperties => {
  const converter = new WebStyleConverter();
  const themedStyle: CSSProperties = {};

  // 淺色主題樣式
  Object.assign(themedStyle, converter.convert(lightStyle));

  // 深色主題樣式
  if (darkStyle) {
    themedStyle['.theme-dark &'] = converter.convert(darkStyle);
  }

  return themedStyle;
};

// 單例實例
export const webStyleConverter = new WebStyleConverter();
export const cssPriorityManager = new CSSPriorityManager();

// 註冊已知的全域 CSS 選擇器
cssPriorityManager.registerGlobalCSS([
  '.notion-table',
  '.notion-cell',
  '.notion-header',
  '.database-container',
  '.table-cell',
  '.editable-cell',
]);

// 匯出常用的轉換函數
export {
  WebStyleConverter,
  CSSPriorityManager };