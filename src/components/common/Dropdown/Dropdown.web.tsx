/**
 * Web 平台專用 Dropdown 元件
 * 使用原生 HTML select 元素確保最佳相容性和可訪問性
 */

import React from 'react';
import { webStyleOverrides, webColorOverrides } from '@/theme/webOverrides';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value = '',
  placeholder = '請選擇...',
  onChange,
  disabled = false,
  className = '',
  style = {},
  name,
  id,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  // 合併樣式
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 40px 12px 16px',
    border: `1px solid ${disabled ? webColorOverrides.border.light : webColorOverrides.border.default}`,
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: disabled ? webColorOverrides.background.primary : webColorOverrides.background.input,
    color: disabled ? webColorOverrides.text.disabled : webColorOverrides.text.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    // 自訂下拉箭頭
    backgroundImage: disabled ? 'none' : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23${disabled ? '999999' : '000000'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
    transition: 'all 0.2s ease',
    ...style,
  };

  // 懸停和焦點樣式
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // 動態調整樣式
  if (!disabled) {
    if (isFocused) {
      selectStyle.borderColor = webColorOverrides.button.primary.default;
      selectStyle.boxShadow = `0 0 0 2px ${webColorOverrides.button.primary.default}20`;
    } else if (isHovered) {
      selectStyle.borderColor = webColorOverrides.border.medium;
    }
  }

  return (
    <select
      id={id}
      name={name}
      className={`dropdown-web ${className}`}
      style={selectStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel || placeholder}
      aria-describedby={ariaDescribedBy}
    >
      {/* 預設選項 */}
      {placeholder && (
        <option value="" disabled={required}>
          {placeholder}
        </option>
      )}
      
      {/* 渲染選項 */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};