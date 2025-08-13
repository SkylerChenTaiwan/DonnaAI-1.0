/**
 * Native 樣式適配器
 * 處理 React Native StyleSheet 最佳化和樣式管理
 */

import { StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { StyleAdapter } from './PlatformAdapter';

type RNStyle = ViewStyle | TextStyle | ImageStyle;

export class NativeStyleAdapter implements StyleAdapter {
  private styleSheetCache: Map<string, any> = new Map();

  /**
   * 適配樣式 - 主要入口點
   */
  adaptStyle(style: RNStyle, nativeSpecificStyle?: RNStyle): RNStyle {
    // 合併原生特定樣式
    if (nativeSpecificStyle) {
      return { ...style, ...nativeSpecificStyle };
    }
    
    return style;
  }

  /**
   * 轉換為 React Native StyleSheet（最佳化版本）
   */
  convertToRNStyle(style: RNStyle): RNStyle {
    // React Native 不需要轉換，直接返回
    return this.optimizeStyle(style);
  }

  /**
   * 最佳化樣式物件
   */
  private optimizeStyle(style: RNStyle): RNStyle {
    if (!style) return {};
    
    const optimizedStyle: RNStyle = {};
    
    Object.entries(style).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        optimizedStyle[key as keyof RNStyle] = this.optimizeValue(key, value);
      }
    });
    
    return optimizedStyle;
  }

  /**
   * 最佳化單個屬性值
   */
  private optimizeValue(key: string, value: any): any {
    // 數值最佳化
    if (typeof value === 'number') {
      // 確保某些屬性為整數
      const integerProperties = ['flex', 'flexGrow', 'flexShrink', 'zIndex'];
      if (integerProperties.includes(key)) {
        return Math.round(value);
      }
    }
    
    // 字串最佳化
    if (typeof value === 'string') {
      return value.trim();
    }
    
    return value;
  }

  /**
   * 建立並快取 StyleSheet
   */
  createStyleSheet<T>(styles: T, cacheKey?: string): T {
    if (cacheKey && this.styleSheetCache.has(cacheKey)) {
      return this.styleSheetCache.get(cacheKey);
    }
    
    const styleSheet = StyleSheet.create(styles as any);
    
    if (cacheKey) {
      this.styleSheetCache.set(cacheKey, styleSheet);
    }
    
    return styleSheet;
  }

  /**
   * 合併多個樣式
   */
  mergeStyles(...styles: (RNStyle | RNStyle[] | undefined)[]): RNStyle {
    const flatStyles: RNStyle[] = [];
    
    styles.forEach(style => {
      if (Array.isArray(style)) {
        flatStyles.push(...style.filter(Boolean));
      } else if (style) {
        flatStyles.push(style);
      }
    });
    
    return Object.assign({}, ...flatStyles);
  }

  /**
   * 條件式樣式合併
   */
  conditionalStyle(condition: boolean, trueStyle: RNStyle, falseStyle?: RNStyle): RNStyle {
    return condition ? trueStyle : (falseStyle || {});
  }

  /**
   * 響應式樣式（基於裝置尺寸）
   */
  responsiveStyle(styles: {
    small?: RNStyle;
    medium?: RNStyle;
    large?: RNStyle;
    default?: RNStyle;
  }): RNStyle {
    const { Dimensions } = require('react-native');
    const { width } = Dimensions.get('window');
    
    if (width < 600 && styles.small) {
      return styles.small;
    } else if (width < 900 && styles.medium) {
      return styles.medium;
    } else if (width >= 900 && styles.large) {
      return styles.large;
    }
    
    return styles.default || {};
  }

  /**
   * 主題樣式適配
   */
  applyTheme(style: RNStyle, theme: Record<string, any>): RNStyle {
    const themedStyle: RNStyle = {};
    
    Object.entries(style).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('$')) {
        // 主題變數替換
        const themeKey = value.substring(1);
        themedStyle[key as keyof RNStyle] = theme[themeKey] || value;
      } else {
        themedStyle[key as keyof RNStyle] = value;
      }
    });
    
    return themedStyle;
  }

  /**
   * 平台特定樣式選擇
   */
  selectPlatformStyle(styles: {
    ios?: RNStyle;
    android?: RNStyle;
    default?: RNStyle;
  }): RNStyle {
    const { Platform } = require('react-native');
    
    if (Platform.OS === 'ios' && styles.ios) {
      return styles.ios;
    } else if (Platform.OS === 'android' && styles.android) {
      return styles.android;
    }
    
    return styles.default || {};
  }

  /**
   * 驗證樣式屬性
   */
  validateStyle(style: RNStyle): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!style || typeof style !== 'object') {
      return { isValid: false, errors: ['Style must be an object'] };
    }
    
    // 檢查常見的樣式錯誤
    Object.entries(style).forEach(([key, value]) => {
      // 檢查數值屬性
      const numericProperties = [
        'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
        'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
        'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'borderRadius', 'borderWidth', 'fontSize', 'lineHeight',
      ];
      
      if (numericProperties.includes(key)) {
        if (typeof value !== 'number' && typeof value !== 'string') {
          errors.push(`${key} must be a number or string`);
        }
        
        if (typeof value === 'number' && value < 0) {
          const allowNegative = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
          if (!allowNegative.includes(key)) {
            errors.push(`${key} cannot be negative`);
          }
        }
      }
      
      // 檢查顏色屬性
      const colorProperties = ['color', 'backgroundColor', 'borderColor', 'shadowColor'];
      if (colorProperties.includes(key)) {
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 樣式差異比較
   */
  diffStyles(oldStyle: RNStyle, newStyle: RNStyle): {
    added: RNStyle;
    removed: string[];
    changed: RNStyle;
  } {
    const added: RNStyle = {};
    const removed: string[] = [];
    const changed: RNStyle = {};
    
    const oldKeys = Object.keys(oldStyle || {});
    const newKeys = Object.keys(newStyle || {});
    
    // 找出新增的屬性
    newKeys.forEach(key => {
      if (!(key in (oldStyle || {}))) {
        added[key as keyof RNStyle] = newStyle[key as keyof RNStyle];
      } else if (oldStyle[key as keyof RNStyle] !== newStyle[key as keyof RNStyle]) {
        changed[key as keyof RNStyle] = newStyle[key as keyof RNStyle];
      }
    });
    
    // 找出移除的屬性
    oldKeys.forEach(key => {
      if (!(key in (newStyle || {}))) {
        removed.push(key);
      }
    });
    
    return { added, removed, changed };
  }

  /**
   * 效能最佳化：扁平化樣式陣列
   */
  flattenStyleArray(styles: (RNStyle | RNStyle[] | undefined)[]): RNStyle {
    return StyleSheet.flatten(styles);
  }

  /**
   * 建立樣式變體
   */
  createVariants<T extends Record<string, RNStyle>>(
    baseStyle: RNStyle,
    variants: T
  ): Record<keyof T, RNStyle> {
    const result: Record<keyof T, RNStyle> = {} as any;
    
    Object.entries(variants).forEach(([key, variantStyle]) => {
      result[key as keyof T] = {
        ...baseStyle,
        ...variantStyle };
    });
    
    return result;
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.styleSheetCache.clear();
  }

  /**
   * 取得快取統計
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.styleSheetCache.size,
      keys: Array.from(this.styleSheetCache.keys()) };
  }

  /**
   * 樣式繼承（類似 CSS 繼承）
   */
  inheritStyle(parentStyle: RNStyle, childStyle: RNStyle): RNStyle {
    // 定義可繼承的屬性
    const inheritableProperties = [
      'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'textAlign', 'textTransform', 'lineHeight', 'letterSpacing',
    ];
    
    const inherited: RNStyle = {};
    
    inheritableProperties.forEach(prop => {
      if (prop in parentStyle && !(prop in childStyle)) {
        inherited[prop as keyof RNStyle] = parentStyle[prop as keyof RNStyle];
      }
    });
    
    return {
      ...inherited,
      ...childStyle };
  }
}