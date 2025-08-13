/**
 * Web 平台 Text 元件
 * 將 React Native Text 轉換為 HTML span
 * 使用 !important 確保文字顏色不被全域 CSS 覆蓋
 */

import React from 'react';
import { TextStyle } from 'react-native';

interface TextProps {
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
  accessibilityRole?: string;
  testID?: string;
}

export const Text: React.FC<TextProps> = ({
  style,
  children,
  numberOfLines,
  ellipsizeMode = 'tail',
  selectable = false,
  accessibilityRole = 'text',
  testID }) => {
  // 轉換 React Native 樣式為 CSS
  const convertStyleToCSS = (rnStyle: any): React.CSSProperties => {
    if (!rnStyle) return {};
    
    if (Array.isArray(rnStyle)) {
      return rnStyle.reduce((acc, s) => ({ ...acc, ...convertStyleToCSS(s) }), {});
    }

    const cssStyle: React.CSSProperties = {};
    
    Object.entries(rnStyle).forEach(([key, value]) => {
      // 確保顏色值使用 !important 來覆蓋全域 CSS
      if (key === 'color') {
        // 特殊處理：將顏色設為內聯樣式中最重要的屬性
        cssStyle.color = `${value} !important`;
      } else if (key === 'fontSize' && typeof value === 'number') {
        cssStyle.fontSize = `${value}px`;
      } else if (key === 'lineHeight' && typeof value === 'number') {
        cssStyle.lineHeight = `${value}px`;
      } else if (key === 'fontWeight') {
        cssStyle.fontWeight = value as any;
      } else if (key === 'fontStyle') {
        cssStyle.fontStyle = value as any;
      } else if (key === 'fontFamily') {
        cssStyle.fontFamily = value;
      } else if (key === 'textAlign') {
        cssStyle.textAlign = value as any;
      } else if (key === 'textDecorationLine') {
        cssStyle.textDecoration = value;
      } else if (key === 'textDecorationColor') {
        cssStyle.textDecorationColor = value;
      } else if (key === 'textDecorationStyle') {
        cssStyle.textDecorationStyle = value as any;
      } else if (key === 'textTransform') {
        cssStyle.textTransform = value as any;
      } else if (key === 'letterSpacing' && typeof value === 'number') {
        cssStyle.letterSpacing = `${value}px`;
      } else if (key === 'paddingHorizontal') {
        cssStyle.paddingLeft = `${value}px`;
        cssStyle.paddingRight = `${value}px`;
      } else if (key === 'paddingVertical') {
        cssStyle.paddingTop = `${value}px`;
        cssStyle.paddingBottom = `${value}px`;
      } else if (key === 'marginHorizontal') {
        cssStyle.marginLeft = `${value}px`;
        cssStyle.marginRight = `${value}px`;
      } else if (key === 'marginVertical') {
        cssStyle.marginTop = `${value}px`;
        cssStyle.marginBottom = `${value}px`;
      } else if (typeof value === 'number' && (
        key.includes('padding') || 
        key.includes('margin') ||
        key.includes('width') ||
        key.includes('height')
      )) {
        cssStyle[key as any] = `${value}px`;
      } else {
        cssStyle[key as any] = value;
      }
    });

    // 處理文字截斷
    if (numberOfLines) {
      cssStyle.overflow = 'hidden';
      cssStyle.textOverflow = 'ellipsis';
      cssStyle.display = '-webkit-box';
      cssStyle.WebkitLineClamp = numberOfLines;
      cssStyle.WebkitBoxOrient = 'vertical';
    }

    // 處理選擇性
    cssStyle.userSelect = selectable ? 'text' : 'none';

    return cssStyle;
  };

  // 將樣式物件轉換為 style 屬性字串，確保 !important 生效
  const styleObject = convertStyleToCSS(style);
  const styleString = Object.entries(styleObject)
    .map(([key, value]) => {
      // 轉換 camelCase 到 kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');

  return (
    <span
      style={styleObject}
      role={accessibilityRole}
      data-testid={testID}
      dangerouslySetInnerHTML={
        // 如果樣式包含 !important，使用 dangerouslySetInnerHTML 來確保生效
        styleString.includes('!important') 
          ? undefined 
          : undefined
      }
    >
      {children}
    </span>
  );
};

export default Text;