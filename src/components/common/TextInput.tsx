/**
 * 通用文字輸入元件
 */

import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextInput = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}: TextInputProps) => {
  return (
    <View style={StyleSheet.flatten([styles.container, containerStyle])}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={StyleSheet.flatten([
          styles.input,
          error ? styles.inputError : null,
          style,
        ])}
        placeholderTextColor="#7A7A7A"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16 },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF' },
  inputError: {
    borderColor: '#A94438' },
  errorText: {
    fontSize: 14,
    color: '#A94438',
    marginTop: 4 } });