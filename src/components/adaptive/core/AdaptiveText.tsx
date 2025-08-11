/**
 * AdaptiveText - 跨平台統一文字元件
 * 提供一致的文字渲染和字體設計系統整合
 */

import React, { forwardRef, useMemo } from 'react';
import type { TextStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';

// 字體變體類型
export type TextVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'body' | 'bodySmall'
  | 'caption'
  | 'button' | 'buttonSmall' | 'buttonLarge';

// 文字顏色變體
export type TextColor = 
  | 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse'
  | 'success' | 'warning' | 'error' | 'info';

// 文字對齊
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// AdaptiveText 屬性介面
export interface AdaptiveTextProps {
  children?: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor | string;
  align?: TextAlign;
  style?: TextStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: TextStyle;
  
  // 字體屬性
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | string;
  size?: number | string;
  lineHeight?: number | string;
  
  // 行為屬性
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
  
  // 無障礙
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  
  // Web 特有
  className?: string;
  onClick?: () => void;
  
  // Native 特有
  onPress?: () => void;
  onLongPress?: () => void;
  
  // HTML 屬性
  role?: string;
  'aria-label'?: string;
  
  // 其他屬性透傳
  [key: string]: any;
}

// Web 實現
const WebText = forwardRef<HTMLElement, AdaptiveTextProps>(
  ({ 
    children, 
    variant = 'body',
    color = 'primary',
    align = 'left',
    style, 
    webStyle, 
    weight,
    size,
    lineHeight,
    numberOfLines,
    ellipsizeMode = 'tail',
    selectable = true,
    className = '',
    onClick,
    testID,
    accessible,
    accessibilityLabel,
    role,
    ...props 
  }, ref) => {
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 取得變體樣式
    const variantStyle = useMemo(() => {
      return DesignSystem.typography[variant] || DesignSystem.typography.body;
    }, [variant]);
    
    // 取得顏色值
    const colorValue = useMemo(() => {
      // 預定義顏色
      const colorMap = {
        primary: DesignSystem.colors.text.primary,
        secondary: DesignSystem.colors.text.secondary,
        tertiary: DesignSystem.colors.text.tertiary,
        disabled: DesignSystem.colors.text.disabled,
        inverse: DesignSystem.colors.text.inverse,
        success: DesignSystem.colors.status.success,
        warning: DesignSystem.colors.status.warning,
        error: DesignSystem.colors.status.error,
        info: DesignSystem.colors.status.info,
      };
      
      return colorMap[color as keyof typeof colorMap] || color;
    }, [color]);
    
    // 合併樣式
    const adaptedStyle = useMemo(() => {
      let finalStyle: CSSProperties = {
        ...variantStyle,
        color: colorValue,
        textAlign: align,
      };
      
      // 自定義字體屬性
      if (weight) finalStyle.fontWeight = weight;
      if (size) finalStyle.fontSize = typeof size === 'number' ? `${size}px` : size;
      if (lineHeight) finalStyle.lineHeight = lineHeight;
      
      // 行數限制
      if (numberOfLines && numberOfLines > 0) {
        finalStyle.display = '-webkit-box';
        finalStyle.WebkitBoxOrient = 'vertical';
        finalStyle.WebkitLineClamp = numberOfLines;
        finalStyle.overflow = 'hidden';
        
        if (ellipsizeMode === 'head') {
          finalStyle.textOverflow = 'ellipsis';
          finalStyle.direction = 'rtl';
          finalStyle.textAlign = 'left';
        } else if (ellipsizeMode === 'middle') {
          // CSS 原生不支援中間省略，使用 JavaScript 或保持預設
          finalStyle.textOverflow = 'ellipsis';
        } else if (ellipsizeMode === 'tail') {
          finalStyle.textOverflow = 'ellipsis';
        }
      }
      
      // 選擇性
      if (!selectable) {
        finalStyle.userSelect = 'none';
        finalStyle.WebkitUserSelect = 'none';
      }
      
      // 基礎樣式適配
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any, webStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      // Web 特定樣式
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      return finalStyle;
    }, [variantStyle, colorValue, align, weight, size, lineHeight, numberOfLines, ellipsizeMode, selectable, style, webStyle, styleAdapter]);
    
    // 選擇 HTML 標籤
    const Component = useMemo(() => {
      const headingTags = {
        h1: 'h1',
        h2: 'h2', 
        h3: 'h3',
        h4: 'h4',
      };
      
      return headingTags[variant as keyof typeof headingTags] || 'span';
    }, [variant]);
    
    // 無障礙屬性
    const accessibilityProps = useMemo(() => {
      const props: any = {};
      
      if (accessible !== false) {
        if (accessibilityLabel) props['aria-label'] = accessibilityLabel;
        if (role) props.role = role;
      }
      
      return props;
    }, [accessible, accessibilityLabel, role]);
    
    return React.createElement(
      Component,
      {
        ref,
        className,
        style: adaptedStyle,
        onClick,
        'data-testid': testID,
        ...accessibilityProps,
        ...props,
      },
      children
    );
  }
);

// Native 實現
const NativeText = forwardRef<any, AdaptiveTextProps>(
  ({ 
    children, 
    variant = 'body',
    color = 'primary',
    align = 'left',
    style, 
    nativeStyle, 
    weight,
    size,
    lineHeight,
    numberOfLines,
    ellipsizeMode = 'tail',
    selectable,
    onPress,
    onLongPress,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    ...props 
  }, ref) => {
    const { Text } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 取得變體樣式
    const variantStyle = useMemo(() => {
      return DesignSystem.typography[variant] || DesignSystem.typography.body;
    }, [variant]);
    
    // 取得顏色值
    const colorValue = useMemo(() => {
      const colorMap = {
        primary: DesignSystem.colors.text.primary,
        secondary: DesignSystem.colors.text.secondary,
        tertiary: DesignSystem.colors.text.tertiary,
        disabled: DesignSystem.colors.text.disabled,
        inverse: DesignSystem.colors.text.inverse,
        success: DesignSystem.colors.status.success,
        warning: DesignSystem.colors.status.warning,
        error: DesignSystem.colors.status.error,
        info: DesignSystem.colors.status.info,
      };
      
      return colorMap[color as keyof typeof colorMap] || color;
    }, [color]);
    
    // 合併樣式
    const adaptedStyle = useMemo(() => {
      let finalStyle: TextStyle = {
        ...variantStyle,
        color: colorValue,
        textAlign: align,
      };
      
      // 自定義字體屬性
      if (weight) finalStyle.fontWeight = weight as any;
      if (size) finalStyle.fontSize = typeof size === 'number' ? size : parseInt(size as string);
      if (lineHeight) finalStyle.lineHeight = typeof lineHeight === 'number' ? lineHeight : parseInt(lineHeight as string);
      
      // 基礎樣式適配
      if (style) {
        finalStyle = { ...finalStyle, ...style };
      }
      
      // Native 特定樣式
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [variantStyle, colorValue, align, weight, size, lineHeight, style, nativeStyle, styleAdapter]);
    
    // 無障礙屬性
    const accessibilityProps = {
      accessible: accessible !== false,
      accessibilityLabel,
      accessibilityRole: accessibilityRole as any,
    };
    
    return (
      <Text
        ref={ref}
        style={adaptedStyle}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        selectable={selectable}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

// 主要 AdaptiveText 元件
export const AdaptiveText = forwardRef<any, AdaptiveTextProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebText {...props} ref={ref} />;
  } else {
    return <NativeText {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveText.displayName = 'AdaptiveText';
WebText.displayName = 'AdaptiveText.Web';
NativeText.displayName = 'AdaptiveText.Native';

// 預設匯出
export default AdaptiveText;

// 預設變體元件
export const Heading1 = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="h1" />
));

export const Heading2 = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="h2" />
));

export const Heading3 = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="h3" />
));

export const Heading4 = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="h4" />
));

export const BodyText = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="body" />
));

export const SmallText = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="bodySmall" />
));

export const Caption = forwardRef<any, Omit<AdaptiveTextProps, 'variant'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} variant="caption" />
));

// 帶有語義色彩的文字元件
export const SuccessText = forwardRef<any, Omit<AdaptiveTextProps, 'color'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} color="success" />
));

export const WarningText = forwardRef<any, Omit<AdaptiveTextProps, 'color'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} color="warning" />
));

export const ErrorText = forwardRef<any, Omit<AdaptiveTextProps, 'color'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} color="error" />
));

export const InfoText = forwardRef<any, Omit<AdaptiveTextProps, 'color'>>((props, ref) => (
  <AdaptiveText {...props} ref={ref} color="info" />
));

// 設定顯示名稱
Heading1.displayName = 'Heading1';
Heading2.displayName = 'Heading2';
Heading3.displayName = 'Heading3';
Heading4.displayName = 'Heading4';
BodyText.displayName = 'BodyText';
SmallText.displayName = 'SmallText';
Caption.displayName = 'Caption';
SuccessText.displayName = 'SuccessText';
WarningText.displayName = 'WarningText';
ErrorText.displayName = 'ErrorText';
InfoText.displayName = 'InfoText';