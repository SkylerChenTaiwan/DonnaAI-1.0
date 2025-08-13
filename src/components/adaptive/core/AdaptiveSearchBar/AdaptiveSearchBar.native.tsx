/**
 * AdaptiveSearchBar Native 實作
 * 使用 React Native 元件
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { AdaptiveSearchBarProps, DEFAULT_COLORS } from './AdaptiveSearchBar.types';

export const AdaptiveSearchBar: React.FC<AdaptiveSearchBarProps> = ({
  value = '',
  onChangeText,
  onSearch,
  onClear,
  placeholder = '搜尋...',
  autoFocus = false,
  returnKeyType = 'search',
  showIcon = true,
  showClearButton = true,
  variant = 'filled',
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = () => {
    if (onSearch) {
      onSearch(value);
      Keyboard.dismiss();
    }
  };
  
  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };
  
  return (
    <View
      style={[
        styles.container,
        variant === 'filled' && styles.filledContainer,
        variant === 'outlined' && [
          styles.outlinedContainer,
          isFocused && styles.focusedContainer
        ],
        disabled && styles.disabledContainer,
      ]}
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel || '搜尋'}
      accessibilityRole="search"
    >
      {showIcon && (
        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={DEFAULT_COLORS.icon} />
          ) : (
            <MaterialIcon name="search" size={20} color={DEFAULT_COLORS.icon} />
          )}
        </View>
      )}
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={DEFAULT_COLORS.placeholder}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        editable={!disabled}
        selectTextOnFocus
      />
      
      {showClearButton && value && !disabled && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          activeOpacity={0.7}
          accessibilityLabel="清除"
        >
          <MaterialIcon name="close" size={16} color={DEFAULT_COLORS.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filledContainer: {
    backgroundColor: DEFAULT_COLORS.background,
  },
  outlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DEFAULT_COLORS.border,
  },
  focusedContainer: {
    borderColor: DEFAULT_COLORS.focus,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: DEFAULT_COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
  },
});