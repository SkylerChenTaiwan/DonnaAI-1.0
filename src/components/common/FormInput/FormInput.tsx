/**
 * Native 平台 FormInput 元件
 * 使用 React Native TextInput
 */

import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

export interface FormInputProps extends TextInputProps {
  onChangeText?: (text: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export const FormInput: React.FC<FormInputProps> = ({
  style,
  editable = true,
  type = 'text',
  ...props
}) => {
  const colors = DesignSystem.colors;
  
  // 根據類型設定鍵盤類型
  let keyboardType = props.keyboardType;
  if (!keyboardType) {
    switch (type) {
      case 'email':
        keyboardType = 'email-address';
        break;
      case 'number':
        keyboardType = 'numeric';
        break;
      case 'tel':
        keyboardType = 'phone-pad';
        break;
      case 'url':
        keyboardType = 'url';
        break;
      default:
        keyboardType = 'default';
    }
  }

  return (
    <TextInput
      {...props}
      editable={editable}
      keyboardType={keyboardType}
      secureTextEntry={type === 'password'}
      style={StyleSheet.flatten([
        styles.input,
        {
          backgroundColor: editable ? colors.background.input : colors.background.primary,
          borderColor: colors.border.default,
          color: editable ? colors.text.primary : colors.text.disabled },
        style,
      ])}
      placeholderTextColor={colors.text.tertiary}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 20 } });