/**
 * 日期欄位渲染器
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, DateField } from '@/docs/types/database-table-types';

export const DateFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  error,
  disabled = false,
  readOnly = false
}) => {
  const [localValue, setLocalValue] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 取得日期欄位設定
  const dateField = field as DateField;
  const includeTime = dateField.settings?.includeTime || false;
  const minDate = dateField.settings?.minDate;
  const maxDate = dateField.settings?.maxDate;

  useEffect(() => {
    if (value instanceof Date) {
      const dateStr = includeTime 
        ? value.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
        : value.toISOString().slice(0, 10); // YYYY-MM-DD
      setLocalValue(dateStr);
    } else if (typeof value === 'string' && value) {
      setLocalValue(value.slice(0, includeTime ? 16 : 10));
    } else {
      setLocalValue('');
    }
  }, [value, includeTime]);

  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const formatDateForDisplay = useCallback((date: Date): string => {
    if (includeTime) {
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }, [includeTime]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (newValue) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        // 檢查日期範圍
        if (minDate && date < new Date(minDate)) {
          return;
        }
        if (maxDate && date > new Date(maxDate)) {
          return;
        }
        onChange?.(date);
      }
    } else {
      onChange?.(null);
    }
  }, [minDate, maxDate, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      setIsPickerOpen(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange?.(null);
  }, [onChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    const dateStr = includeTime 
      ? today.toISOString().slice(0, 16)
      : today.toISOString().slice(0, 10);
    setLocalValue(dateStr);
    onChange?.(today);
  }, [includeTime, onChange]);

  // 檢視模式
  if (mode === 'view') {
    return (
      <div className="w-full h-full flex items-center px-2 py-1">
        <span 
          className={cn(
            "text-sm",
            value ? "text-gray-900" : "text-gray-400"
          )}
        >
          {value instanceof Date ? formatDateForDisplay(value) : ''}
        </span>
      </div>
    );
  }

  // 編輯模式
  return (
    <div className="w-full h-full relative">
      <div className="flex items-center w-full h-full">
        <input
          ref={inputRef}
          type={includeTime ? "datetime-local" : "date"}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || readOnly}
          className={cn(
            "flex-1 px-2 py-1 text-sm border-2 rounded-l focus:outline-none bg-white",
            error 
              ? "border-red-500 focus:border-red-600" 
              : "border-blue-500 focus:border-blue-600",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
          min={minDate ? (typeof minDate === 'string' ? minDate : minDate.toISOString().slice(0, 10)) : undefined}
          max={maxDate ? (typeof maxDate === 'string' ? maxDate : maxDate.toISOString().slice(0, 10)) : undefined}
        />
        
        {/* 快速操作按鈕 */}
        <div className="flex border-2 border-l-0 border-blue-500 rounded-r overflow-hidden">
          <button
            type="button"
            onClick={handleToday}
            disabled={disabled || readOnly}
            className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            title="今天"
          >
            今
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || readOnly}
            className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
            title="清除"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* 日期範圍提示 */}
      {(minDate || maxDate) && (
        <div className="absolute -bottom-5 left-0 text-xs text-gray-400">
          {minDate && maxDate 
            ? `範圍: ${typeof minDate === 'string' ? minDate : minDate.toISOString().slice(0, 10)} - ${typeof maxDate === 'string' ? maxDate : maxDate.toISOString().slice(0, 10)}`
            : minDate 
            ? `最早: ${typeof minDate === 'string' ? minDate : minDate.toISOString().slice(0, 10)}`
            : `最晚: ${typeof maxDate === 'string' ? maxDate : maxDate.toISOString().slice(0, 10)}`
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