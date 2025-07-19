/**
 * 搜尋欄元件
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
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
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#8E8E93" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 4,
  },
});