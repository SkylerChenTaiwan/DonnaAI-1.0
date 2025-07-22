/**
 * 通用表單欄位組件 - 簡化版本
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export interface FormFieldProps {
  // 支援兩種格式以保持向後相容
  config?: {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
  };
  // 舊的 props 格式
  label?: string;
  type?: string;
  value?: any;
  onChange?: (value: any) => void;
  onChangeText?: (text: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  minHeight?: number;
}

export const FormField: React.FC<FormFieldProps> = (props) => {
  // 判斷是使用新格式還是舊格式
  const isNewFormat = !!props.config;
  
  // 從 props 中提取值，支援兩種格式
  const label = isNewFormat ? props.config?.label : props.label;
  const type = isNewFormat ? props.config?.type : props.type || 'text';
  const required = isNewFormat ? props.config?.required : props.required || false;
  const placeholder = isNewFormat ? props.config?.placeholder : props.placeholder;
  const value = props.value;
  const onChange = props.onChange || props.onChangeText;
  const error = props.error;
  const disabled = props.disabled || false;
  const minHeight = props.minHeight;
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          (type === 'textarea' || type === 'multiline') && (minHeight ? { height: minHeight } : styles.textarea),
          error && styles.inputError,
        ]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        multiline={type === 'textarea' || type === 'multiline'}
        editable={!disabled}
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
  requiredStar: {
    color: '#DC2626',
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
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