/**
 * Web 平台專用 FormInput 元件
 * 使用原生 HTML input 元素確保最佳相容性
 */

import React from 'react';
import { webStyleOverrides, webColorOverrides } from '@/theme/webOverrides';

export interface FormInputProps {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  editable?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  testID?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  value = '',
  placeholder = '',
  onChangeText,
  onBlur,
  onFocus,
  disabled = false,
  editable = true,
  type = 'text',
  autoComplete,
  autoFocus = false,
  maxLength,
  className = '',
  style = {},
  name,
  id,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  testID,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  
  const isDisabled = disabled || !editable;

  // 基礎樣式
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${isDisabled ? webColorOverrides.border.light : webColorOverrides.border.default}`,
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: isDisabled ? webColorOverrides.background.primary : webColorOverrides.background.input,
    color: isDisabled ? webColorOverrides.text.disabled : webColorOverrides.text.primary,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    cursor: isDisabled ? 'not-allowed' : 'text',
    ...style,
  };

  // 動態樣式調整
  if (!isDisabled) {
    if (ariaInvalid) {
      inputStyle.borderColor = webColorOverrides.status.error;
      if (isFocused) {
        inputStyle.boxShadow = `0 0 0 2px ${webColorOverrides.status.error}20`;
      }
    } else if (isFocused) {
      inputStyle.borderColor = webColorOverrides.button.primary.default;
      inputStyle.boxShadow = `0 0 0 2px ${webColorOverrides.button.primary.default}20`;
    } else if (isHovered) {
      inputStyle.borderColor = webColorOverrides.border.medium;
    }
  }

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChangeText && !isDisabled) {
      onChangeText(e.target.value);
    }
  };

  // 處理焦點事件
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <input
      id={id}
      name={name}
      type={type}
      className={`form-input-web ${className}`}
      style={inputStyle}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isDisabled}
      readOnly={!editable}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      maxLength={maxLength}
      required={required}
      aria-label={ariaLabel || placeholder}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      data-testid={testID}
    />
  );
};