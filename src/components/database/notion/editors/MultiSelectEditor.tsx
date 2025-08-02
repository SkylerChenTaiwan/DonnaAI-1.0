/**
 * 多選編輯器 - Notion 風格的多選標籤編輯器
 */

import React, { useRef, useEffect, useState } from 'react';
import { EditorProps, EDITOR_STYLES } from './types';

interface Tag {
  id: string;
  name: string;
  color: string;
}

// 預設標籤顏色
const TAG_COLORS = [
  { name: 'gray', background: '#F1F1EF', text: '#787774' },
  { name: 'brown', background: '#F4EEEE', text: '#9F6B53' },
  { name: 'orange', background: '#FAEBDD', text: '#D9730D' },
  { name: 'yellow', background: '#FBF3DB', text: '#CB912F' },
  { name: 'green', background: '#EEF3ED', text: '#448361' },
  { name: 'blue', background: '#E7F3F8', text: '#337EA9' },
  { name: 'purple', background: '#F6F3F9', text: '#9065B0' },
  { name: 'pink', background: '#FAF1F5', text: '#C14C8A' },
  { name: 'red', background: '#FDEBEC', text: '#D44C47' },
];

export const MultiSelectEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  column,
  autoFocus = true,
  style,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() => {
    // 解析現有值
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  });

  // 從欄位配置獲取可用選項
  const availableOptions: Tag[] = column.options?.map((opt: any, index: number) => ({
    id: opt.value || opt.id || String(index),
    name: opt.label || opt.name || opt,
    color: opt.color || TAG_COLORS[index % TAG_COLORS.length].name,
  })) || [];

  // 過濾選項
  const filteredOptions = availableOptions.filter(
    option => 
      !selectedTags.some(tag => tag.id === option.id) &&
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 處理點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTags]);

  const handleSave = () => {
    onChange(selectedTags);
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleAddTag(filteredOptions[0]);
      } else if (searchTerm.trim()) {
        // 創建新標籤
        const newTag: Tag = {
          id: `new-${Date.now()}`,
          name: searchTerm.trim(),
          color: TAG_COLORS[selectedTags.length % TAG_COLORS.length].name,
        };
        handleAddTag(newTag);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      onKeyDown(e);
    } else if (e.key === 'Backspace' && !searchTerm && selectedTags.length > 0) {
      // 刪除最後一個標籤
      e.preventDefault();
      setSelectedTags(selectedTags.slice(0, -1));
    }
  };

  const handleAddTag = (tag: Tag) => {
    setSelectedTags([...selectedTags, tag]);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
    inputRef.current?.focus();
  };

  const getTagColor = (colorName: string) => {
    return TAG_COLORS.find(c => c.name === colorName) || TAG_COLORS[0];
  };

  const containerStyles: React.CSSProperties = {
    ...EDITOR_STYLES.container,
    ...style,
    flexDirection: 'column',
    padding: '4px',
    minHeight: '32px',
  };

  const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '4px',
  };

  const tagStyles = (colorName: string): React.CSSProperties => {
    const color = getTagColor(colorName);
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '12px',
      fontWeight: 500,
      background: color.background,
      color: color.text,
      cursor: 'default',
    };
  };

  const removeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '0 2px',
    cursor: 'pointer',
    color: 'inherit',
    fontSize: '14px',
    opacity: 0.6,
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles: React.CSSProperties = {
    ...EDITOR_STYLES.input,
    border: 'none',
    padding: '2px 4px',
    minWidth: '100px',
    flex: 1,
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    background: 'white',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
  };

  const optionStyles: React.CSSProperties = {
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'rgb(55, 53, 47)',
  };

  const optionTagStyles = (colorName: string): React.CSSProperties => {
    const color = getTagColor(colorName);
    return {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '12px',
      fontWeight: 500,
      background: color.background,
      color: color.text,
    };
  };

  const createNewStyles: React.CSSProperties = {
    ...optionStyles,
    color: 'rgba(55, 53, 47, 0.65)',
    borderTop: '1px solid rgba(55, 53, 47, 0.09)',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={containerStyles}>
        {/* 已選標籤 */}
        {selectedTags.length > 0 && (
          <div style={tagsContainerStyles}>
            {selectedTags.map(tag => (
              <div key={tag.id} style={tagStyles(tag.color)}>
                <span>{tag.name}</span>
                <button
                  style={removeButtonStyles}
                  onClick={() => handleRemoveTag(tag.id)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* 輸入框 */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? (column.placeholder || '搜尋或新增標籤...') : ''}
          style={inputStyles}
        />
      </div>

      {/* 下拉選單 */}
      {showDropdown && (searchTerm || filteredOptions.length > 0) && (
        <div style={dropdownStyles}>
          {filteredOptions.map(option => (
            <div
              key={option.id}
              style={optionStyles}
              onClick={() => handleAddTag(option)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={optionTagStyles(option.color)}>{option.name}</span>
            </div>
          ))}
          
          {/* 創建新標籤選項 */}
          {searchTerm.trim() && filteredOptions.length === 0 && (
            <div
              style={createNewStyles}
              onClick={() => {
                const newTag: Tag = {
                  id: `new-${Date.now()}`,
                  name: searchTerm.trim(),
                  color: TAG_COLORS[selectedTags.length % TAG_COLORS.length].name,
                };
                handleAddTag(newTag);
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              創建「{searchTerm}」
            </div>
          )}
        </div>
      )}
    </div>
  );
};