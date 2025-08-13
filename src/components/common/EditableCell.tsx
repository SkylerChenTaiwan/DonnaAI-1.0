/**
 * 可編輯儲存格元件
 * 支援不同輸入類型、驗證、格式化
 */

import React, { useState, useRef, useEffect } from 'react';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert  } from 'react-native';
import { AdaptiveInput } from '@/components/adaptive';
import { Icon } from '@/components/common/Icon';

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
  onCancel?: () => void;
  onTab?: (shift: boolean) => void;
  autoFocus?: boolean;
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
  onCancel,
  onTab,
  autoFocus = false }) => {
  const [editValue, setEditValue] = useState(String(value || ''));
  const inputRef = useRef<AdaptiveInput>(null);

  // 當開始編輯時聚焦輸入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      setEditValue(String(value || ''));
    }
  }, [isEditing, value]);
  
  // 自動聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

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
    if (onCancel) {
      onCancel();
    } else {
      onFinishEdit(value); // 恢復原值
    }
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
  
  // 處理鍵盤事件
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.nativeEvent.key === 'Tab') {
      e.preventDefault();
      if (onTab) {
        handleSubmitEdit();
        onTab(e.shiftKey);
      }
    }
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <AdaptiveInput
          ref={inputRef}
          style={StyleSheet.flatten([
            styles.editInput,
            inputType === 'multiline' && styles.multilineInput,
            error && styles.inputError,
          ])}
          value={editValue}
          onChangeText={setEditValue}
          onSubmitEditing={handleSubmitEdit}
          onBlur={handleSubmitEdit}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={getKeyboardType()}
          multiline={inputType === 'multiline'}
          maxLength={maxLength}
          selectTextOnFocus
          returnKeyType={inputType === 'multiline' ? 'default' : 'done'}
          autoFocus={autoFocus}
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        styles.cellContainer,
        error && styles.cellError,
      ])}
      onPress={disabled ? onPress : onStartEdit}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      delayPressIn={disabled ? 0 : 100} // 漂浮編輯框更直觀，減少延遲
    >
      <View style={styles.cellContent}>
        {render ? (
          render(value, item)
        ) : (
          <Text 
            style={StyleSheet.flatten([
              styles.cellText,
              error && styles.cellTextError,
            ])} 
            numberOfLines={inputType === 'multiline' ? 3 : 1}
          >
            {formatDisplayValue(value)}
          </Text>
        )}
        {/* 編輯圖標已移除以簡化介面 */}
      </View>
      {error && (
        <View style={styles.errorIndicator}>
          <Icon name="warning" size={12} color="#DC3545" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  editContainer: {
    flex: 1,
    position: 'relative' },
  editInput: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
    color: '#37352f',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    outline: 'none' },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top' },
  inputError: {
    borderColor: '#DC3545' },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
    fontWeight: '500' },
  cellContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 40,
    justifyContent: 'center' },
  cellError: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 4 },
  cellContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  cellText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1 },
  cellTextError: {
    color: '#DC3545' },
  errorIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center' } });