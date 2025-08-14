/**
 * 搜尋欄元件
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View,
  TouchableOpacity,
  StyleSheet,
  TextInputProps  } from 'react-native';
import {
  AdaptiveInput
} from '@/components/adaptive';
import { Icon } from '@/components/common/Icon';

interface SearchBarProps extends Omit<AdaptiveInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounce?: number;
  onClear?: () => void;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = '搜尋...',
  debounce = 300,
  onClear,
  ...props
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);

    // 清除之前的 timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 設定新的 timeout
    const newTimeoutId = setTimeout(() => {
      onChangeText(text);
    }, debounce);

    setTimeoutId(newTimeoutId);
  }, [debounce, onChangeText, timeoutId]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
    if (onClear) {
      onClear();
    }
  }, [onChangeText, onClear]);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={1}
      onPress={() => {
        // 確保整個區域都可以點擊來聚焦輸入框
        const input = (props as any).inputRef?.current;
        if (input) input.focus();
      }}
    >
      <Icon name="search" size={16} color="#7A7A7A" style={styles.icon} />
      <AdaptiveInput
        containerStyle={styles.inputContainer}
        inputStyle={styles.inputInner}
        webStyle={{
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          width: '100%'
        }}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7A7A7A"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Icon name="close-circle" size={18} color="#7A7A7A" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 32 },
  icon: {
    marginRight: 8 },
  inputContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0 },
  inputInner: {
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    outline: 'none' },
  clearButton: {
    padding: 4 } });