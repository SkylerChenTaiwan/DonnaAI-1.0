/**
 * 統一的表單輸入元件
 * Unified Form Input Component
 */

import React from 'react';
import { View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform  } from 'react-native';
import { AdaptiveInput } from '@/components/adaptive';
import { DesignSystem } from '@/theme/designSystem';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  error,
  hint,
  style,
  ...props
}) => {
  // Web 平台使用原生 HTML input 並套用內聯樣式
  if (Platform.OS === 'web') {
    const webInputStyle = {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${error ? DesignSystem.colors.status.error : DesignSystem.colors.border.light}`,
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '20px',
      minHeight: '48px',
      backgroundColor: DesignSystem.colors.background.surface,
      color: DesignSystem.colors.text.primary,
      outline: 'none',
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit' };

    return (
      <View style={styles.container}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
        
        <input
          type="text"
          style={webInputStyle}
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e: any) => props.onChangeText?.(e.target.value)}
          maxLength={props.maxLength}
          disabled={props.editable === false}
        />
        
        {hint && !error && (
          <Text style={styles.hint}>{hint}</Text>
        )}
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    );
  }

  // Native 平台使用 React Native TextInput
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      
      <AdaptiveInput
        style={StyleSheet.flatten([
          styles.input,
          error && styles.inputError,
          style,
        ])}
        placeholderTextColor={DesignSystem.colors.text.tertiary}
        {...props}
      />
      
      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16 },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary },
  required: {
    color: DesignSystem.colors.status.error,
    fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
    minHeight: 48,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0 } as any }) },
  inputError: {
    borderColor: DesignSystem.colors.status.error },
  hint: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
    marginTop: 4 },
  error: {
    fontSize: 12,
    color: DesignSystem.colors.status.error,
    marginTop: 4 } });