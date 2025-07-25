import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export function LoadingView({ 
  message = '載入中...', 
  size = 'large',
  color = '#FF6B35',
  style 
}: LoadingViewProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});