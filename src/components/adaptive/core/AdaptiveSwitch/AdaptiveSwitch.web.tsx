/**
 * AdaptiveSwitch Web 平台實作
 * 使用原生 HTML checkbox 元素與內聯樣式確保樣式不被全域 CSS 覆蓋
 */

import React, { useRef, useEffect } from 'react';
import { AdaptiveSwitchProps, DEFAULT_COLORS } from './AdaptiveSwitch.types';

export const AdaptiveSwitch: React.FC<AdaptiveSwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  trackColor = DEFAULT_COLORS.trackColor,
  thumbColor = DEFAULT_COLORS.thumbColor,
  label,
  labelPosition = 'right',
  accessibilityLabel,
  accessibilityRole = 'switch',
  accessibilityState,
  testID,
  style,
  id,
  name,
  className,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 合併顏色配置
  const colors = {
    trackFalse: trackColor?.false || DEFAULT_COLORS.trackColor.false,
    trackTrue: trackColor?.true || DEFAULT_COLORS.trackColor.true,
    thumb: disabled ? DEFAULT_COLORS.disabledThumbColor : thumbColor,
    disabledTrack: DEFAULT_COLORS.disabledTrackColor,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onValueChange) {
      onValueChange(e.target.checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 支援空格鍵切換
    if (e.key === ' ' && !disabled) {
      e.preventDefault();
      if (onValueChange) {
        onValueChange(!value);
      }
    }
  };

  // 容器樣式 - 使用內聯樣式確保最高優先級
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    ...style,
  };

  // Switch 容器樣式
  const switchStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '51px',
    height: '31px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
    borderRadius: '34px',
  };

  // 軌道樣式
  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: disabled 
      ? colors.disabledTrack 
      : value 
        ? colors.trackTrue 
        : colors.trackFalse,
    borderRadius: '34px',
    transition: 'background-color 0.2s ease',
    border: 'none',
    outline: 'none',
  };

  // 滑塊樣式
  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: value ? '22px' : '2px',
    width: '27px',
    height: '27px',
    backgroundColor: colors.thumb,
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: disabled 
      ? '0 1px 3px rgba(0,0,0,0.1)' 
      : '0 2px 4px rgba(0,0,0,0.2)',
    border: 'none',
    outline: 'none',
  };

  // 隱藏的 input 樣式
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    opacity: 0,
    width: '0',
    height: '0',
    margin: '0',
    padding: '0',
    border: 'none',
    outline: 'none',
  };

  // 標籤樣式
  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: disabled ? '#999999' : '#1A1A1A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '20px',
  };

  // 處理焦點樣式
  useEffect(() => {
    const handleFocus = () => {
      if (inputRef.current?.parentElement) {
        const track = inputRef.current.parentElement.querySelector('[data-track]') as HTMLElement;
        if (track) {
          track.style.boxShadow = '0 0 0 2px rgba(254, 120, 33, 0.3)';
        }
      }
    };

    const handleBlur = () => {
      if (inputRef.current?.parentElement) {
        const track = inputRef.current.parentElement.querySelector('[data-track]') as HTMLElement;
        if (track) {
          track.style.boxShadow = 'none';
        }
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      return () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  const switchElement = (
    <div 
      style={switchStyle}
      className={className}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={value}
      aria-disabled={disabled}
      aria-label={accessibilityLabel || label}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={value}
        onChange={handleChange}
        disabled={disabled}
        style={inputStyle}
        id={id}
        name={name}
        data-testid={testID}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div style={trackStyle} data-track />
      <div style={thumbStyle} data-thumb />
    </div>
  );

  // 如果有標籤，包裝在 label 元素中
  if (label) {
    return (
      <label style={containerStyle} htmlFor={id}>
        {labelPosition === 'left' && (
          <span style={labelStyle}>{label}</span>
        )}
        {switchElement}
        {labelPosition === 'right' && (
          <span style={labelStyle}>{label}</span>
        )}
      </label>
    );
  }

  // 沒有標籤時直接返回 switch
  return <div style={containerStyle}>{switchElement}</div>;
};

// 導出預設值
export default AdaptiveSwitch;