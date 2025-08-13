/**
 * 文字編輯器 - 基本的文字輸入編輯器
 */

import React, { useRef, useEffect, useState } from 'react';
import { EditorProps, EDITOR_STYLES } from './types';

export const TextEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  column,
  autoFocus = true,
  style }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempValue, setTempValue] = useState(value || '');
  
  console.log('TextEditor 渲染:', { value, tempValue, column });

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('按鍵:', e.key, '暫存值:', tempValue);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter 鍵 - 儲存值:', tempValue);
      onChange(tempValue);
      onBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTempValue(value || '');
      onBlur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      console.log('Tab 鍵 - 儲存值:', tempValue);
      onChange(tempValue);
      onKeyDown(e);
    }
    
    // 傳遞其他按鍵事件
    onKeyDown(e);
  };

  const handleBlur = () => {
    console.log('編輯器失去焦點 - 儲存值:', tempValue);
    onChange(tempValue);
    onBlur();
  };

  return (
    <div style={{ ...EDITOR_STYLES.container, ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={column.placeholder || `輸入${column.title}...`}
        style={EDITOR_STYLES.input}
      />
    </div>
  );
};