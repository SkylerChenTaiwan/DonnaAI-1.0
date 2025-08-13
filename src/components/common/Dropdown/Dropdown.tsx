/**
 * Native 平台 Dropdown 元件
 * 使用 React Native Picker
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DesignSystem } from '@/theme/designSystem';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: any;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value = '',
  placeholder = '請選擇...',
  onChange,
  disabled = false,
  style = {} }) => {
  const colors = DesignSystem.colors;

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        enabled={!disabled}
        style={StyleSheet.flatten([
          styles.picker,
          {
            backgroundColor: colors.background.input,
            color: disabled ? colors.text.disabled : colors.text.primary },
        ])}
      >
        {placeholder && (
          <Picker.Item label={placeholder} value="" />
        )}
        {options.map((option) => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value}
            enabled={!option.disabled}
          />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden' },
  picker: {
    height: 48,
    paddingHorizontal: 16 } });