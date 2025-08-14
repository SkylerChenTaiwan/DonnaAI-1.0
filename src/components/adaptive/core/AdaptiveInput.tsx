/**
 * AdaptiveInput - 跨平台統一輸入元件
 * 提供一致的表單輸入體驗和完整的驗證支援
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
import AdaptiveView from './AdaptiveView';
import AdaptiveText from './AdaptiveText';

// 輸入類型
export type InputType = 
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  | 'search' | 'multiline';

// 輸入狀態
export type InputState = 'default' | 'focused' | 'error' | 'disabled';

// AdaptiveInput 屬性介面
export interface AdaptiveInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: InputType;
  
  // 多行輸入
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  
  // 樣式
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
  inputStyle?: TextStyle | CSSProperties;
  containerStyle?: ViewStyle | CSSProperties;
  
  // 狀態
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  
  // 驗證
  error?: string | boolean;
  required?: boolean;
  
  // 標籤和幫助文字
  label?: string;
  helperText?: string;
  
  // 圖示
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // 行為
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  
  // Web 特有
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  name?: string;
  id?: string;
  form?: string;
  autoComplete?: string;
  spellCheck?: boolean;
  
  // Native 特有
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  
  // 無障礙
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // HTML 屬性
  className?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  
  // 其他屬性透傳
  [key: string]: any;
}

// 輸入樣式生成器
const createInputStyles = (state: InputState, hasError: boolean) => {
  const baseStyle = {
    backgroundColor: DesignSystem.colors.background.input,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: DesignSystem.typography.body.fontSize,
    lineHeight: DesignSystem.typography.body.lineHeight,
    color: DesignSystem.colors.text.primary };
  
  let stateStyle = {};
  
  if (hasError) {
    stateStyle = {
      borderColor: DesignSystem.colors.error };
  } else {
    switch (state) {
      case 'focused':
        stateStyle = {
          borderColor: DesignSystem.colors.primary,
          borderWidth: 2 };
        break;
      case 'disabled':
        stateStyle = {
          backgroundColor: DesignSystem.colors.gray100,
          borderColor: DesignSystem.colors.border.light,
          color: DesignSystem.colors.text.disabled,
          opacity: 0.6 };
        break;
    }
  }
  
  return { ...baseStyle, ...stateStyle };
};

// Web 實現
const WebInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, AdaptiveInputProps>(
  ({
    value,
    defaultValue,
    placeholder,
    type = 'text',
    multiline = false,
    numberOfLines,
    maxLength,
    style,
    webStyle,
    inputStyle,
    containerStyle,
    disabled = false,
    readOnly = false,
    autoFocus = false,
    error,
    required = false,
    label,
    helperText,
    leftIcon,
    rightIcon,
    onChangeText,
    onChange,
    onFocus,
    onBlur,
    onSubmitEditing,
    onKeyDown,
    onKeyPress,
    name,
    id,
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    autoComplete,
    spellCheck,
    tabIndex,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    const hasError = Boolean(error);
    const currentState: InputState = useMemo(() => {
      if (disabled) return 'disabled';
      if (isFocused) return 'focused';
      if (hasError) return 'error';
      return 'default';
    }, [disabled, isFocused, hasError]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: DesignSystem.spacing.xs };
      
      if (containerStyle) {
        const convertedStyle = styleAdapter.adaptStyle(containerStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [containerStyle, styleAdapter]);
    
    // 輸入框樣式
    const inputStyleFinal = useMemo(() => {
      const baseInputStyle = createInputStyles(currentState, hasError);
      
      let finalStyle = styleAdapter.adaptStyle(baseInputStyle, webStyle);
      
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any, webStyle);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      if (inputStyle) {
        const convertedInputStyle = styleAdapter.adaptStyle(inputStyle as any);
        finalStyle = { ...finalStyle, ...convertedInputStyle };
      }
      
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      // Web 特有樣式
      finalStyle = {
        ...finalStyle,
        border: finalStyle.borderWidth ? 
          `${finalStyle.borderWidth}px solid ${finalStyle.borderColor}` : 
          'none',
        outline: 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        fontFamily: 'inherit',
        resize: multiline ? 'vertical' : 'none',
        minHeight: multiline && numberOfLines ? `${numberOfLines * 1.5}em` : undefined };
      
      // 聚焦陰影
      if (currentState === 'focused') {
        finalStyle.boxShadow = `0 0 0 3px ${DesignSystem.colors.primary}20`;
      }
      
      return finalStyle;
    }, [currentState, hasError, styleAdapter, style, webStyle, inputStyle, multiline, numberOfLines]);
    
    // 事件處理
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      onChangeText?.(newValue);
      onChange?.(event);
    }, [onChangeText, onChange]);
    
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocus?.();
    }, [onFocus]);
    
    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);
    
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !multiline) {
        onSubmitEditing?.();
      }
      onKeyDown?.(event);
    }, [onSubmitEditing, onKeyDown, multiline]);
    
    // 輸入框包裝器樣式（用於圖示）
    const inputWrapperStyle: CSSProperties = useMemo(() => ({
      position: 'relative',
      display: 'flex',
      alignItems: 'center' }), []);
    
    // 圖示樣式
    const iconStyle: CSSProperties = useMemo(() => ({
      position: 'absolute',
      zIndex: 1,
      pointerEvents: 'none',
      color: DesignSystem.colors.text.secondary }), []);
    
    const leftIconStyle: CSSProperties = { ...iconStyle, left: DesignSystem.spacing.sm };
    const rightIconStyle: CSSProperties = { ...iconStyle, right: DesignSystem.spacing.sm };
    
    // 調整輸入框樣式以適應圖示
    const adjustedInputStyle = useMemo(() => {
      const style = { ...inputStyleFinal };
      if (leftIcon) style.paddingLeft = DesignSystem.spacing.xl;
      if (rightIcon) style.paddingRight = DesignSystem.spacing.xl;
      return style;
    }, [inputStyleFinal, leftIcon, rightIcon]);
    
    // 渲染輸入框
    const renderInput = () => {
      const commonProps = {
        ref: ref as any,
        value,
        defaultValue,
        placeholder,
        disabled,
        readOnly,
        autoFocus,
        maxLength,
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        onKeyPress,
        name,
        id,
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'aria-invalid': hasError,
        'aria-required': required,
        autoComplete,
        spellCheck,
        tabIndex,
        style: adjustedInputStyle,
        ...props };
      
      if (multiline) {
        return React.createElement('textarea', {
          ...commonProps,
          rows: numberOfLines });
      } else {
        const htmlType = type === 'multiline' ? 'text' : type;
        return React.createElement('input', {
          ...commonProps,
          type: htmlType });
      }
    };
    
    return (
      <div className={className} style={containerStyleFinal}>
        {label && (
          <AdaptiveText
            variant="bodySmall"
            color={hasError ? 'error' : 'secondary'}
            style={{ fontWeight: '500' }}
          >
            {label}
            {required && <span style={{ color: DesignSystem.colors.error }}> *</span>}
          </AdaptiveText>
        )}
        
        <div style={inputWrapperStyle}>
          {leftIcon && <div style={leftIconStyle}>{leftIcon}</div>}
          {renderInput()}
          {rightIcon && <div style={rightIconStyle}>{rightIcon}</div>}
        </div>
        
        {(helperText || (typeof error === 'string' && error)) && (
          <AdaptiveText
            variant="caption"
            color={hasError ? 'error' : 'tertiary'}
          >
            {hasError && typeof error === 'string' ? error : helperText}
          </AdaptiveText>
        )}
      </div>
    );
  }
);

// Native 實現
const NativeInput = forwardRef<any, AdaptiveInputProps>(
  ({
    value,
    defaultValue,
    placeholder,
    type = 'text',
    multiline = false,
    numberOfLines,
    maxLength,
    style,
    nativeStyle,
    inputStyle,
    containerStyle,
    disabled = false,
    readOnly = false,
    autoFocus = false,
    error,
    required = false,
    label,
    helperText,
    leftIcon,
    rightIcon,
    onChangeText,
    onFocus,
    onBlur,
    onSubmitEditing,
    secureTextEntry,
    autoCapitalize,
    autoCorrect,
    keyboardType,
    returnKeyType,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityHint,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const { TextInput } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    const hasError = Boolean(error);
    const currentState: InputState = useMemo(() => {
      if (disabled) return 'disabled';
      if (isFocused) return 'focused';
      if (hasError) return 'error';
      return 'default';
    }, [disabled, isFocused, hasError]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle = {};
      
      if (containerStyle) {
        finalStyle = styleAdapter.adaptStyle(containerStyle);
      }
      
      return finalStyle;
    }, [containerStyle, styleAdapter]);
    
    // 輸入框樣式
    const inputStyleFinal = useMemo(() => {
      const baseInputStyle = createInputStyles(currentState, hasError);
      
      let finalStyle = { ...baseInputStyle };
      
      if (style) {
        finalStyle = { ...finalStyle, ...style };
      }
      
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      if (inputStyle) {
        finalStyle = { ...finalStyle, ...inputStyle };
      }
      
      // 圖示間距調整
      if (leftIcon) finalStyle.paddingLeft = DesignSystem.spacing.xl;
      if (rightIcon) finalStyle.paddingRight = DesignSystem.spacing.xl;
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [currentState, hasError, style, nativeStyle, inputStyle, styleAdapter, leftIcon, rightIcon]);
    
    // 鍵盤類型映射
    const getKeyboardType = () => {
      const typeMap = {
        email: 'email-address',
        number: 'numeric',
        tel: 'phone-pad',
        url: 'url' };
      return keyboardType || typeMap[type as keyof typeof typeMap] || 'default';
    };
    
    // 事件處理
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocus?.();
    }, [onFocus]);
    
    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);
    
    return (
      <AdaptiveView style={containerStyleFinal}>
        {label && (
          <AdaptiveText
            variant="bodySmall"
            color={hasError ? 'error' : 'secondary'}
            style={{ fontWeight: '500', marginBottom: DesignSystem.spacing.xs }}
          >
            {label}
            {required && <AdaptiveText color="error"> *</AdaptiveText>}
          </AdaptiveText>
        )}
        
        <AdaptiveView style={{ position: 'relative' }}>
          {leftIcon && (
            <AdaptiveView 
              style={{ 
                position: 'absolute', 
                left: DesignSystem.spacing.sm, 
                zIndex: 1,
                justifyContent: 'center',
                height: '100%'
              }}
              pointerEvents="none"
            >
              {leftIcon}
            </AdaptiveView>
          )}
          
          <TextInput
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            style={inputStyleFinal}
            editable={!disabled && !readOnly}
            autoFocus={autoFocus}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize || 'none'}
            autoCorrect={autoCorrect}
            keyboardType={getKeyboardType() as any}
            returnKeyType={returnKeyType}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            testID={testID}
            accessible={accessible !== false}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            placeholderTextColor={DesignSystem.colors.text.tertiary}
            {...props}
          />
          
          {rightIcon && (
            <AdaptiveView 
              style={{ 
                position: 'absolute', 
                right: DesignSystem.spacing.sm, 
                zIndex: 1,
                justifyContent: 'center',
                height: '100%'
              }}
              pointerEvents="none"
            >
              {rightIcon}
            </AdaptiveView>
          )}
        </AdaptiveView>
        
        {(helperText || (typeof error === 'string' && error)) && (
          <AdaptiveText
            variant="caption"
            color={hasError ? 'error' : 'tertiary'}
            style={{ marginTop: DesignSystem.spacing.xs }}
          >
            {hasError && typeof error === 'string' ? error : helperText}
          </AdaptiveText>
        )}
      </AdaptiveView>
    );
  }
);

// 主要 AdaptiveInput 元件
export const AdaptiveInput = forwardRef<any, AdaptiveInputProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebInput {...props} ref={ref} />;
  } else {
    return <NativeInput {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveInput.displayName = 'AdaptiveInput';
WebInput.displayName = 'AdaptiveInput.Web';
NativeInput.displayName = 'AdaptiveInput.Native';

// 預設匯出
export default AdaptiveInput;

// 特殊類型的輸入元件
export const EmailInput = forwardRef<any, Omit<AdaptiveInputProps, 'type'>>((props, ref) => (
  <AdaptiveInput {...props} ref={ref} type="email" />
));

export const PasswordInput = forwardRef<any, Omit<AdaptiveInputProps, 'type' | 'secureTextEntry'>>((props, ref) => (
  <AdaptiveInput {...props} ref={ref} type="password" secureTextEntry={true} />
));

export const NumberInput = forwardRef<any, Omit<AdaptiveInputProps, 'type'>>((props, ref) => (
  <AdaptiveInput {...props} ref={ref} type="number" />
));

export const SearchInput = forwardRef<any, Omit<AdaptiveInputProps, 'type'>>((props, ref) => (
  <AdaptiveInput {...props} ref={ref} type="search" />
));

export const MultilineInput = forwardRef<any, Omit<AdaptiveInputProps, 'multiline'>>((props, ref) => (
  <AdaptiveInput {...props} ref={ref} multiline={true} />
));

// 設定顯示名稱
EmailInput.displayName = 'EmailInput';
PasswordInput.displayName = 'PasswordInput';
NumberInput.displayName = 'NumberInput';
SearchInput.displayName = 'SearchInput';
MultilineInput.displayName = 'MultilineInput';