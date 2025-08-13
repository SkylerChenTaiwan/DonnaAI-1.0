/**
 * 選擇編輯器 - 下拉選單編輯器
 */

import React, { useRef, useEffect, useState } from 'react';
import { EditorProps, EDITOR_STYLES } from './types';

export const SelectEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  column,
  autoFocus = true,
  style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = column.options || [];
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
    
    // 設定初始選中項
    const currentIndex = options.findIndex(opt => opt.value === value);
    if (currentIndex >= 0) {
      setSelectedIndex(currentIndex);
    }
  }, [autoFocus, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        Math.min(prev + 1, filteredOptions.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        onChange(filteredOptions[selectedIndex].value);
        onBlur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBlur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        onChange(filteredOptions[selectedIndex].value);
      }
      onKeyDown(e);
    }
  };

  const handleOptionClick = (option: any) => {
    onChange(option.value);
    onBlur();
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onBlur();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ ...EDITOR_STYLES.container, ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setSelectedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        placeholder={`搜尋${column.title}...`}
        style={EDITOR_STYLES.input}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div style={EDITOR_STYLES.dropdown}>
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option)}
              style={{
                ...EDITOR_STYLES.option,
                ...(index === selectedIndex ? EDITOR_STYLES.optionSelected : {}) }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {option.color && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    marginRight: 8 }}
                />
              )}
              {option.label}
            </div>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && searchValue && (
        <div style={EDITOR_STYLES.dropdown}>
          <div style={{ ...EDITOR_STYLES.option, color: '#787774' }}>
            沒有找到選項
          </div>
        </div>
      )}
    </div>
  );
};