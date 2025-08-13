/**
 * AdaptiveButton - 跨平台統一按鈕元件
 * 提供一致的按鈕體驗和完整的設計系統整合
 */

import React, { forwardRef, useMemo, useState } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
import AdaptiveView from './AdaptiveView';
import AdaptiveText from './AdaptiveText';

// 按鈕變體
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';

// 按鈕尺寸
export type ButtonSize = 'small' | 'medium' | 'large';

// 按鈕狀態
export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled' | 'loading';

// AdaptiveButton 屬性介面
export interface AdaptiveButtonProps {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  
  // 樣式
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
  textStyle?: TextStyle | CSSProperties;
  
  // 圖示
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  
  // 行為
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  
  // Web 特有
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  
  // 無障礙
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  
  // HTML 屬性
  className?: string;
  id?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
  
  // 其他屬性透傳
  [key: string]: any;
}

// 按鈕樣式生成器
const createButtonStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
  state: ButtonState,
  platformAdapter: PlatformAdapter
) => {
  // 基礎樣式
  const baseStyle = DesignSystem.getButtonStyle(variant, size);
  
  // 狀態樣式
  let stateStyle = {};
  
  switch (state) {
    case 'hover':
      if (variant === 'primary') {
        stateStyle = { backgroundColor: DesignSystem.colors.button.primary.hover };
      } else if (variant === 'secondary') {
        stateStyle = { backgroundColor: DesignSystem.colors.button.secondary.hover };
      } else if (variant === 'outline') {
        stateStyle = { 
          backgroundColor: DesignSystem.colors.button.outline.backgroundHover,
          borderColor: DesignSystem.colors.button.outline.borderHover };
      } else if (variant === 'ghost') {
        stateStyle = { backgroundColor: DesignSystem.colors.button.ghost.backgroundHover };
      }
      break;
      
    case 'pressed':
      if (variant === 'primary') {
        stateStyle = { backgroundColor: DesignSystem.colors.button.primary.pressed };
      } else if (variant === 'secondary') {
        stateStyle = { backgroundColor: DesignSystem.colors.button.secondary.pressed };
      }
      break;
      
    case 'disabled':
      stateStyle = {
        opacity: 0.5,
        cursor: platformAdapter.isWeb ? 'not-allowed' : undefined };
      break;
      
    case 'loading':
      stateStyle = {
        opacity: 0.7,
        cursor: platformAdapter.isWeb ? 'wait' : undefined };
      break;
  }
  
  return { ...baseStyle, ...stateStyle };
};

// Web 實現
const WebButton = forwardRef<HTMLButtonElement, AdaptiveButtonProps>(
  ({
    children,
    title,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    webStyle,
    textStyle,
    leftIcon,
    rightIcon,
    iconOnly = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    type = 'button',
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    tabIndex,
    ...props
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 確定當前狀態
    const currentState: ButtonState = useMemo(() => {
      if (disabled) return 'disabled';
      if (loading) return 'loading';
      if (isPressed) return 'pressed';
      if (isHovered) return 'hover';
      return 'default';
    }, [disabled, loading, isPressed, isHovered]);
    
    // 生成按鈕樣式
    const buttonStyle = useMemo(() => {
      const baseStyle = createButtonStyles(variant, size, currentState, platformAdapter);
      let finalStyle = styleAdapter.adaptStyle(baseStyle, webStyle);
      
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any, webStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      // 添加 Web 特有的樣式
      finalStyle = {
        ...finalStyle,
        border: finalStyle.borderWidth ? 
          `${finalStyle.borderWidth}px ${finalStyle.borderStyle || 'solid'} ${finalStyle.borderColor}` : 
          'none',
        outline: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        userSelect: 'none' };
      
      return finalStyle;
    }, [variant, size, currentState, platformAdapter, styleAdapter, style, webStyle, disabled, loading]);
    
    // 文字樣式
    const textStyleFinal = useMemo(() => {
      let style: CSSProperties = {};
      
      if (textStyle) {
        style = styleAdapter.adaptStyle(textStyle as any);
      }
      
      return style;
    }, [textStyle, styleAdapter]);
    
    // 事件處理
    const handleMouseEnter = () => {
      if (!disabled && !loading) {
        setIsHovered(true);
        onMouseEnter?.();
      }
    };
    
    const handleMouseLeave = () => {
      setIsHovered(false);
      onMouseLeave?.();
    };
    
    const handleMouseDown = () => {
      if (!disabled && !loading) {
        setIsPressed(true);
      }
    };
    
    const handleMouseUp = () => {
      setIsPressed(false);
    };
    
    const handleClick = () => {
      if (!disabled && !loading) {
        onClick?.();
      }
    };
    
    // 渲染內容
    const renderContent = () => {
      if (iconOnly && leftIcon) {
        return leftIcon;
      }
      
      return (
        <>
          {leftIcon && <span style={{ marginRight: 8 }}>{leftIcon}</span>}
          {(title || children) && (
            <span style={textStyleFinal}>
              {title || children}
            </span>
          )}
          {rightIcon && <span style={{ marginLeft: 8 }}>{rightIcon}</span>}
          {loading && (
            <span style={{ marginLeft: leftIcon || title || children ? 8 : 0 }}>
              ⟳
            </span>
          )}
        </>
      );
    };
    
    return (
      <button
        ref={ref}
        type={type}
        className={className}
        style={buttonStyle}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={onFocus}
        onBlur={onBlur}
        tabIndex={tabIndex}
        data-testid={testID}
        aria-label={accessibilityLabel}
        aria-disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

// Native 實現
const NativeButton = forwardRef<any, AdaptiveButtonProps>(
  ({
    children,
    title,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    nativeStyle,
    textStyle,
    leftIcon,
    rightIcon,
    iconOnly = false,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    ...props
  }, ref) => {
    const { TouchableOpacity, ActivityIndicator } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    // 生成按鈕樣式
    const buttonStyle = useMemo(() => {
      const currentState: ButtonState = disabled ? 'disabled' : loading ? 'loading' : 'default';
      const baseStyle = createButtonStyles(variant, size, currentState, platformAdapter);
      
      let finalStyle = { ...baseStyle };
      
      if (style) {
        finalStyle = { ...finalStyle, ...style };
      }
      
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [variant, size, disabled, loading, platformAdapter, styleAdapter, style, nativeStyle]);
    
    // 文字樣式
    const textStyleFinal = useMemo(() => {
      const baseTextStyle = DesignSystem.typography[
        size === 'small' ? 'buttonSmall' : 
        size === 'large' ? 'buttonLarge' : 'button'
      ];
      
      let finalStyle = { ...baseTextStyle };
      
      // 根據變體設定文字顏色
      if (variant === 'primary') {
        finalStyle.color = DesignSystem.colors.text.inverse;
      } else {
        finalStyle.color = DesignSystem.colors.primary;
      }
      
      if (textStyle) {
        finalStyle = { ...finalStyle, ...textStyle };
      }
      
      return finalStyle;
    }, [size, variant, textStyle]);
    
    // 事件處理
    const handlePress = () => {
      if (!disabled && !loading) {
        onPress?.();
      }
    };
    
    const handlePressIn = () => {
      if (!disabled && !loading) {
        onPressIn?.();
      }
    };
    
    const handlePressOut = () => {
      if (!disabled && !loading) {
        onPressOut?.();
      }
    };
    
    // 渲染內容
    const renderContent = () => {
      if (iconOnly && leftIcon) {
        return leftIcon;
      }
      
      return (
        <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon}
          {(title || children) && (
            <AdaptiveText style={[textStyleFinal, leftIcon && { marginLeft: 8 }, rightIcon && { marginRight: 8 }]}>
              {title || children}
            </AdaptiveText>
          )}
          {rightIcon}
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={textStyleFinal.color}
              style={{ marginLeft: 8 }}
            />
          )}
        </AdaptiveView>
      );
    };
    
    return (
      <TouchableOpacity
        ref={ref}
        style={buttonStyle}
        disabled={disabled || loading}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        testID={testID}
        accessible={accessible !== false}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityState={{
          disabled: disabled || loading }}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
);

// 主要 AdaptiveButton 元件
export const AdaptiveButton = forwardRef<any, AdaptiveButtonProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebButton {...props} ref={ref} />;
  } else {
    return <NativeButton {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveButton.displayName = 'AdaptiveButton';
WebButton.displayName = 'AdaptiveButton.Web';
NativeButton.displayName = 'AdaptiveButton.Native';

// 預設匯出
export default AdaptiveButton;

// 預設變體元件
export const PrimaryButton = forwardRef<any, Omit<AdaptiveButtonProps, 'variant'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} variant="primary" />
));

export const SecondaryButton = forwardRef<any, Omit<AdaptiveButtonProps, 'variant'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} variant="secondary" />
));

export const OutlineButton = forwardRef<any, Omit<AdaptiveButtonProps, 'variant'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} variant="outline" />
));

export const GhostButton = forwardRef<any, Omit<AdaptiveButtonProps, 'variant'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} variant="ghost" />
));

export const TextButton = forwardRef<any, Omit<AdaptiveButtonProps, 'variant'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} variant="text" />
));

// 尺寸變體
export const SmallButton = forwardRef<any, Omit<AdaptiveButtonProps, 'size'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} size="small" />
));

export const LargeButton = forwardRef<any, Omit<AdaptiveButtonProps, 'size'>>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} size="large" />
));

// 圖示按鈕
export const IconButton = forwardRef<any, AdaptiveButtonProps>((props, ref) => (
  <AdaptiveButton {...props} ref={ref} iconOnly={true} />
));

// 設定顯示名稱
PrimaryButton.displayName = 'PrimaryButton';
SecondaryButton.displayName = 'SecondaryButton';
OutlineButton.displayName = 'OutlineButton';
GhostButton.displayName = 'GhostButton';
TextButton.displayName = 'TextButton';
SmallButton.displayName = 'SmallButton';
LargeButton.displayName = 'LargeButton';
IconButton.displayName = 'IconButton';