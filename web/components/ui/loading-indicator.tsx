/**
 * 載入指示器元件集合
 */

'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// 基礎載入指示器屬性
interface BaseLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

// 旋轉載入指示器
export function SpinnerLoading({ 
  className, 
  size = 'md', 
  color = 'primary' 
}: BaseLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )} 
    />
  );
}

// 脈衝載入指示器
export function PulseLoading({ 
  className, 
  size = 'md', 
  color = 'primary' 
}: BaseLoadingProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-6 w-6',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  );
}

// 骨架載入指示器
export function SkeletonLoading({ 
  className,
  lines = 3,
  showAvatar = false,
}: {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex space-x-4">
        {showAvatar && (
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
        )}
        <div className="flex-1 space-y-2 py-1">
          {[...Array(lines)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 bg-gray-200 rounded',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 進度條載入指示器
export function ProgressLoading({ 
  progress = 0,
  className,
  showPercentage = false,
  color = 'primary',
}: {
  progress?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('space-y-2', className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span>進度</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// 載入覆蓋層
export function LoadingOverlay({ 
  isLoading,
  children,
  className,
  spinnerSize = 'lg',
  message,
  blur = true,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: BaseLoadingProps['size'];
  message?: string;
  blur?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          'bg-white/80 backdrop-blur-sm',
          blur && 'backdrop-blur-sm',
          'z-50'
        )}>
          <SpinnerLoading size={spinnerSize} />
          {message && (
            <p className="mt-4 text-sm text-gray-600">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}

// 按鈕載入狀態
export function LoadingButton({
  children,
  isLoading = false,
  disabled,
  className,
  variant = 'primary',
  size = 'md',
  spinnerSize = 'sm',
  loadingText,
  ...props
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  spinnerSize?: BaseLoadingProps['size'];
  loadingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-md font-medium',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'transition-colors duration-200'
  );

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'hover:bg-gray-100 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <SpinnerLoading 
          size={spinnerSize} 
          color={variant === 'outline' || variant === 'ghost' ? 'gray' : 'white'}
          className="mr-2" 
        />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}

// 卡片載入狀態
export function LoadingCard({ 
  className,
  showHeader = true,
  showFooter = false,
  lines = 3,
}: {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
}) {
  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-6 shadow-sm',
      'animate-pulse',
      className
    )}>
      {showHeader && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-gray-200 rounded',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>

      {showFooter && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex space-x-3">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// 表格載入狀態
export function LoadingTable({ 
  columns = 4, 
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 表格標頭 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {[...Array(columns)].map((_, i) => (
              <div key={i} className="flex-1 p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 表格內容 */}
        <div className="bg-white">
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b border-gray-100 last:border-b-0">
              <div className="flex">
                {[...Array(columns)].map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 p-4">
                    <div className={cn(
                      'h-4 bg-gray-200 rounded',
                      colIndex === 0 ? 'w-full' : 'w-2/3'
                    )}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 頁面載入狀態
export function PageLoading({ 
  message = '載入中...',
  showLogo = false,
}: {
  message?: string;
  showLogo?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        {showLogo && (
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        )}
        
        <SpinnerLoading size="xl" className="mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// 預設載入指示器（為了向後相容）
export interface LoadingIndicatorProps extends BaseLoadingProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingIndicator({ 
  className, 
  size = 'md', 
  color = 'primary'
}: LoadingIndicatorProps) {
  // 如果 size 是數字，轉換為自訂樣式
  if (typeof size === 'number') {
    return (
      <Loader2 
        className={cn('animate-spin', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  // 使用預設的 SpinnerLoading
  return <SpinnerLoading className={className} size={size} color={color} />;
}