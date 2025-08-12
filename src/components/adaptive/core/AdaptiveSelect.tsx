/**
 * AdaptiveSelect - 跨平台統一選擇器元件
 * 提供一致的下拉選單體驗和完整的表單整合
 */

import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import type { CSSProperties } from 'react';
import { PlatformAdapter } from '../platform/PlatformAdapter';
import { DesignSystem } from '../../../theme/designSystem';
import AdaptiveView from './AdaptiveView';
import AdaptiveText from './AdaptiveText';
import { withAlpha } from '@/utils/colorUtils';

// 選項介面
export interface SelectOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

// 選項組介面
export interface SelectOptionGroup<T = any> {
  label: string;
  options: SelectOption<T>[];
}

// 選擇器尺寸
export type SelectSize = 'small' | 'medium' | 'large';

// 選擇器狀態
export type SelectState = 'default' | 'focused' | 'error' | 'disabled' | 'open';

// AdaptiveSelect 屬性介面
export interface AdaptiveSelectProps<T = any> {
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  options?: SelectOption<T>[] | SelectOptionGroup<T>[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: SelectSize;
  
  // 樣式
  style?: ViewStyle | CSSProperties;
  webStyle?: CSSProperties;
  nativeStyle?: ViewStyle;
  dropdownStyle?: ViewStyle | CSSProperties;
  optionStyle?: ViewStyle | CSSProperties;
  
  // 狀態
  disabled?: boolean;
  loading?: boolean;
  error?: string | boolean;
  required?: boolean;
  
  // 標籤和幫助文字
  label?: string;
  helperText?: string;
  
  // 圖示
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // 下拉框設定
  maxDropdownHeight?: number;
  dropdownPosition?: 'bottom' | 'top' | 'auto';
  
  // 行為
  onChange?: (value: T | T[] | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSearch?: (searchText: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  
  // Web 特有
  name?: string;
  id?: string;
  form?: string;
  autoComplete?: string;
  
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

// 選擇器樣式生成器
const createSelectStyles = (state: SelectState, size: SelectSize, hasError: boolean) => {
  const baseStyle = {
    backgroundColor: DesignSystem.colors.background.input,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: size === 'small' ? DesignSystem.spacing.xs : 
                    size === 'large' ? DesignSystem.spacing.lg : DesignSystem.spacing.sm,
    fontSize: size === 'small' ? DesignSystem.typography.bodySmall.fontSize :
             size === 'large' ? DesignSystem.typography.body.fontSize + 2 : 
             DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.primary,
    minHeight: size === 'small' ? 32 : size === 'large' ? 48 : 40,
  };
  
  let stateStyle = {};
  
  if (hasError) {
    stateStyle = {
      borderColor: DesignSystem.colors.status.error,
    };
  } else {
    switch (state) {
      case 'focused':
      case 'open':
        stateStyle = {
          borderColor: DesignSystem.colors.primary,
          borderWidth: 2,
        };
        break;
      case 'disabled':
        stateStyle = {
          backgroundColor: DesignSystem.colors.gray100,
          borderColor: DesignSystem.colors.border.light,
          color: DesignSystem.colors.text.disabled,
          opacity: 0.6,
        };
        break;
    }
  }
  
  return { ...baseStyle, ...stateStyle };
};

// Web 實現
const WebSelect = forwardRef<HTMLDivElement, AdaptiveSelectProps>(
  ({
    value,
    defaultValue,
    placeholder = '請選擇...',
    options = [],
    multiple = false,
    searchable = false,
    clearable = false,
    size = 'medium',
    style,
    webStyle,
    dropdownStyle,
    optionStyle,
    disabled = false,
    loading = false,
    error,
    required = false,
    label,
    helperText,
    leftIcon,
    rightIcon,
    maxDropdownHeight = 200,
    dropdownPosition = 'auto',
    onChange,
    onFocus,
    onBlur,
    onSearch,
    onOpen,
    onClose,
    name,
    id,
    className = '',
    testID,
    accessible,
    accessibilityLabel,
    tabIndex,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    const hasError = Boolean(error);
    const currentState: SelectState = useMemo(() => {
      if (disabled) return 'disabled';
      if (isOpen) return 'open';
      if (isFocused) return 'focused';
      if (hasError) return 'error';
      return 'default';
    }, [disabled, isOpen, isFocused, hasError]);
    
    // 處理選項
    const processedOptions = useMemo(() => {
      const allOptions: SelectOption[] = [];
      
      options.forEach(item => {
        if ('options' in item) {
          // 選項組
          allOptions.push(...item.options);
        } else {
          // 單個選項
          allOptions.push(item);
        }
      });
      
      // 搜尋過濾
      if (searchable && searchText) {
        return allOptions.filter(option => 
          option.label.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      return allOptions;
    }, [options, searchable, searchText]);
    
    // 取得顯示文字
    const getDisplayText = useCallback(() => {
      if (!internalValue) return placeholder;
      
      if (multiple && Array.isArray(internalValue)) {
        const selectedLabels = processedOptions
          .filter(option => internalValue.includes(option.value))
          .map(option => option.label);
        return selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder;
      } else {
        const selectedOption = processedOptions.find(option => option.value === internalValue);
        return selectedOption?.label || placeholder;
      }
    }, [internalValue, processedOptions, placeholder, multiple]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: DesignSystem.spacing.xs,
      };
      
      if (style) {
        const convertedStyle = styleAdapter.adaptStyle(style as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [style, styleAdapter]);
    
    // 選擇器主體樣式
    const selectStyleFinal = useMemo(() => {
      const baseSelectStyle = createSelectStyles(currentState, size, hasError);
      
      let finalStyle = styleAdapter.adaptStyle(baseSelectStyle, webStyle);
      
      if (webStyle) {
        finalStyle = { ...finalStyle, ...webStyle };
      }
      
      // Web 特有樣式
      finalStyle = {
        ...finalStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        border: finalStyle.borderWidth ? 
          `${finalStyle.borderWidth}px solid ${finalStyle.borderColor}` : 
          'none',
        outline: 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
      };
      
      // 聚焦陰影
      if (currentState === 'focused' || currentState === 'open') {
        finalStyle.boxShadow = `0 0 0 3px ${DesignSystem.colors.primary}20`;
      }
      
      return finalStyle;
    }, [currentState, size, hasError, styleAdapter, webStyle, disabled]);
    
    // 下拉選單樣式
    const dropdownStyleFinal = useMemo(() => {
      let finalStyle: CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: DesignSystem.colors.background.card,
        border: `1px solid ${DesignSystem.colors.border.default}`,
        borderRadius: DesignSystem.borderRadius.md,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        maxHeight: maxDropdownHeight,
        overflowY: 'auto',
        zIndex: 1000,
        marginTop: 4,
      };
      
      if (dropdownStyle) {
        const convertedStyle = styleAdapter.adaptStyle(dropdownStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [dropdownStyle, styleAdapter, maxDropdownHeight]);
    
    // 選項樣式
    const getOptionStyle = useCallback((option: SelectOption, isSelected: boolean, isHovered: boolean) => {
      let finalStyle: CSSProperties = {
        padding: `${DesignSystem.spacing.sm}px ${DesignSystem.spacing.md}px`,
        cursor: option.disabled ? 'not-allowed' : 'pointer',
        color: option.disabled ? DesignSystem.colors.text.disabled : DesignSystem.colors.text.primary,
        backgroundColor: isSelected ? withAlpha(DesignSystem.colors.primary, 0.125) : 
                        isHovered ? DesignSystem.colors.gray50 : 'transparent',
        transition: 'background-color 150ms ease',
      };
      
      if (optionStyle) {
        const convertedStyle = styleAdapter.adaptStyle(optionStyle as any);
        finalStyle = { ...finalStyle, ...convertedStyle };
      }
      
      return finalStyle;
    }, [optionStyle, styleAdapter]);
    
    // 事件處理
    const handleToggle = useCallback(() => {
      if (disabled || loading) return;
      
      if (!isOpen) {
        setIsOpen(true);
        onOpen?.();
      } else {
        setIsOpen(false);
        onClose?.();
      }
    }, [disabled, loading, isOpen, onOpen, onClose]);
    
    const handleOptionClick = useCallback((option: SelectOption) => {
      if (option.disabled) return;
      
      let newValue;
      
      if (multiple) {
        const currentValues = Array.isArray(internalValue) ? internalValue : [];
        if (currentValues.includes(option.value)) {
          newValue = currentValues.filter(v => v !== option.value);
        } else {
          newValue = [...currentValues, option.value];
        }
      } else {
        newValue = option.value;
        setIsOpen(false);
        onClose?.();
      }
      
      setInternalValue(newValue);
      onChange?.(newValue);
    }, [multiple, internalValue, onChange, onClose]);
    
    const handleClear = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const newValue = multiple ? [] : null;
      setInternalValue(newValue);
      onChange?.(newValue);
    }, [multiple, onChange]);
    
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchText = e.target.value;
      setSearchText(newSearchText);
      onSearch?.(newSearchText);
    }, [onSearch]);
    
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocus?.();
    }, [onFocus]);
    
    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);
    
    // 點擊外部關閉下拉選單
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          onClose?.();
        }
      };
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen, onClose]);
    
    // 鍵盤導航
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isOpen) return;
        
        switch (event.key) {
          case 'Escape':
            setIsOpen(false);
            onClose?.();
            break;
          case 'Enter':
            event.preventDefault();
            // 這裡可以添加選擇高亮選項的邏輯
            break;
          case 'ArrowUp':
          case 'ArrowDown':
            event.preventDefault();
            // 這裡可以添加鍵盤導航邏輯
            break;
        }
      };
      
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [isOpen, onClose]);
    
    // 檢查是否選中
    const isOptionSelected = useCallback((option: SelectOption) => {
      if (multiple && Array.isArray(internalValue)) {
        return internalValue.includes(option.value);
      }
      return internalValue === option.value;
    }, [internalValue, multiple]);
    
    return (
      <div ref={containerRef} className={className} style={containerStyleFinal}>
        {label && (
          <AdaptiveText
            variant="bodySmall"
            color={hasError ? 'error' : 'secondary'}
            style={{ fontWeight: '500' }}
          >
            {label}
            {required && <span style={{ color: DesignSystem.colors.status.error }}> *</span>}
          </AdaptiveText>
        )}
        
        <div
          ref={ref}
          style={selectStyleFinal}
          onClick={handleToggle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={disabled ? -1 : (tabIndex ?? 0)}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-required={required}
          aria-haspopup="listbox"
          role="combobox"
          {...props}
        >
          {leftIcon && <span style={{ marginRight: 8 }}>{leftIcon}</span>}
          
          <span style={{ 
            flex: 1, 
            color: (!internalValue || (Array.isArray(internalValue) && internalValue.length === 0)) ? 
              DesignSystem.colors.text.tertiary : DesignSystem.colors.text.primary 
          }}>
            {getDisplayText()}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {clearable && internalValue && !disabled && (
              <span
                onClick={handleClear}
                style={{
                  cursor: 'pointer',
                  color: DesignSystem.colors.text.secondary,
                  fontSize: '14px',
                }}
              >
                ×
              </span>
            )}
            
            {rightIcon || (
              <span
                style={{
                  color: DesignSystem.colors.text.secondary,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              >
                ▼
              </span>
            )}
          </div>
        </div>
        
        {isOpen && (
          <div ref={dropdownRef} style={dropdownStyleFinal} role="listbox">
            {searchable && (
              <div style={{ padding: DesignSystem.spacing.sm }}>
                <input
                  type="text"
                  placeholder="搜尋..."
                  value={searchText}
                  onChange={handleSearchChange}
                  style={{
                    width: '100%',
                    padding: `${DesignSystem.spacing.xs}px ${DesignSystem.spacing.sm}px`,
                    border: `1px solid ${DesignSystem.colors.border.default}`,
                    borderRadius: DesignSystem.borderRadius.sm,
                    fontSize: DesignSystem.typography.bodySmall.fontSize,
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
            )}
            
            {processedOptions.length === 0 ? (
              <div style={{ 
                padding: DesignSystem.spacing.md,
                color: DesignSystem.colors.text.tertiary,
                textAlign: 'center' as const,
              }}>
                {searchText ? '找不到匹配的選項' : '沒有可用選項'}
              </div>
            ) : (
              processedOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  style={getOptionStyle(option, isOptionSelected(option), false)}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={isOptionSelected(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={isOptionSelected(option)}
                      onChange={() => {}}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
        
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
const NativeSelect = forwardRef<any, AdaptiveSelectProps>(
  ({
    value,
    defaultValue,
    placeholder = '請選擇...',
    options = [],
    multiple = false,
    size = 'medium',
    style,
    nativeStyle,
    disabled = false,
    error,
    required = false,
    label,
    helperText,
    onChange,
    onFocus,
    onBlur,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityHint,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);
    
    const { Modal, ScrollView, TouchableOpacity } = require('react-native');
    const platformAdapter = PlatformAdapter.getInstance();
    const styleAdapter = platformAdapter.getStyleAdapter();
    
    const hasError = Boolean(error);
    
    // 處理選項
    const processedOptions = useMemo(() => {
      const allOptions: SelectOption[] = [];
      
      options.forEach(item => {
        if ('options' in item) {
          allOptions.push(...item.options);
        } else {
          allOptions.push(item);
        }
      });
      
      return allOptions;
    }, [options]);
    
    // 取得顯示文字
    const getDisplayText = useCallback(() => {
      if (!internalValue) return placeholder;
      
      if (multiple && Array.isArray(internalValue)) {
        const selectedLabels = processedOptions
          .filter(option => internalValue.includes(option.value))
          .map(option => option.label);
        return selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder;
      } else {
        const selectedOption = processedOptions.find(option => option.value === internalValue);
        return selectedOption?.label || placeholder;
      }
    }, [internalValue, processedOptions, placeholder, multiple]);
    
    // 容器樣式
    const containerStyleFinal = useMemo(() => {
      let finalStyle = {};
      
      if (style) {
        finalStyle = styleAdapter.adaptStyle(style);
      }
      
      if (nativeStyle) {
        finalStyle = { ...finalStyle, ...nativeStyle };
      }
      
      return finalStyle;
    }, [style, nativeStyle, styleAdapter]);
    
    // 選擇器樣式
    const selectStyleFinal = useMemo(() => {
      const currentState: SelectState = disabled ? 'disabled' : hasError ? 'error' : 'default';
      const baseStyle = createSelectStyles(currentState, size, hasError);
      
      let finalStyle = {
        ...baseStyle,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      };
      
      return styleAdapter.adaptStyle(finalStyle);
    }, [disabled, hasError, size, styleAdapter]);
    
    // 事件處理
    const handlePress = useCallback(() => {
      if (!disabled) {
        setIsVisible(true);
      }
    }, [disabled]);
    
    const handleOptionSelect = useCallback((option: SelectOption) => {
      if (option.disabled) return;
      
      let newValue;
      
      if (multiple) {
        const currentValues = Array.isArray(internalValue) ? internalValue : [];
        if (currentValues.includes(option.value)) {
          newValue = currentValues.filter(v => v !== option.value);
        } else {
          newValue = [...currentValues, option.value];
        }
      } else {
        newValue = option.value;
        setIsVisible(false);
      }
      
      setInternalValue(newValue);
      onChange?.(newValue);
    }, [multiple, internalValue, onChange]);
    
    const handleClose = useCallback(() => {
      setIsVisible(false);
    }, []);
    
    // 檢查是否選中
    const isOptionSelected = useCallback((option: SelectOption) => {
      if (multiple && Array.isArray(internalValue)) {
        return internalValue.includes(option.value);
      }
      return internalValue === option.value;
    }, [internalValue, multiple]);
    
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
        
        <TouchableOpacity
          ref={ref}
          style={selectStyleFinal}
          onPress={handlePress}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          testID={testID}
          accessible={accessible !== false}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
          {...props}
        >
          <AdaptiveText
            style={{
              flex: 1,
              color: (!internalValue || (Array.isArray(internalValue) && internalValue.length === 0)) ? 
                DesignSystem.colors.text.tertiary : DesignSystem.colors.text.primary,
            }}
            numberOfLines={1}
          >
            {getDisplayText()}
          </AdaptiveText>
          
          <AdaptiveText style={{ color: DesignSystem.colors.text.secondary }}>
            ▼
          </AdaptiveText>
        </TouchableOpacity>
        
        <Modal visible={isVisible} transparent animationType="fade">
          <AdaptiveView style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: DesignSystem.spacing.lg,
          }}>
            <AdaptiveView style={{
              backgroundColor: DesignSystem.colors.background.card,
              borderRadius: DesignSystem.borderRadius.lg,
              maxHeight: '70%',
              width: '90%',
              maxWidth: 400,
            }}>
              <AdaptiveView style={{
                padding: DesignSystem.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: DesignSystem.colors.border.light,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <AdaptiveText variant="h4">選擇選項</AdaptiveText>
                <TouchableOpacity onPress={handleClose}>
                  <AdaptiveText style={{ fontSize: 20, color: DesignSystem.colors.text.secondary }}>
                    ×
                  </AdaptiveText>
                </TouchableOpacity>
              </AdaptiveView>
              
              <ScrollView style={{ maxHeight: 300 }}>
                {processedOptions.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
                    style={{
                      padding: DesignSystem.spacing.md,
                      borderBottomWidth: index < processedOptions.length - 1 ? 1 : 0,
                      borderBottomColor: DesignSystem.colors.border.light,
                      backgroundColor: isOptionSelected(option) ? 
                        withAlpha(DesignSystem.colors.primary, 0.125) : 'transparent',
                    }}
                    onPress={() => handleOptionSelect(option)}
                    disabled={option.disabled}
                  >
                    <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {multiple && (
                        <AdaptiveView style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isOptionSelected(option) ? 
                            DesignSystem.colors.primary : DesignSystem.colors.border.default,
                          backgroundColor: isOptionSelected(option) ? 
                            DesignSystem.colors.primary : 'transparent',
                          marginRight: DesignSystem.spacing.sm,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          {isOptionSelected(option) && (
                            <AdaptiveText style={{ 
                              color: DesignSystem.colors.text.inverse,
                              fontSize: 12,
                              fontWeight: 'bold',
                            }}>
                              ✓
                            </AdaptiveText>
                          )}
                        </AdaptiveView>
                      )}
                      
                      <AdaptiveText
                        style={{
                          color: option.disabled ? 
                            DesignSystem.colors.text.disabled : 
                            DesignSystem.colors.text.primary,
                          fontWeight: isOptionSelected(option) ? '600' : 'normal',
                        }}
                      >
                        {option.label}
                      </AdaptiveText>
                    </AdaptiveView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {!multiple && (
                <AdaptiveView style={{
                  padding: DesignSystem.spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: DesignSystem.colors.border.light,
                }}>
                  <TouchableOpacity
                    style={{
                      padding: DesignSystem.spacing.sm,
                      backgroundColor: DesignSystem.colors.gray100,
                      borderRadius: DesignSystem.borderRadius.md,
                      alignItems: 'center',
                    }}
                    onPress={handleClose}
                  >
                    <AdaptiveText>完成</AdaptiveText>
                  </TouchableOpacity>
                </AdaptiveView>
              )}
            </AdaptiveView>
          </AdaptiveView>
        </Modal>
        
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

// 主要 AdaptiveSelect 元件
export const AdaptiveSelect = forwardRef<any, AdaptiveSelectProps>((props, ref) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  if (platformAdapter.isWeb) {
    return <WebSelect {...props} ref={ref} />;
  } else {
    return <NativeSelect {...props} ref={ref} />;
  }
});

// 設定顯示名稱
AdaptiveSelect.displayName = 'AdaptiveSelect';
WebSelect.displayName = 'AdaptiveSelect.Web';
NativeSelect.displayName = 'AdaptiveSelect.Native';

// 預設匯出
export default AdaptiveSelect;

// 特殊類型的選擇器元件
export const SingleSelect = forwardRef<any, Omit<AdaptiveSelectProps, 'multiple'>>((props, ref) => (
  <AdaptiveSelect {...props} ref={ref} multiple={false} />
));

export const MultiSelect = forwardRef<any, Omit<AdaptiveSelectProps, 'multiple'>>((props, ref) => (
  <AdaptiveSelect {...props} ref={ref} multiple={true} />
));

export const SearchableSelect = forwardRef<any, Omit<AdaptiveSelectProps, 'searchable'>>((props, ref) => (
  <AdaptiveSelect {...props} ref={ref} searchable={true} />
));

export const ClearableSelect = forwardRef<any, Omit<AdaptiveSelectProps, 'clearable'>>((props, ref) => (
  <AdaptiveSelect {...props} ref={ref} clearable={true} />
));

// 設定顯示名稱
SingleSelect.displayName = 'SingleSelect';
MultiSelect.displayName = 'MultiSelect';
SearchableSelect.displayName = 'SearchableSelect';
ClearableSelect.displayName = 'ClearableSelect';