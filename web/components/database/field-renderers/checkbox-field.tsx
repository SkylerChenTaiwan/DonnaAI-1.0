/**
 * 核取方塊欄位渲染器
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, CheckboxField } from '@/docs/types/database-table-types';

export const CheckboxFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  error,
  disabled = false,
  readOnly = false
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(Boolean(value));
  
  // 取得核取方塊欄位設定
  const checkboxField = field as CheckboxField;
  const checkedLabel = checkboxField.settings?.checkedLabel || '是';
  const uncheckedLabel = checkboxField.settings?.uncheckedLabel || '否';
  const checkedIcon = checkboxField.settings?.checkedIcon || '✓';
  const uncheckedIcon = checkboxField.settings?.uncheckedIcon || '';

  useEffect(() => {
    setIsChecked(Boolean(value));
  }, [value]);

  const handleToggle = useCallback(() => {
    if (disabled || readOnly) return;
    
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  }, [isChecked, disabled, readOnly, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  // 檢視模式
  if (mode === 'view') {
    return (
      <div className="w-full h-full flex items-center justify-center px-2 py-1">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
            isChecked 
              ? "bg-blue-600 border-blue-600 text-white" 
              : "bg-white border-gray-300"
          )}>
            {isChecked && (
              <span className="text-sm font-bold">
                {checkedIcon}
              </span>
            )}
          </div>
          
          {/* 可選的標籤顯示 */}
          <span className="text-sm text-gray-700">
            {isChecked ? checkedLabel : uncheckedLabel}
          </span>
        </div>
      </div>
    );
  }

  // 編輯模式
  return (
    <div className="w-full h-full relative">
      <div className="flex items-center justify-center h-full">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            className={cn(
              "w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              isChecked 
                ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                : "bg-white border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed",
              readOnly && "cursor-not-allowed",
              error && "border-red-500"
            )}
          >
            {isChecked && (
              <span className={cn(
                "font-bold transition-all duration-200",
                isChecked ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )}>
                {checkedIcon}
              </span>
            )}
          </div>
          
          {/* 標籤文字 */}
          <span className={cn(
            "text-sm select-none transition-colors",
            isChecked ? "text-blue-600 font-medium" : "text-gray-600",
            disabled && "opacity-50"
          )}>
            {isChecked ? checkedLabel : uncheckedLabel}
          </span>
        </label>
      </div>
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500">
          {error}
        </div>
      )}
      
      {/* 隱藏的原生 input（用於表單提交和無障礙功能） */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
        disabled={disabled || readOnly}
        className="sr-only"
        aria-label={field.name}
      />
    </div>
  );
};