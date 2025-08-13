/**
 * AdaptiveRadio Web 實作
 * 使用原生 HTML radio + 內聯樣式確保 Web 平台正確顯示
 */

import React from 'react';
import { AdaptiveRadioProps, AdaptiveRadioGroupProps, DEFAULT_COLORS } from './AdaptiveRadio.types';

export const AdaptiveRadio: React.FC<AdaptiveRadioProps> = ({
  value = false,
  onPress,
  disabled = false,
  color = DEFAULT_COLORS.selected,
  size = 'medium',
  label,
  labelPosition = 'right',
  accessibilityLabel,
  testID,
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const radioSize = sizeMap[size];
  const dotSize = radioSize * 0.4;
  
  // 容器樣式
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
  };
  
  // Radio 包裝器樣式
  const radioWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${radioSize}px`,
    height: `${radioSize}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
  
  // 外圈樣式
  const outerCircleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `2px solid ${value ? color : DEFAULT_COLORS.unselected}`,
    borderRadius: '50%',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };
  
  // 內點樣式
  const innerDotStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    backgroundColor: color,
    transform: 'translate(-50%, -50%)',
    opacity: value ? 1 : 0,
    transition: 'opacity 0.2s ease',
  };
  
  // 標籤樣式
  const labelStyle: React.CSSProperties = {
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    color: disabled ? DEFAULT_COLORS.disabled : DEFAULT_COLORS.label,
    lineHeight: 1.5,
  };
  
  // 隱藏的原生 radio 樣式
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
    if (!disabled && onPress) {
      onPress();
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
      role="radio"
      aria-checked={value}
      aria-disabled={disabled}
      aria-label={accessibilityLabel || label}
      data-testid={testID}
    >
      {label && labelPosition === 'left' && (
        <span style={labelStyle}>{label}</span>
      )}
      
      <div style={radioWrapperStyle}>
        <input
          type="radio"
          checked={value}
          disabled={disabled}
          onChange={() => {}} // 由 label onClick 處理
          style={hiddenInputStyle}
          aria-hidden="true"
        />
        
        <div style={outerCircleStyle} />
        <div style={innerDotStyle} />
      </div>
      
      {label && labelPosition === 'right' && (
        <span style={labelStyle}>{label}</span>
      )}
    </label>
  );
};

// RadioGroup 元件
export const AdaptiveRadioGroup: React.FC<AdaptiveRadioGroupProps> = ({
  value,
  onValueChange,
  disabled = false,
  options,
  direction = 'vertical',
  color = DEFAULT_COLORS.selected,
  size = 'medium',
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    gap: direction === 'horizontal' ? '16px' : '12px',
    flexWrap: direction === 'horizontal' ? 'wrap' : 'nowrap',
  };
  
  return (
    <div style={containerStyle} role="radiogroup">
      {options.map((option) => (
        <AdaptiveRadio
          key={option.value}
          value={value === option.value}
          onPress={() => onValueChange?.(option.value)}
          disabled={disabled || option.disabled}
          label={option.label}
          color={color}
          size={size}
        />
      ))}
    </div>
  );
};