/**
 * 通用表單欄位組件 - 簡化版本
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export interface FormFieldProps {
  label?: string;
  type?: string;
  value?: any;
  onChangeText?: (text: string) => void;
  onValueChange?: (value: any) => void;
  onDateChange?: (date: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  minHeight?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChangeText,
  error,
  placeholder,
  required = false,
  minHeight,
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, required && styles.required]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          type === 'multiline' && { height: minHeight || 100 },
          error && styles.inputError,
        ]}
        value={value || ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={type === 'multiline'}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
});