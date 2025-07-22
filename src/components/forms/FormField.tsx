/**
 * 通用表單欄位組件 - 簡化版本
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export interface FormFieldProps {
  config: {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
  };
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  config,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const { label, type = 'text', required = false, placeholder } = config;
  
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
          (type === 'textarea' || type === 'multiline') && styles.textarea,
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