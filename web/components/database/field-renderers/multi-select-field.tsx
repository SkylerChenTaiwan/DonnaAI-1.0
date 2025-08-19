/**
 * 多選欄位渲染器
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { FieldRendererProps, MultiSelectField, SelectOption } from '@/docs/types/database-table-types';

export const MultiSelectFieldRenderer: React.FC<FieldRendererProps> = ({
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
  
  // 取得多選欄位設定
  const multiSelectField = field as MultiSelectField;
  const options = multiSelectField.settings?.options || [];
  const allowCustom = multiSelectField.settings?.allowCustom || false;
  const maxSelections = multiSelectField.settings?.maxSelections;
  const minSelections = multiSelectField.settings?.minSelections;

  // 當前選中的值（陣列）
  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = options.filter(opt => selectedValues.includes(opt.id));

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

  const handleOptionToggle = useCallback((option: SelectOption) => {
    const newSelectedValues = selectedValues.includes(option.id)
      ? selectedValues.filter(id => id !== option.id) // 移除
      : [...selectedValues, option.id]; // 新增

    // 檢查最大選擇數限制
    if (maxSelections && newSelectedValues.length > maxSelections) {
      return;
    }

    onChange?.(newSelectedValues);
    setSearchTerm('');
  }, [selectedValues, maxSelections, onChange]);

  const handleCreateCustom = useCallback(() => {
    if (allowCustom && searchTerm.trim() && 
        (!maxSelections || selectedValues.length < maxSelections)) {
      // 建立新選項
      const newOption: SelectOption = {
        id: `custom_${Date.now()}`,
        label: searchTerm.trim(),
        color: '#gray'
      };
      
      const newSelectedValues = [...selectedValues, newOption.id];
      onChange?.(newSelectedValues);
      setSearchTerm('');
    }
  }, [allowCustom, searchTerm, selectedValues, maxSelections, onChange]);

  const handleRemoveTag = useCallback((optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter(id => id !== optionId);
    onChange?.(newSelectedValues);
  }, [selectedValues, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0) {
          const firstOption = filteredOptions.find(opt => !selectedValues.includes(opt.id));
          if (firstOption) {
            handleOptionToggle(firstOption);
          }
        } else if (allowCustom && searchTerm.trim()) {
          handleCreateCustom();
        }
        break;
      case 'Backspace':
        if (!searchTerm && selectedValues.length > 0) {
          // 刪除最後一個標籤
          const newSelectedValues = selectedValues.slice(0, -1);
          onChange?.(newSelectedValues);
        }
        break;
    }
  }, [filteredOptions, selectedValues, allowCustom, searchTerm, handleOptionToggle, handleCreateCustom, onChange]);

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  // 檢視模式
  if (mode === 'view') {
    return (
      <div className="w-full h-full flex items-center px-2 py-1">
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-full">
            {selectedOptions.slice(0, 3).map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 max-w-20 truncate"
              >
                {option.color && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span className="truncate">{option.label}</span>
              </span>
            ))}
            {selectedOptions.length > 3 && (
              <span className="text-xs text-gray-500">
                +{selectedOptions.length - 3} 更多
              </span>
            )}
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
      {/* 標籤顯示和搜尋輸入 */}
      <div className={cn(
        "flex flex-wrap items-center gap-1 w-full min-h-full p-1 border-2 rounded focus-within:outline-none bg-white",
        error 
          ? "border-red-500 focus-within:border-red-600" 
          : "border-blue-500 focus-within:border-blue-600",
        disabled && "bg-gray-100 cursor-not-allowed"
      )}>
        {/* 已選擇的標籤 */}
        {selectedOptions.map((option) => (
          <span
            key={option.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
          >
            {option.color && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span className="truncate max-w-20">{option.label}</span>
            {!disabled && !readOnly && (
              <button
                type="button"
                onClick={(e) => handleRemoveTag(option.id, e)}
                className="ml-1 hover:bg-blue-200 rounded-full w-3 h-3 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        
        {/* 搜尋輸入 */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled || readOnly}
          placeholder={selectedValues.length === 0 ? (field.description || `選擇${field.name}...`) : ''}
          className="flex-1 min-w-20 outline-none bg-transparent text-sm"
        />
        
        {/* 控制按鈕 */}
        {selectedValues.length > 0 && !disabled && !readOnly && (
          <button
            type="button"
            onClick={handleClearAll}
            className="p-1 text-xs text-gray-400 hover:text-gray-600"
            title="清除全部"
          >
            ✕
          </button>
        )}
      </div>

      {/* 下拉選項列表 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.id);
              const isDisabled = !isSelected && maxSelections && selectedValues.length >= maxSelections;
              
              return (
                <div
                  key={option.id}
                  onClick={() => !isDisabled && handleOptionToggle(option)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer",
                    isSelected && "bg-blue-50 text-blue-600",
                    !isSelected && !isDisabled && "hover:bg-gray-50",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 border-2 rounded flex items-center justify-center",
                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  )}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="text-sm truncate">{option.label}</span>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? '無符合選項' : '無可用選項'}
            </div>
          )}
          
          {/* 建立自訂選項 */}
          {allowCustom && searchTerm.trim() && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase()) && (
            <div
              onClick={handleCreateCustom}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-t border-gray-100",
                (!maxSelections || selectedValues.length < maxSelections)
                  ? "cursor-pointer hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-sm text-blue-600">+ 建立 "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
      
      {/* 選擇數量提示 */}
      {(minSelections || maxSelections) && (
        <div className="absolute -bottom-5 left-0 text-xs text-gray-400">
          {selectedValues.length}{' '}
          {minSelections && maxSelections 
            ? `/ ${minSelections}-${maxSelections} 項`
            : minSelections 
            ? `/ 最少 ${minSelections} 項`
            : `/ 最多 ${maxSelections} 項`
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