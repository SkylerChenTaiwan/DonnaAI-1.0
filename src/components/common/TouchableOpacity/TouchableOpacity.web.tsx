/**
 * Web 平台 TouchableOpacity 包裝器
 * 將 React Native TouchableOpacity 轉換為原生 HTML button
 * 確保樣式不被全域 CSS 覆蓋
 */

import React from 'react';
import { ViewStyle } from 'react-native';

interface TouchableOpacityProps {
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  onPress,
  disabled = false,
  activeOpacity = 0.7,
  style,
  children,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  // 轉換 React Native 樣式為 CSS
  const convertStyleToCSS = (rnStyle: any): React.CSSProperties => {
    if (!rnStyle) return {};
    
    // 處理樣式陣列
    if (Array.isArray(rnStyle)) {
      return rnStyle.reduce((acc, s) => ({ ...acc, ...convertStyleToCSS(s) }), {});
    }

    // 轉換單個樣式物件
    const cssStyle: React.CSSProperties = {};
    
    Object.entries(rnStyle).forEach(([key, value]) => {
      if (key === 'paddingHorizontal') {
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
      } else if (key === 'borderRadius' && typeof value === 'number') {
        cssStyle.borderRadius = `${value}px`;
      } else if (key === 'borderWidth' && typeof value === 'number') {
        cssStyle.borderWidth = `${value}px`;
        cssStyle.borderStyle = 'solid';
      } else if (key === 'borderColor') {
        cssStyle.borderColor = value;
      } else if (key === 'backgroundColor') {
        cssStyle.backgroundColor = value;
      } else if (key === 'flex') {
        cssStyle.flex = value;
      } else if (key === 'flexDirection') {
        cssStyle.flexDirection = value as any;
      } else if (key === 'alignItems') {
        cssStyle.alignItems = value as any;
      } else if (key === 'justifyContent') {
        cssStyle.justifyContent = value as any;
      } else if (key === 'width' && typeof value === 'number') {
        cssStyle.width = `${value}px`;
      } else if (key === 'height' && typeof value === 'number') {
        cssStyle.height = `${value}px`;
      } else if (key === 'padding' && typeof value === 'number') {
        cssStyle.padding = `${value}px`;
      } else if (key === 'margin' && typeof value === 'number') {
        cssStyle.margin = `${value}px`;
      } else if (typeof value === 'number' && !key.includes('flex') && !key.includes('opacity') && !key.includes('zIndex')) {
        // 預設數字值轉為 px
        cssStyle[key as any] = `${value}px`;
      } else {
        // 其他直接傳遞
        cssStyle[key as any] = value;
      }
    });

    return cssStyle;
  };

  const buttonStyle: React.CSSProperties = {
    ...convertStyleToCSS(style),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : isPressed ? activeOpacity : 1,
    transition: 'opacity 0.2s ease',
    border: convertStyleToCSS(style).border || 'none',
    background: convertStyleToCSS(style).backgroundColor || 'none',
    padding: convertStyleToCSS(style).padding || 0,
    font: 'inherit',
    color: 'inherit',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    display: 'flex',
    outline: 'none',
  };

  return (
    <button
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      style={buttonStyle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      data-testid={testID}
    >
      {children}
    </button>
  );
};

export default TouchableOpacity;