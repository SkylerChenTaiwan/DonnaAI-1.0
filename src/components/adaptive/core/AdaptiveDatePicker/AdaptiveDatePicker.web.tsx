/**
 * AdaptiveDatePicker Web 實作
 * 使用原生 HTML date input + 內聯樣式
 */

import React, { useRef } from 'react';
import { AdaptiveDatePickerProps, DEFAULT_COLORS, formatDate } from './AdaptiveDatePicker.types';

export const AdaptiveDatePicker: React.FC<AdaptiveDatePickerProps> = ({
  value = null,
  onDateChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder = '選擇日期',
  format,
  disabled = false,
  variant = 'filled',
  accessibilityLabel,
  testID,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 決定 input type
  const inputType = mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date';
  
  // 格式化日期為 input value
  const getInputValue = (): string => {
    if (!value) return '';
    
    const date = value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (mode === 'time') {
      return `${hours}:${minutes}`;
    } else if (mode === 'datetime') {
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      return `${year}-${month}-${day}`;
    }
  };
  
  // 容器樣式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
  };
  
  // 輸入框樣式
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    padding: '8px 12px',
    fontSize: '16px',
    lineHeight: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: value ? DEFAULT_COLORS.text : DEFAULT_COLORS.placeholder,
    backgroundColor: variant === 'filled' ? DEFAULT_COLORS.background : 'transparent',
    border: variant === 'outlined' ? `1px solid ${DEFAULT_COLORS.border}` : 'none',
    borderRadius: '8px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  };
  
  // 日曆圖標樣式
  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: DEFAULT_COLORS.primary,
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      onDateChange?.(null);
      return;
    }
    
    // 解析日期
    const date = new Date(inputValue);
    if (!isNaN(date.getTime())) {
      onDateChange?.(date);
    }
  };
  
  const handleClick = () => {
    // 點擊時顯示日期選擇器
    inputRef.current?.showPicker?.();
  };
  
  // 格式化顯示文字
  const displayValue = value ? formatDate(value, format || (
    mode === 'time' ? 'HH:mm' :
    mode === 'datetime' ? 'YYYY-MM-DD HH:mm' :
    'YYYY-MM-DD'
  )) : '';
  
  return (
    <div style={containerStyle} data-testid={testID}>
      <input
        ref={inputRef}
        type={inputType}
        value={getInputValue()}
        onChange={handleChange}
        min={minimumDate ? getInputValue.call({ value: minimumDate }) : undefined}
        max={maximumDate ? getInputValue.call({ value: maximumDate }) : undefined}
        disabled={disabled}
        style={inputStyle}
        placeholder={placeholder}
        aria-label={accessibilityLabel || '日期選擇器'}
        onClick={handleClick}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = DEFAULT_COLORS.primary;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = DEFAULT_COLORS.border;
        }}
      />
      
      {/* 日曆圖標 */}
      <svg
        style={iconStyle}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="7" y="14" width="3" height="3" fill="currentColor"/>
      </svg>
    </div>
  );
};