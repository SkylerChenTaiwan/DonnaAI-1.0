import React, { useState, useCallback, useEffect, useRef } from 'react';

interface NotionTableCellProps {
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: any }>;
}

export const NotionTableCell: React.FC<NotionTableCellProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  autoFocus = false,
  disabled = false,
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setIsEditing(true);
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSave = useCallback(() => {
    onChange(localValue);
    setIsEditing(false);
  }, [localValue, onChange]);

  const handleCancel = useCallback(() => {
    setLocalValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback(() => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [disabled, isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="notion-cell-input"
        type={type === 'number' ? 'number' : 'text'}
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div 
      className="notion-cell-content"
      onClick={handleClick}
      title="點擊編輯"
    >
      {value || <span className="notion-cell-placeholder">{placeholder}</span>}
    </div>
  );
};