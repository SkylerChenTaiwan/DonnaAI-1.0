/**
 * Select Component - 基於 Radix UI Select 的下拉選擇元件
 * 支援搜尋、多選、分組和自訂選項，符合 DonnaAI 設計系統
 */

"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

// Select 觸發器變體樣式
const selectTriggerVariants = cva(
  // 基礎樣式
  "flex h-10 w-full items-center justify-between rounded-button border border-border-light bg-background-input px-3 py-2 text-sm ring-offset-background placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      // 狀態變體
      variant: {
        default: "hover:border-border-medium",
        success: "border-success focus:ring-success",
        error: "border-error focus:ring-error",
        warning: "border-warning focus:ring-warning"
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

// 選項介面
export interface SelectOption {
  /**
   * 選項值
   */
  value: string;
  /**
   * 顯示標籤
   */
  label: string;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 圖示
   */
  icon?: React.ReactNode;
  /**
   * 描述
   */
  description?: string;
}

// 選項分組介面
export interface SelectOptionGroup {
  /**
   * 分組標籤
   */
  label: string;
  /**
   * 分組選項
   */
  options: SelectOption[];
}

// Select 元件 Props
export interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
  /**
   * 選項陣列或分組陣列
   */
  options: (SelectOption | SelectOptionGroup)[];
  /**
   * 選中的值
   */
  value?: string;
  /**
   * 預設選中值
   */
  defaultValue?: string;
  /**
   * 值改變回調
   */
  onValueChange?: (value: string) => void;
  /**
   * 佔位符文字
   */
  placeholder?: string;
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
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否支援搜尋
   */
  searchable?: boolean;
  /**
   * 搜尋佔位符
   */
  searchPlaceholder?: string;
  /**
   * 無搜尋結果時的文字
   */
  emptyMessage?: string;
  /**
   * 是否載入中
   */
  loading?: boolean;
  /**
   * 載入文字
   */
  loadingMessage?: string;
  /**
   * 自訂 className
   */
  className?: string;
  /**
   * 選項容器最大高度
   */
  maxHeight?: number;
}

/**
 * Select 主元件
 */
const Select = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectProps
>(({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "請選擇...",
  label,
  error,
  success,
  warning,
  description,
  required,
  disabled,
  searchable = false,
  searchPlaceholder = "搜尋...",
  emptyMessage = "無符合結果",
  loading = false,
  loadingMessage = "載入中...",
  className,
  maxHeight = 300,
  variant,
  size,
  ...props
}, ref) => {
  // 搜尋狀態
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  
  // 確定實際的變體狀態
  const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant;
  
  // 生成唯一 ID
  const selectId = React.useId();
  
  // 過濾選項
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue) return options;
    
    return options.reduce((acc, item) => {
      if ('options' in item) {
        // 分組選項
        const filteredGroupOptions = item.options.filter(option =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          option.value.toLowerCase().includes(searchValue.toLowerCase())
        );
        if (filteredGroupOptions.length > 0) {
          acc.push({ ...item, options: filteredGroupOptions });
        }
      } else {
        // 單個選項
        if (item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.value.toLowerCase().includes(searchValue.toLowerCase())) {
          acc.push(item);
        }
      }
      return acc;
    }, [] as typeof options);
  }, [options, searchValue, searchable]);
  
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
  
  // 渲染選項
  const renderOption = (option: SelectOption) => (
    <SelectPrimitive.Item
      key={option.value}
      value={option.value}
      disabled={option.disabled}
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-background-input focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {option.icon && (
          <span className="flex-shrink-0 text-text-tertiary">
            {option.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <SelectPrimitive.ItemText className="truncate">
            {option.label}
          </SelectPrimitive.ItemText>
          {option.description && (
            <div className="text-xs text-text-tertiary truncate">
              {option.description}
            </div>
          )}
        </div>
      </div>
    </SelectPrimitive.Item>
  );
  
  // 渲染內容
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-text-tertiary">{loadingMessage}</span>
        </div>
      );
    }
    
    if (filteredOptions.length === 0) {
      return (
        <div className="py-4 text-center text-sm text-text-tertiary">
          {emptyMessage}
        </div>
      );
    }
    
    return filteredOptions.map((item, index) => {
      if ('options' in item) {
        // 分組選項
        return (
          <React.Fragment key={item.label}>
            <SelectPrimitive.Group>
              <SelectPrimitive.Label className="py-1.5 pl-8 pr-2 text-sm font-semibold text-text-secondary">
                {item.label}
              </SelectPrimitive.Label>
              {item.options.map(renderOption)}
            </SelectPrimitive.Group>
            {index < filteredOptions.length - 1 && (
              <SelectPrimitive.Separator className="h-px bg-border-light" />
            )}
          </React.Fragment>
        );
      } else {
        // 單個選項
        return renderOption(item);
      }
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* 標籤 */}
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        onOpenChange={setIsOpen}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            selectTriggerVariants({ variant: actualVariant, size }),
            className
          )}
          id={selectId}
          {...props}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            )}
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border-light bg-background-surface text-text-primary shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            position="popper"
            sideOffset={4}
          >
            {/* 搜尋框 */}
            {searchable && isOpen && (
              <div className="p-2">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-button bg-background-input focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
              <ChevronUpIcon className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>
            
            <SelectPrimitive.Viewport
              className="p-1"
              style={{ maxHeight }}
            >
              {renderContent()}
            </SelectPrimitive.Viewport>
            
            <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
              <ChevronDownIcon className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      
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
});

Select.displayName = "Select";

export { Select, selectTriggerVariants };