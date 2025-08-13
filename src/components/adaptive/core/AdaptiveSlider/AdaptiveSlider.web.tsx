/**
 * AdaptiveSlider Web 實作
 * 使用原生 HTML range input + 內聯樣式
 */

import React, { useState, useRef, useEffect } from 'react';
import { AdaptiveSliderProps, DEFAULT_COLORS } from './AdaptiveSlider.types';

export const AdaptiveSlider: React.FC<AdaptiveSliderProps> = ({
  value = 0,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  minimumTrackTintColor = DEFAULT_COLORS.minimumTrack,
  maximumTrackTintColor = DEFAULT_COLORS.maximumTrack,
  thumbTintColor = DEFAULT_COLORS.thumb,
  showValue = false,
  valuePrefix = '',
  valueSuffix = '',
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // 計算進度百分比
  const percentage = ((localValue - minimumValue) / (maximumValue - minimumValue)) * 100;
  
  // 容器樣式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
  
  // Slider 包裝器樣式
  const sliderWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
  };
  
  // 軌道樣式
  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: maximumTrackTintColor,
    overflow: 'hidden',
  };
  
  // 已填充軌道樣式
  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: minimumTrackTintColor,
    borderRadius: '2px',
    transition: isDragging ? 'none' : 'width 0.2s ease',
  };
  
  // 原生 slider 樣式（隱藏但保留功能）
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '40px',
    margin: 0,
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    zIndex: 2,
  };
  
  // Thumb 樣式
  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: thumbTintColor,
    border: `2px solid ${minimumTrackTintColor}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    left: `${percentage}%`,
    transform: 'translateX(-50%)',
    transition: isDragging ? 'none' : 'left 0.2s ease',
    pointerEvents: 'none',
  };
  
  // 數值顯示樣式
  const valueStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-30px',
    left: `${percentage}%`,
    transform: 'translateX(-50%)',
    backgroundColor: minimumTrackTintColor,
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    opacity: isDragging ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onValueChange?.(newValue);
  };
  
  const handleMouseDown = () => {
    if (!disabled) {
      setIsDragging(true);
      onSlidingStart?.();
    }
  };
  
  const handleMouseUp = () => {
    if (!disabled && isDragging) {
      setIsDragging(false);
      onSlidingComplete?.(localValue);
    }
  };
  
  return (
    <div style={containerStyle} data-testid={testID}>
      <div style={sliderWrapperStyle}>
        {/* 軌道 */}
        <div style={trackStyle}>
          <div style={fillStyle} />
        </div>
        
        {/* Thumb */}
        <div style={thumbStyle} />
        
        {/* 數值顯示 */}
        {showValue && (
          <div style={valueStyle}>
            {valuePrefix}{localValue}{valueSuffix}
          </div>
        )}
        
        {/* 原生 input */}
        <input
          ref={sliderRef}
          type="range"
          min={minimumValue}
          max={maximumValue}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          style={inputStyle}
          aria-label={accessibilityLabel || '滑動條'}
          aria-valuemin={minimumValue}
          aria-valuemax={maximumValue}
          aria-valuenow={localValue}
        />
      </div>
      
      {/* 永久顯示數值 */}
      {showValue && !isDragging && (
        <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '14px', color: DEFAULT_COLORS.value }}>
          {valuePrefix}{localValue}{valueSuffix}
        </div>
      )}
    </div>
  );
};