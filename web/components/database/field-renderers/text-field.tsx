/**
 * 文字欄位渲染器
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, TextField } from '@/docs/types/database-table-types';

export const TextFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  error,
  disabled = false,
  readOnly = false
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // 取得文字欄位設定
  const textField = field as TextField;
  const isMultiline = textField.settings?.multiline || false;
  const maxLength = textField.settings?.maxLength;
  const minLength = textField.settings?.minLength;

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [mode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // 檢查長度限制
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    setLocalValue(newValue);
    onChange?.(newValue);
  }, [maxLength, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }, [isMultiline]);

  // 檢視模式
  if (mode === 'view') {
    return (
      <div className="w-full h-full flex items-center px-2 py-1">
        <span 
          className={cn(
            "text-sm truncate",
            value ? "text-gray-900" : "text-gray-400"
          )}
          title={value?.toString()}
        >
          {value?.toString() || ''}
        </span>
      </div>
    );
  }

  // 編輯模式
  const inputProps = {
    ref: inputRef,
    value: localValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    disabled: disabled || readOnly,
    placeholder: field.description || `輸入${field.name}...`,
    className: cn(
      "w-full h-full px-2 py-1 text-sm border-2 rounded focus:outline-none bg-white",
      error 
        ? "border-red-500 focus:border-red-600" 
        : "border-blue-500 focus:border-blue-600",
      disabled && "bg-gray-100 cursor-not-allowed"
    ),
    maxLength,
    minLength
  };

  if (isMultiline) {
    return (
      <div className="w-full h-full relative">
        <textarea
          {...inputProps}
          rows={3}
          style={{ resize: 'none' }}
        />
        {maxLength && (
          <div className="absolute bottom-1 right-1 text-xs text-gray-400">
            {localValue.length}/{maxLength}
          </div>
        )}
        {error && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <input
        {...inputProps}
        type="text"
      />
      {maxLength && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
          {localValue.length}/{maxLength}
        </div>
      )}
      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};