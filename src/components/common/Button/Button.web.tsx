/**
 * Web 平台專用 Button 元件
 * 使用原生 HTML button 元素確保樣式不被全域 CSS 覆蓋
 */

import React from 'react';
import { webColorOverrides } from '@/theme/webOverrides';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  onClick?: () => void; // Web 相容性
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: React.CSSProperties;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  'aria-label'?: string;
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style = {},
  className = '',
  type = 'button',
  fullWidth = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId }) => {
  // 使用內聯樣式確保最高優先級
  const getButtonStyle = (): React.CSSProperties => {
    // 基礎樣式
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontFamily: 'inherit',
      fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      outline: 'none',
      border: 'none',
      width: fullWidth ? '100%' : 'auto',
      boxSizing: 'border-box',
      userSelect: 'none',
      position: 'relative' };

    // 尺寸樣式
    const sizeStyles = {
      small: { 
        padding: '6px 12px', 
        fontSize: '13px', 
        lineHeight: '18px',
        gap: '4px'
      },
      medium: { 
        padding: '8px 16px', 
        fontSize: '14px', 
        lineHeight: '20px',
        gap: '6px'
      },
      large: { 
        padding: '10px 20px', 
        fontSize: '16px', 
        lineHeight: '22px',
        gap: '8px'
      } };

        // 變體樣式 - 遵循黑白灰設計系統
    const variantStyles = {
      primary: {
        backgroundColor: '#2C2C2C',  // 深灰按鈕
        color: '#FFFFFF',            // 白色文字
        border: 'none'
      },
      secondary: {
        backgroundColor: '#F7F7F7',  // 淺灰背景
        color: '#1A1A1A',            // 深色文字
        border: 'none'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#2C2C2C',            // 深灰文字
        border: '1px solid #D0D0D0' // 灰色邊框
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#2C2C2C',            // 深灰文字
        border: 'none'
      },
      text: {
        backgroundColor: 'transparent',
        color: '#666666',            // 次要文字色
        padding: '0',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        border: 'none'
      }
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style };
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // 支援 onPress（React Native）和 onClick（Web）
    if (onClick) onClick();
    if (onPress) onPress();
  };

  // 處理滑鼠懸停效果
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const target = e.currentTarget;
    if (variant === 'primary') {
      target.style.backgroundColor = '#3C3C3C'; // 深灰 hover
    } else if (variant === 'secondary') {
      target.style.backgroundColor = webColorOverrides.button.secondary.hover;
    } else if (variant === 'outline') {
      target.style.backgroundColor = webColorOverrides.button.outline.backgroundHover;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const target = e.currentTarget;
    if (variant === 'primary') {
      target.style.backgroundColor = '#2C2C2C'; // 深灰預設
    } else if (variant === 'secondary') {
      target.style.backgroundColor = webColorOverrides.button.secondary.default;
    } else if (variant === 'outline') {
      target.style.backgroundColor = 'transparent';
    }
  };

  // 渲染內容
  const renderContent = () => {
    if (loading) {
      return (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: 'inherit'
        }}>
          <span 
            style={{ 
              display: 'inline-block',
              animation: 'spin 1s linear infinite'
            }}
          >
            ⟳
          </span>
          {title || children}
        </span>
      );
    }

    const content = title || children;
    
    if (icon) {
      return (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'inherit',
          color: 'inherit'
        }}>
          {iconPosition === 'left' && icon}
          {content}
          {iconPosition === 'right' && icon}
        </span>
      );
    }

    return content;
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type={type}
        disabled={disabled || loading}
        style={{
          ...getButtonStyle(),
          // 確保文字顏色正確顯示
          color: variant === 'primary' ? '#FFFFFF' : 
                 variant === 'secondary' ? '#1A1A1A' :
                 variant === 'outline' ? '#2C2C2C' :
                 variant === 'ghost' ? '#2C2C2C' :
                 variant === 'text' ? '#666666' : '#1A1A1A'
        }}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {renderContent()}
      </button>
    </>
  );
};

export default Button;