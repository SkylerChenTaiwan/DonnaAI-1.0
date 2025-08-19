/**
 * 數字欄位渲染器
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, NumberField } from '@/docs/types/database-table-types';

export const NumberFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  error,
  disabled = false,
  readOnly = false
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 取得數字欄位設定
  const numberField = field as NumberField;
  const min = numberField.settings?.min;
  const max = numberField.settings?.max;
  const step = numberField.settings?.step || 1;
  const unit = numberField.settings?.unit;
  const format = numberField.settings?.format;

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  const formatNumber = useCallback((num: number): string => {
    if (isNaN(num)) return '';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD'
        }).format(num);
      
      case 'percentage':
        return `${num}%`;
      
      case 'decimal':
        return num.toLocaleString('zh-TW', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      
      default:
        return num.toLocaleString('zh-TW');
    }
  }, [format]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 允許空值和數字輸入
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue);
      
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        // 檢查範圍
        if ((min !== undefined && numValue < min) || 
            (max !== undefined && numValue > max)) {
          return;
        }
        onChange?.(numValue);
      } else if (newValue === '') {
        onChange?.(null);
      }
    }
  }, [min, max, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 允許方向鍵、刪除鍵等
    const allowedKeys = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape'
    ];
    
    if (allowedKeys.includes(e.key)) {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
      return;
    }
    
    // 允許數字、小數點、負號
    if (!/[\d\.\-]/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  const handleBlur = useCallback(() => {
    // 修正格式
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      setLocalValue(numValue.toString());
    }
  }, [localValue]);

  // 檢視模式
  if (mode === 'view') {
    const numValue = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
    
    return (
      <div className="w-full h-full flex items-center justify-end px-2 py-1">
        <span 
          className={cn(
            "text-sm font-mono",
            !isNaN(numValue) ? "text-gray-900" : "text-gray-400"
          )}
        >
          {!isNaN(numValue) ? formatNumber(numValue) : ''}
          {unit && !isNaN(numValue) && ` ${unit}`}
        </span>
      </div>
    );
  }

  // 編輯模式
  return (
    <div className="w-full h-full relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled || readOnly}
        placeholder={field.description || `輸入${field.name}...`}
        min={min}
        max={max}
        step={step}
        className={cn(
          "w-full h-full px-2 py-1 text-sm text-right font-mono border-2 rounded focus:outline-none bg-white",
          error 
            ? "border-red-500 focus:border-red-600" 
            : "border-blue-500 focus:border-blue-600",
          disabled && "bg-gray-100 cursor-not-allowed"
        )}
      />
      
      {/* 單位顯示 */}
      {unit && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
          {unit}
        </div>
      )}
      
      {/* 範圍提示 */}
      {(min !== undefined || max !== undefined) && (
        <div className="absolute -bottom-5 left-0 text-xs text-gray-400">
          {min !== undefined && max !== undefined 
            ? `範圍: ${min} - ${max}`
            : min !== undefined 
            ? `最小: ${min}`
            : `最大: ${max}`
          }
        </div>
      )}
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="absolute -bottom-5 right-0 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};