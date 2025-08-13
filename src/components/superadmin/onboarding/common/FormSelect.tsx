import { Icon } from '../../../../components/common/Icon';
/**
 * 統一的表單選擇器元件
 * Unified Form Select Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DesignSystem } from '@/theme/designSystem';
// Icon import removed - using platform-specific Icon component;

interface Option {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  options,
  onChange,
  required = false,
  error,
  placeholder = '請選擇...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      
      <View style={[styles.selectContainer, error && styles.selectError]}>
        {Platform.OS === 'web' ? (
          <>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px 40px 12px 16px',
                fontSize: '14px',
                color: DesignSystem.colors.text.primary,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit' } as any}
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={20}
              color={DesignSystem.colors.text.secondary}
              style={styles.selectIcon}
             />
          </>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            style={styles.picker}
          >
            <Picker.Item label={placeholder} value="" />
            {options.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        )}
      </View>
      
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
  selectContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    borderRadius: DesignSystem.borderRadius.md,
    backgroundColor: DesignSystem.colors.background.surface,
    minHeight: 48,
    justifyContent: 'center' },
  selectError: {
    borderColor: DesignSystem.colors.status.error },
  picker: {
    height: 48,
    color: DesignSystem.colors.text.primary },
  webSelect: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer' } as any,
  selectIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: Platform.OS === 'web' ? `translateY(${-10}px)` : [{ translateY: -10 }],
    pointerEvents: 'none' },
  error: {
    fontSize: 12,
    color: DesignSystem.colors.status.error,
    marginTop: 4 } });