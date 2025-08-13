/**
 * 載入指示器元件
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner = ({
  message,
  size = 'large',
  color = '#1A1A1A',
  style }: LoadingSpinnerProps) => {
  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20 },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center' } });