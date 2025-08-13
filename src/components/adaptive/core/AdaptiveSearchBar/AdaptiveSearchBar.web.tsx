/**
 * AdaptiveSearchBar Web 實作
 * 使用原生 HTML input + 內聯樣式確保 Web 平台正確顯示
 */

import React, { useRef, useState } from 'react';
import { AdaptiveSearchBarProps, DEFAULT_COLORS } from './AdaptiveSearchBar.types';

export const AdaptiveSearchBar: React.FC<AdaptiveSearchBarProps> = ({
  value = '',
  onChangeText,
  onSearch,
  onClear,
  placeholder = '搜尋...',
  autoFocus = false,
  returnKeyType = 'search',
  showIcon = true,
  showClearButton = true,
  variant = 'filled',
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 容器樣式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: '40px',
    backgroundColor: variant === 'filled' ? DEFAULT_COLORS.background : 'transparent',
    border: variant === 'outlined' ? `1px solid ${isFocused ? DEFAULT_COLORS.focus : DEFAULT_COLORS.border}` : 'none',
    borderRadius: '8px',
    padding: '0 12px',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };
  
  // 輸入框樣式
  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    lineHeight: '24px',
    color: DEFAULT_COLORS.text,
    padding: '8px 4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: disabled ? 'not-allowed' : 'text',
  };
  
  // 圖標樣式
  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8px',
    color: DEFAULT_COLORS.icon,
  };
  
  // 清除按鈕樣式
  const clearButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',
    border: 'none',
    outline: 'none',
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      onSearch(value);
    }
  };
  
  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
    inputRef.current?.focus();
  };
  
  return (
    <div
      style={containerStyle}
      onClick={() => inputRef.current?.focus()}
      data-testid={testID}
    >
      {showIcon && (
        <div style={iconStyle}>
          {loading ? (
            // 載入動畫
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="31.4"
                strokeDashoffset="10"
              />
            </svg>
          ) : (
            // 搜尋圖標
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        style={inputStyle}
        aria-label={accessibilityLabel || '搜尋'}
      />
      
      {showClearButton && value && !disabled && (
        <button
          style={clearButtonStyle}
          onClick={handleClear}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="清除"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// 加入動畫樣式
if (typeof document !== 'undefined' && !document.getElementById('adaptive-searchbar-styles')) {
  const style = document.createElement('style');
  style.id = 'adaptive-searchbar-styles';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}