/**
 * 可編輯儲存格元件
 * 支援不同輸入類型、驗證、格式化
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface EditableCellProps {
  value: any;
  isEditing: boolean;
  error?: string;
  onStartEdit: () => void;
  onFinishEdit: (value: any) => void;
  onPress?: () => void;
  render?: (value: any, item: any) => React.ReactNode;
  item?: any;
  inputType?: 'text' | 'number' | 'email' | 'phone' | 'multiline';
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  isEditing,
  error,
  onStartEdit,
  onFinishEdit,
  onPress,
  render,
  item,
  inputType = 'text',
  placeholder = '',
  maxLength,
  disabled = false,
}) => {
  const [editValue, setEditValue] = useState(String(value || ''));
  const inputRef = useRef<TextInput>(null);

  // 當開始編輯時聚焦輸入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      setEditValue(String(value || ''));
    }
  }, [isEditing, value]);

  // 處理提交編輯
  const handleSubmitEdit = () => {
    let processedValue: any = editValue;

    // 根據輸入類型處理值
    switch (inputType) {
      case 'number':
        const numValue = parseFloat(editValue);
        processedValue = isNaN(numValue) ? editValue : numValue;
        break;
      case 'email':
        processedValue = editValue.trim().toLowerCase();
        break;
      case 'phone':
        // 移除非數字字元（保留 + 和 -）
        processedValue = editValue.replace(/[^\d+\-\s()]/g, '');
        break;
      default:
        processedValue = editValue.trim();
    }

    onFinishEdit(processedValue);
  };

  // 處理取消編輯
  const handleCancelEdit = () => {
    setEditValue(String(value || ''));
    onFinishEdit(value); // 恢復原值
  };

  // 格式化顯示值
  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    
    switch (inputType) {
      case 'number':
        return typeof val === 'number' ? val.toLocaleString() : String(val);
      case 'phone':
        // 簡單的電話號碼格式化
        const phoneStr = String(val).replace(/\D/g, '');
        if (phoneStr.length === 10) {
          return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(2, 6)}-${phoneStr.slice(6)}`;
        }
        return String(val);
      default:
        return String(val);
    }
  };

  // 取得鍵盤類型
  const getKeyboardType = () => {
    switch (inputType) {
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

  if (isEditing) {
    return (
      <View style={styles.editingContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            inputType === 'multiline' && styles.multilineInput,
            error && styles.inputError,
          ]}
          value={editValue}
          onChangeText={setEditValue}
          onSubmitEditing={handleSubmitEdit}
          onBlur={handleSubmitEdit}
          placeholder={placeholder}
          keyboardType={getKeyboardType()}
          multiline={inputType === 'multiline'}
          maxLength={maxLength}
          selectTextOnFocus
          returnKeyType="done"
        />
        <View style={styles.editingButtons}>
          <TouchableOpacity
            style={styles.editingButton}
            onPress={handleSubmitEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={16} color="#28A745" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editingButton}
            onPress={handleCancelEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#DC3545" />
          </TouchableOpacity>
        </View>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.cellContainer,
        error && styles.cellError,
      ]}
      onPress={disabled ? onPress : onStartEdit}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      delayPressIn={disabled ? 0 : 200} // 長按才進入編輯模式，避免誤觸
    >
      <View style={styles.cellContent}>
        {render ? (
          render(value, item)
        ) : (
          <Text 
            style={[
              styles.cellText,
              error && styles.cellTextError,
            ]} 
            numberOfLines={inputType === 'multiline' ? 3 : 1}
          >
            {formatDisplayValue(value)}
          </Text>
        )}
        {!disabled && (
          <View style={styles.editIcon}>
            <Ionicons 
              name="create-outline" 
              size={12} 
              color="#999999" 
            />
          </View>
        )}
      </View>
      {error && (
        <View style={styles.errorIndicator}>
          <Ionicons name="warning" size={12} color="#DC3545" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  editingContainer: {
    position: 'relative',
    minHeight: 40,
  },
  input: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    minHeight: 40,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  editingButtons: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  editingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
    fontWeight: '500',
  },
  cellContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 40,
    justifyContent: 'center',
    paddingRight: 20, // 為編輯圖標留空間
  },
  cellError: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 4,
  },
  cellContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cellText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  cellTextError: {
    color: '#DC3545',
  },
  editIcon: {
    position: 'absolute',
    top: 4,
    right: 0,
    opacity: 0.5,
  },
  errorIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});