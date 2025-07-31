/**
 * Notion 風格可編輯儲存格元件
 */

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NotionCellProps } from '../shared/tableTypes';

export const NotionTableCell: React.FC<NotionCellProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // 當 value 從外部更新時，同步 editValue
  useEffect(() => {
    setEditValue(value);
    setError(null);
  }, [value]);

  // 進入編輯模式
  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
    
    // 聚焦輸入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 完成編輯
  const handleFinishEdit = async () => {
    if (!isEditing) return;

    try {
      // 驗證輸入值
      const validationError = validateValue(editValue, type);
      if (validationError) {
        setError(validationError);
        return;
      }

      // 格式化值
      const formattedValue = formatValue(editValue, type);
      
      // 調用更新回調
      if (onChange && formattedValue !== value) {
        await onChange(formattedValue);
      }

      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('更新儲存格失敗:', err);
      setError('儲存失敗，請重試');
      // 不退出編輯模式，讓用戶可以重試
    }
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  // 處理鍵盤事件
  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && type !== 'multiline') {
      handleFinishEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 渲染顯示模式
  const renderDisplayMode = () => {
    const displayValue = formatDisplayValue(value, type);
    const isEmpty = !displayValue || displayValue.trim() === '';

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          isEmpty && styles.emptyCellContainer,
          disabled && styles.disabledCell,
        ]}
        onPress={handleStartEdit}
        disabled={disabled}
      >
        <Text style={[
          styles.cellText,
          isEmpty && styles.placeholderText,
        ]}>
          {isEmpty ? placeholder || '輸入...' : displayValue}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染編輯模式
  const renderEditMode = () => {
    if (type === 'select') {
      return renderSelectInput();
    }

    return (
      <View style={styles.editContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            type === 'multiline' && styles.multilineInput,
            error && styles.inputError,
          ]}
          value={editValue?.toString() || ''}
          onChangeText={setEditValue}
          onBlur={handleFinishEdit}
          onKeyPress={handleKeyPress as any}
          placeholder={placeholder}
          keyboardType={getKeyboardType(type)}
          multiline={type === 'multiline'}
          numberOfLines={type === 'multiline' ? 3 : 1}
          autoFocus
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  };

  // 渲染下拉選單
  const renderSelectInput = () => {
    return (
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.selectOption,
              editValue === option && styles.selectedOption,
            ]}
            onPress={() => {
              setEditValue(option);
              setTimeout(() => handleFinishEdit(), 100);
            }}
          >
            <Text style={[
              styles.selectOptionText,
              editValue === option && styles.selectedOptionText,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return isEditing ? renderEditMode() : renderDisplayMode();
};

/**
 * 驗證輸入值
 */
const validateValue = (value: any, type: string): string | null => {
  if (!value || value.toString().trim() === '') {
    return null; // 空值通常是允許的
  }

  const strValue = value.toString().trim();

  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strValue)) {
        return '請輸入有效的電子郵件地址';
      }
      break;

    case 'phone':
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(strValue)) {
        return '請輸入有效的電話號碼';
      }
      break;

    case 'number':
      if (isNaN(Number(strValue))) {
        return '請輸入有效的數字';
      }
      break;
  }

  return null;
};

/**
 * 格式化儲存值
 */
const formatValue = (value: any, type: string): any => {
  if (!value || value.toString().trim() === '') {
    return '';
  }

  const strValue = value.toString().trim();

  switch (type) {
    case 'number':
      return Number(strValue);
    case 'email':
      return strValue.toLowerCase();
    default:
      return strValue;
  }
};

/**
 * 格式化顯示值
 */
const formatDisplayValue = (value: any, type: string): string => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value.toString();
    default:
      return value.toString();
  }
};

/**
 * 取得鍵盤類型
 */
const getKeyboardType = (type: string) => {
  switch (type) {
    case 'number':
      return 'numeric';
    case 'email':
      return 'email-address';
    case 'phone':
      return 'phone-pad';
    default:
      return 'default';
  }
};

const styles = StyleSheet.create({
  cell: {
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    borderRadius: 3,
    cursor: 'pointer' as any,
  },
  cellText: {
    fontSize: 14,
    color: '#37352f',
    lineHeight: 20,
  },
  emptyCellContainer: {
    opacity: 0.6,
  },
  placeholderText: {
    color: '#9b9b9b',
    fontStyle: 'italic',
  },
  disabledCell: {
    opacity: 0.5,
    cursor: 'not-allowed' as any,
  },
  editContainer: {
    position: 'relative',
    minWidth: 120,
  },
  input: {
    fontSize: 14,
    color: '#37352f',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0f7b0f',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
    outlineWidth: 0,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e03e3e',
  },
  errorText: {
    fontSize: 12,
    color: '#e03e3e',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  selectContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9e9e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 200,
    minWidth: 150,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1ef',
  },
  selectedOption: {
    backgroundColor: '#f1f1ef',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#37352f',
  },
  selectedOptionText: {
    fontWeight: '500',
  },
});