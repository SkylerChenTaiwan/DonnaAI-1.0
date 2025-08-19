/**
 * 選擇欄位渲染器
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, SelectField, SelectOption } from '@/docs/types/database-table-types';

export const SelectFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  mode,
  onChange,
  error,
  disabled = false,
  readOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 取得選擇欄位設定
  const selectField = field as SelectField;
  const options = selectField.settings?.options || [];
  const allowCustom = selectField.settings?.allowCustom || false;

  // 當前選中的選項
  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    if (mode === 'edit') {
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setIsOpen(false);
    }
  }, [mode]);

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 篩選選項
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleOptionSelect = useCallback((option: SelectOption) => {
    onChange?.(option.id);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  const handleCreateCustom = useCallback(() => {
    if (allowCustom && searchTerm.trim()) {
      // 建立新選項
      const newOption: SelectOption = {
        id: `custom_${Date.now()}`,
        label: searchTerm.trim(),
        color: '#gray'
      };
      onChange?.(newOption.id);
      setIsOpen(false);
      setSearchTerm('');
    }
  }, [allowCustom, searchTerm, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleOptionSelect(filteredOptions[0]);
        } else if (allowCustom && searchTerm.trim()) {
          handleCreateCustom();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        // TODO: 實作鍵盤導航
        break;
      case 'ArrowUp':
        e.preventDefault();
        // TODO: 實作鍵盤導航
        break;
    }
  }, [filteredOptions, allowCustom, searchTerm, handleOptionSelect, handleCreateCustom]);

  const handleClear = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  // 檢視模式
  if (mode === 'view') {
    return (
      <div className="w-full h-full flex items-center px-2 py-1">
        {selectedOption ? (
          <div className="flex items-center gap-2">
            {selectedOption.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            <span className="text-sm text-gray-900 truncate">
              {selectedOption.label}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </div>
    );
  }

  // 編輯模式
  return (
    <div ref={selectRef} className="w-full h-full relative">
      {/* 當前值顯示/搜尋輸入 */}
      <div className="flex items-center w-full h-full">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || selectedOption?.label || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled || readOnly}
          placeholder={field.description || `選擇${field.name}...`}
          className={cn(
            "flex-1 px-2 py-1 text-sm border-2 rounded-l focus:outline-none bg-white",
            error 
              ? "border-red-500 focus:border-red-600" 
              : "border-blue-500 focus:border-blue-600",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
        />
        
        {/* 控制按鈕 */}
        <div className="flex border-2 border-l-0 border-blue-500 rounded-r overflow-hidden">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || readOnly}
              className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              title="清除"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || readOnly}
            className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            title="展開選項"
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 下拉選項列表 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50",
                  value === option.id && "bg-blue-50 text-blue-600"
                )}
              >
                {option.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span className="text-sm truncate">{option.label}</span>
                {value === option.id && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? '無符合選項' : '無可用選項'}
            </div>
          )}
          
          {/* 建立自訂選項 */}
          {allowCustom && searchTerm.trim() && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase()) && (
            <div
              onClick={handleCreateCustom}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-100"
            >
              <span className="text-sm text-blue-600">+ 建立 "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};