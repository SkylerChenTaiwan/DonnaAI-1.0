/**
 * Input Component - 基於 Radix UI 的輸入框元件
 * 支援多種類型、驗證和狀態，符合 DonnaAI 設計系統
 */

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

// 輸入框變體樣式定義
const inputVariants = cva(
  // 基礎樣式
  "flex w-full rounded-button border px-3 py-2 text-sm transition-all duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      // 狀態變體
      variant: {
        default: 
          "border-border-light bg-background-input hover:border-border-medium focus-visible:border-primary-500",
        success: 
          "border-success bg-background-input hover:border-success focus-visible:border-success focus-visible:ring-success",
        error: 
          "border-error bg-background-input hover:border-error focus-visible:border-error focus-visible:ring-error",
        warning: 
          "border-warning bg-background-input hover:border-warning focus-visible:border-warning focus-visible:ring-warning"
      },
      // 尺寸變體
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

// 輸入框元件 Props 介面
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /**
   * 標籤文字
   */
  label?: string;
  /**
   * 錯誤訊息
   */
  error?: string;
  /**
   * 成功訊息
   */
  success?: string;
  /**
   * 警告訊息
   */
  warning?: string;
  /**
   * 說明文字
   */
  description?: string;
  /**
   * 是否必填
   */
  required?: boolean;
  /**
   * 載入狀態
   */
  loading?: boolean;
  /**
   * 左側圖示
   */
  leftIcon?: React.ReactNode;
  /**
   * 右側圖示
   */
  rightIcon?: React.ReactNode;
  /**
   * 是否顯示密碼（用於 type="password"）
   */
  showPassword?: boolean;
  /**
   * 密碼顯示狀態改變回調
   */
  onShowPasswordChange?: (show: boolean) => void;
}

/**
 * Input 元件
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type = "text",
    label,
    error,
    success,
    warning,
    description,
    required,
    loading,
    leftIcon,
    rightIcon,
    showPassword,
    onShowPasswordChange,
    id,
    ...props
  }, ref) => {
    // 密碼顯示狀態
    const [internalShowPassword, setInternalShowPassword] = React.useState(false);
    const shouldShowPassword = showPassword ?? internalShowPassword;
    
    // 確定實際的變體狀態
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant;
    
    // 生成唯一 ID
    const inputId = id || React.useId();
    
    // 密碼切換處理
    const handleTogglePassword = () => {
      const newState = !shouldShowPassword;
      setInternalShowPassword(newState);
      onShowPasswordChange?.(newState);
    };

    // 載入指示器
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4 text-text-tertiary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <div className="flex flex-col space-y-2">
        {/* 標籤 */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        {/* 輸入框容器 */}
        <div className="relative">
          {/* 左側圖示 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          
          {/* 輸入框 */}
          <input
            type={type === "password" ? (shouldShowPassword ? "text" : "password") : type}
            className={cn(
              inputVariants({ variant: actualVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || loading || type === "password") && "pr-10",
              className
            )}
            ref={ref}
            id={inputId}
            {...props}
          />
          
          {/* 右側內容 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {/* 載入指示器 */}
            {loading && <LoadingSpinner />}
            
            {/* 密碼顯示切換 */}
            {type === "password" && !loading && (
              <button
                type="button"
                onClick={handleTogglePassword}
                className="text-text-tertiary hover:text-text-primary transition-colors"
                aria-label={shouldShowPassword ? "隱藏密碼" : "顯示密碼"}
              >
                {shouldShowPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* 自訂右側圖示 */}
            {rightIcon && !loading && type !== "password" && (
              <span className="text-text-tertiary">{rightIcon}</span>
            )}
          </div>
        </div>
        
        {/* 訊息文字 */}
        <div className="min-h-[20px]">
          {error && (
            <p className="text-sm text-error flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-sm text-success flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </p>
          )}
          {warning && !error && !success && (
            <p className="text-sm text-warning flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warning}
            </p>
          )}
          {description && !error && !success && !warning && (
            <p className="text-sm text-text-tertiary">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };