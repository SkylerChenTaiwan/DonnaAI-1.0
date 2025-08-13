/**
 * AdaptiveCheckbox Web 實作
 * 使用原生 HTML checkbox + 內聯樣式確保 Web 平台正確顯示
 */

import React from 'react';
import { AdaptiveCheckboxProps, DEFAULT_COLORS } from './AdaptiveCheckbox.types';

export const AdaptiveCheckbox: React.FC<AdaptiveCheckboxProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  color = DEFAULT_COLORS.checked,
  size = 'medium',
  label,
  labelPosition = 'right',
  indeterminate = false,
  accessibilityLabel,
  testID,
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const checkboxSize = sizeMap[size];
  
  // 容器樣式
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
  };
  
  // Checkbox 包裝器樣式
  const checkboxWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${checkboxSize}px`,
    height: `${checkboxSize}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
  
  // 視覺方框樣式
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `2px solid ${value || indeterminate ? color : DEFAULT_COLORS.unchecked}`,
    borderRadius: '4px',
    backgroundColor: value || indeterminate ? color : 'transparent',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };
  
  // 勾選標記樣式
  const checkmarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: value || indeterminate ? 'block' : 'none',
  };
  
  // 標籤樣式
  const labelStyle: React.CSSProperties = {
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    color: disabled ? DEFAULT_COLORS.disabled : DEFAULT_COLORS.label,
    lineHeight: 1.5,
  };
  
  // 隱藏的原生 checkbox 樣式
  const hiddenInputStyle: React.CSSProperties = {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    padding: 0,
    pointerEvents: 'none',
  };
  
  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };
  
  return (
    <label 
      style={containerStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : value}
      aria-disabled={disabled}
      aria-label={accessibilityLabel || label}
      data-testid={testID}
    >
      {label && labelPosition === 'left' && (
        <span style={labelStyle}>{label}</span>
      )}
      
      <div style={checkboxWrapperStyle}>
        <input
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={() => {}} // 由 label onClick 處理
          style={hiddenInputStyle}
          aria-hidden="true"
        />
        
        <div style={boxStyle} />
        
        <svg
          style={checkmarkStyle}
          width={checkboxSize * 0.6}
          height={checkboxSize * 0.6}
          viewBox="0 0 24 24"
          fill="none"
        >
          {indeterminate ? (
            // 不確定狀態：橫線
            <rect
              x="6"
              y="11"
              width="12"
              height="2"
              fill="white"
            />
          ) : (
            // 勾選狀態：勾號
            <path
              d="M20 6L9 17L4 12"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
      
      {label && labelPosition === 'right' && (
        <span style={labelStyle}>{label}</span>
      )}
    </label>
  );
};