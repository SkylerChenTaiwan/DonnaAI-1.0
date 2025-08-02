/**
 * 數字編輯器 - 支援格式化的數字輸入
 */

import React, { useRef, useEffect, useState } from 'react';
import { EditorProps, EDITOR_STYLES } from './types';

export const NumberEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  column,
  autoFocus = true,
  style,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempValue, setTempValue] = useState(value?.toString() || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const validateNumber = (val: string): boolean => {
    if (val === '') return true;
    const num = parseFloat(val);
    return !isNaN(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validateNumber(tempValue)) {
        const numValue = tempValue === '' ? null : parseFloat(tempValue);
        onChange(numValue);
        onBlur();
      } else {
        setError('請輸入有效的數字');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTempValue(value?.toString() || '');
      setError('');
      onBlur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (validateNumber(tempValue)) {
        const numValue = tempValue === '' ? null : parseFloat(tempValue);
        onChange(numValue);
        onKeyDown(e);
      }
    }
    
    onKeyDown(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTempValue(val);
    
    if (val && !validateNumber(val)) {
      setError('請輸入有效的數字');
    } else {
      setError('');
    }
  };

  const handleBlur = () => {
    if (validateNumber(tempValue)) {
      const numValue = tempValue === '' ? null : parseFloat(tempValue);
      onChange(numValue);
    } else {
      setTempValue(value?.toString() || '');
    }
    onBlur();
  };

  return (
    <div style={{ ...EDITOR_STYLES.container, ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={column.placeholder || '0'}
        style={{
          ...EDITOR_STYLES.input,
          borderColor: error ? '#e03e3e' : undefined,
        }}
      />
      {error && (
        <div style={{
          position: 'absolute',
          bottom: -20,
          left: 0,
          fontSize: '12px',
          color: '#e03e3e',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};