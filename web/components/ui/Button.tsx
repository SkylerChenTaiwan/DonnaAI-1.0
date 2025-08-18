/**
 * Button Component - 基於 Radix UI 的專業級按鈕元件
 * 支援多種變體、尺寸和狀態，符合 DonnaAI 設計系統
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 按鈕變體樣式定義
const buttonVariants = cva(
  // 基礎樣式
  "inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      // 變體樣式
      variant: {
        primary: 
          "bg-button-primary hover:bg-button-primary-hover active:bg-button-primary-pressed text-text-inverse shadow-sm hover:shadow-md",
        secondary: 
          "bg-button-secondary hover:bg-button-secondary-hover active:bg-button-secondary-pressed text-text-primary border border-border-light hover:border-border-medium",
        outline: 
          "border border-border-medium bg-transparent hover:bg-background-input text-text-primary hover:text-text-primary",
        ghost: 
          "bg-transparent hover:bg-background-input text-text-primary",
        text: 
          "bg-transparent hover:bg-background-input text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto",
        destructive: 
          "bg-error text-text-inverse hover:bg-error/90 active:bg-error shadow-sm hover:shadow-md"
      },
      // 尺寸樣式
      size: {
        xs: "h-7 px-2 text-xs rounded-sm",
        sm: "h-8 px-3 text-sm rounded-button",
        md: "h-10 px-4 text-sm rounded-button",
        lg: "h-11 px-6 text-base rounded-button",
        xl: "h-12 px-8 text-lg rounded-button",
        icon: "h-10 w-10 rounded-button"
      },
      // 全寬樣式
      fullWidth: {
        true: "w-full",
        false: "w-auto"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false
    }
  }
);

// 按鈕元件 Props 介面
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 是否使用 Slot 元件（允許自訂根元素）
   */
  asChild?: boolean;
  /**
   * 載入狀態
   */
  loading?: boolean;
  /**
   * 載入狀態的文字
   */
  loadingText?: string;
  /**
   * 左側圖示
   */
  leftIcon?: React.ReactNode;
  /**
   * 右側圖示
   */
  rightIcon?: React.ReactNode;
}

/**
 * Button 元件
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // 載入狀態時禁用按鈕
    const isDisabled = disabled || loading;
    
    // 載入指示器
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
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
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        )}
        
        {loading ? loadingText || children : children}
        
        {!loading && rightIcon && (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };