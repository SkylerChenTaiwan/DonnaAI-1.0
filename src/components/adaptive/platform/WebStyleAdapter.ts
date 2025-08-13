/**
 * Web 樣式適配器
 * 處理 React Native 樣式到 Web CSS 的轉換
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { StyleAdapter } from './PlatformAdapter';

type RNStyle = ViewStyle | TextStyle | ImageStyle;

export class WebStyleAdapter implements StyleAdapter {
  /**
   * 適配樣式 - 主要入口點
   */
  adaptStyle(style: RNStyle, webSpecificStyle?: CSSProperties): CSSProperties {
    const convertedStyle = this.convertToCSS(style);
    
    // 合併 Web 特定樣式
    if (webSpecificStyle) {
      return { ...convertedStyle, ...webSpecificStyle };
    }
    
    return convertedStyle;
  }

  /**
   * 轉換 React Native 樣式到 CSS
   */
  convertToCSS(style: RNStyle): CSSProperties {
    if (!style) return {};
    
    const cssStyle: CSSProperties = {};
    
    Object.entries(style).forEach(([key, value]) => {
      const cssProperty = this.convertProperty(key, value);
      if (cssProperty) {
        Object.assign(cssStyle, cssProperty);
      }
    });
    
    return cssStyle;
  }

  /**
   * 轉換單個屬性
   */
  private convertProperty(key: string, value: any): CSSProperties | null {
    if (value === undefined || value === null) return null;

    // 直接對應的屬性
    const directMappings: Record<string, string> = {
      backgroundColor: 'backgroundColor',
      color: 'color',
      fontSize: 'fontSize',
      fontWeight: 'fontWeight',
      fontFamily: 'fontFamily',
      lineHeight: 'lineHeight',
      textAlign: 'textAlign',
      opacity: 'opacity',
      width: 'width',
      height: 'height',
      minWidth: 'minWidth',
      minHeight: 'minHeight',
      maxWidth: 'maxWidth',
      maxHeight: 'maxHeight',
      borderRadius: 'borderRadius',
      borderWidth: 'borderWidth',
      borderColor: 'borderColor',
      borderStyle: 'borderStyle',
      zIndex: 'zIndex' };

    // 直接映射
    if (directMappings[key]) {
      return { [directMappings[key]]: value };
    }

    // 特殊轉換
    switch (key) {
      // Flexbox 佈局
      case 'flex':
        return { flex: value };
      case 'flexDirection':
        return { flexDirection: value };
      case 'justifyContent':
        return { justifyContent: value };
      case 'alignItems':
        return { alignItems: value };
      case 'alignSelf':
        return { alignSelf: value };
      case 'flexWrap':
        return { flexWrap: value };
      case 'flexGrow':
        return { flexGrow: value };
      case 'flexShrink':
        return { flexShrink: value };
      case 'flexBasis':
        return { flexBasis: value };

      // 邊距和填充
      case 'margin':
        return { margin: this.convertSpacing(value) };
      case 'marginTop':
        return { marginTop: this.convertSpacing(value) };
      case 'marginRight':
        return { marginRight: this.convertSpacing(value) };
      case 'marginBottom':
        return { marginBottom: this.convertSpacing(value) };
      case 'marginLeft':
        return { marginLeft: this.convertSpacing(value) };
      case 'marginHorizontal':
        return {
          marginLeft: this.convertSpacing(value),
          marginRight: this.convertSpacing(value) };
      case 'marginVertical':
        return {
          marginTop: this.convertSpacing(value),
          marginBottom: this.convertSpacing(value) };
      case 'padding':
        return { padding: this.convertSpacing(value) };
      case 'paddingTop':
        return { paddingTop: this.convertSpacing(value) };
      case 'paddingRight':
        return { paddingRight: this.convertSpacing(value) };
      case 'paddingBottom':
        return { paddingBottom: this.convertSpacing(value) };
      case 'paddingLeft':
        return { paddingLeft: this.convertSpacing(value) };
      case 'paddingHorizontal':
        return {
          paddingLeft: this.convertSpacing(value),
          paddingRight: this.convertSpacing(value) };
      case 'paddingVertical':
        return {
          paddingTop: this.convertSpacing(value),
          paddingBottom: this.convertSpacing(value) };

      // 定位
      case 'position':
        return { position: value };
      case 'top':
        return { top: this.convertSpacing(value) };
      case 'right':
        return { right: this.convertSpacing(value) };
      case 'bottom':
        return { bottom: this.convertSpacing(value) };
      case 'left':
        return { left: this.convertSpacing(value) };

      // CRITICAL: 陰影轉換 - React Native 到 CSS
      case 'shadowColor':
        // 需要與其他陰影屬性組合
        return null; // 在 boxShadow 中處理
      case 'shadowOffset':
        // Web 不支援 shadowOffset，完全忽略
        return null; // 在 boxShadow 中處理
      case 'shadowOpacity':
        return null; // 在 boxShadow 中處理
      case 'shadowRadius':
        return null; // 在 boxShadow 中處理
      case 'elevation': // Android 特有
        return { boxShadow: this.convertElevation(value) };

      // 文字相關
      case 'textDecorationLine':
        return { textDecoration: value };
      case 'textTransform':
        return { textTransform: value };
      case 'letterSpacing':
        return { letterSpacing: this.convertSpacing(value) };

      // 邊框
      case 'borderTopWidth':
        return { borderTopWidth: this.convertSpacing(value) };
      case 'borderRightWidth':
        return { borderRightWidth: this.convertSpacing(value) };
      case 'borderBottomWidth':
        return { borderBottomWidth: this.convertSpacing(value) };
      case 'borderLeftWidth':
        return { borderLeftWidth: this.convertSpacing(value) };
      
      case 'borderTopColor':
        return { borderTopColor: value };
      case 'borderRightColor':
        return { borderRightColor: value };
      case 'borderBottomColor':
        return { borderBottomColor: value };
      case 'borderLeftColor':
        return { borderLeftColor: value };

      case 'borderTopLeftRadius':
        return { borderTopLeftRadius: this.convertSpacing(value) };
      case 'borderTopRightRadius':
        return { borderTopRightRadius: this.convertSpacing(value) };
      case 'borderBottomLeftRadius':
        return { borderBottomLeftRadius: this.convertSpacing(value) };
      case 'borderBottomRightRadius':
        return { borderBottomRightRadius: this.convertSpacing(value) };

      // 溢出處理
      case 'overflow':
        return { overflow: value };
      case 'overflowX':
        return { overflowX: value };
      case 'overflowY':
        return { overflowY: value };

      // 顯示和可見性
      case 'display':
        return { display: value };

      default:
        // 未知屬性，記錄但不轉換
        if (__DEV__) {
          console.warn(`WebStyleAdapter: Unknown style property '${key}'`);
        }
        return null;
    }
  }

  /**
   * 轉換間距值（數字轉為 px）
   */
  private convertSpacing(value: string | number): string {
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return value;
  }

  /**
   * 轉換 Android elevation 為 CSS box-shadow
   */
  private convertElevation(elevation: number): string {
    if (elevation === 0) return 'none';
    
    // 基於 Material Design 的 elevation 轉換
    const elevationMap: Record<number, string> = {
      1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)' };
    
    return elevationMap[elevation] || elevationMap[Math.min(5, Math.max(1, Math.round(elevation)))];
  }

  /**
   * 建立 CSS-in-JS 物件，包含 React Native 陰影的完整轉換
   */
  convertShadowToCSS(style: RNStyle): CSSProperties {
    const shadowStyle: any = {};
    
    if (!style) return shadowStyle;
    
    // 先過濾掉不相容的屬性
    const webSafeStyle = { ...style };
    delete webSafeStyle.shadowOffset;
    delete webSafeStyle.shadowColor;
    delete webSafeStyle.shadowOpacity;
    delete webSafeStyle.shadowRadius;
    delete webSafeStyle.elevation;
    
    // 從原始 style 提取陰影屬性（但不要直接使用）
    const {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation } = style as any;

    // 處理 iOS 樣式陰影 - 但只在確實有陰影時才轉換
    if (shadowOpacity && shadowOpacity > 0) {
      const color = shadowColor || '#000';
      // 安全地處理 shadowOffset - 不直接訪問物件屬性
      const offsetX = shadowOffset?.width || 0;
      const offsetY = shadowOffset?.height || 0;
      const radius = shadowRadius || 0;
      
      const shadowColorWithOpacity = this.addOpacityToColor(color, shadowOpacity);
      shadowStyle.boxShadow = `${offsetX}px ${offsetY}px ${radius}px ${shadowColorWithOpacity}`;
    }
    
    // 處理 Android elevation（優先級較低）
    if (elevation && !shadowStyle.boxShadow) {
      shadowStyle.boxShadow = this.convertElevation(elevation);
    }
    
    return shadowStyle;
  }

  /**
   * 為顏色添加透明度
   */
  private addOpacityToColor(color: string, opacity: number): string {
    // 簡化實現，實際可能需要更複雜的顏色解析
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 如果已經是 rgba 格式或其他格式，返回原值
    return color;
  }

  /**
   * 轉換帶有重要性的樣式（用於覆蓋全域 CSS）
   */
  convertWithImportant(style: RNStyle): CSSProperties {
    const cssStyle = this.convertToCSS(style);
    const importantStyle: CSSProperties = {};
    
    // 為所有屬性添加 !important
    Object.entries(cssStyle).forEach(([key, value]) => {
      if (typeof value === 'string' && !value.includes('!important')) {
        importantStyle[key as keyof CSSProperties] = `${value} !important` as any;
      } else {
        importantStyle[key as keyof CSSProperties] = value;
      }
    });
    
    return importantStyle;
  }

  /**
   * 生成內聯樣式字串（用於 DOM 操作）
   */
  generateInlineStyle(style: RNStyle): string {
    const cssStyle = this.convertToCSS(style);
    
    return Object.entries(cssStyle)
      .map(([key, value]) => {
        const cssKey = this.camelToKebab(key);
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  /**
   * 駝峰式轉連字符
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}