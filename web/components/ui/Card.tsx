/**
 * Card Component - 基於 DonnaAI 設計系統的卡片元件
 * 支援多種變體、陰影和互動狀態
 */

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 卡片變體樣式定義
const cardVariants = cva(
  // 基礎樣式
  "rounded-md text-text-primary transition-all duration-fast border border-border-light",
  {
    variants: {
      // 變體樣式
      variant: {
        default: "bg-background-surface",
        elevated: "bg-background-elevated",
        outlined: "bg-background-surface border-border-medium",
        ghost: "bg-transparent border-transparent"
      },
      // 陰影樣式
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl"
      },
      // 內邊距
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8"
      },
      // 互動樣式
      interactive: {
        none: "",
        hover: "hover:shadow-md hover:border-border-medium cursor-pointer",
        press: "hover:shadow-md hover:border-border-medium active:scale-[0.98] cursor-pointer",
        focus: "hover:shadow-md hover:border-border-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 cursor-pointer"
      }
    },
    defaultVariants: {
      variant: "default",
      shadow: "sm",
      padding: "md",
      interactive: "none"
    }
  }
);

// 卡片標題變體樣式
const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3 pb-0",
        md: "p-4 pb-0",
        lg: "p-6 pb-0",
        xl: "p-8 pb-0"
      }
    },
    defaultVariants: {
      padding: "md"
    }
  }
);

// 卡片內容變體樣式
const cardContentVariants = cva(
  "",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3 pt-0",
        md: "p-4 pt-0",
        lg: "p-6 pt-0",
        xl: "p-8 pt-0"
      }
    },
    defaultVariants: {
      padding: "md"
    }
  }
);

// 卡片腳部變體樣式
const cardFooterVariants = cva(
  "flex items-center",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3 pt-0",
        md: "p-4 pt-0",
        lg: "p-6 pt-0",
        xl: "p-8 pt-0"
      }
    },
    defaultVariants: {
      padding: "md"
    }
  }
);

// Card 元件 Props
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * 是否可選中
   */
  selectable?: boolean;
  /**
   * 是否已選中
   */
  selected?: boolean;
  /**
   * 選中狀態改變回調
   */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * 是否正在載入
   */
  loading?: boolean;
}

// CardHeader 元件 Props
export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

// CardTitle 元件 Props
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

// CardDescription 元件 Props
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

// CardContent 元件 Props
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

// CardFooter 元件 Props
export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

/**
 * Card 主元件
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant,
    shadow,
    padding,
    interactive,
    selectable = false,
    selected = false,
    onSelectedChange,
    loading = false,
    children,
    onClick,
    ...props
  }, ref) => {
    // 處理點擊事件
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (selectable) {
        onSelectedChange?.(!selected);
      }
      onClick?.(event);
    };

    // 載入狀態覆蓋
    const LoadingOverlay = () => (
      <div className="absolute inset-0 bg-background-surface/50 rounded-md flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-primary-500"
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
      </div>
    );

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, shadow, padding, interactive }),
          selectable && !selected && "hover:border-primary-300",
          selected && "border-primary-500 ring-2 ring-primary-500 ring-opacity-20",
          loading && "relative",
          className
        )}
        onClick={handleClick}
        role={selectable ? "button" : undefined}
        tabIndex={selectable ? 0 : undefined}
        aria-pressed={selectable ? selected : undefined}
        {...props}
      >
        {children}
        {loading && <LoadingOverlay />}
      </div>
    );
  }
);

/**
 * CardHeader 元件
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ padding }), className)}
      {...props}
    />
  )
);

/**
 * CardTitle 元件
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
);

/**
 * CardDescription 元件
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    >
      {children}
    </p>
  )
);

/**
 * CardContent 元件
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    />
  )
);

/**
 * CardFooter 元件
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ padding }), className)}
      {...props}
    />
  )
);

// 設定 displayName
Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants
};