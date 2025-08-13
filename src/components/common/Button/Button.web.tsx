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

    // 變體樣式 - 使用最強的內聯樣式
    const variantStyles = {
      primary: {
        backgroundColor: '#007AFF',
        color: '#FFFFFF',
        // 強制覆蓋所有子元素的顏色
        '& *': { color: '#FFFFFF !important' }
      },
      secondary: {
        backgroundColor: '#F2F2F7',
        color: '#000000',
        '& *': { color: '#000000 !important' }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        border: '1px solid #007AFF',
        '& *': { color: '#007AFF !important' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        '& *': { color: '#007AFF !important' }
      },
      text: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        padding: '0',
        textDecoration: 'underline',
        '& *': { color: '#007AFF !important' }
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
      target.style.backgroundColor = webColorOverrides.button.primary.hover;
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
      target.style.backgroundColor = webColorOverrides.button.primary.default;
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
                 variant === 'secondary' ? '#000000' :
                 variant === 'outline' ? '#007AFF' :
                 variant === 'ghost' ? '#007AFF' :
                 variant === 'text' ? '#007AFF' : '#000000'
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