import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Icon } from '@/components/common/Icon';

interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  message?: string;
  style?: any;
}

export function RetryButton({ onRetry, loading = false, message = '重試', style }: RetryButtonProps) {
  return (
    <TouchableOpacity 
      style={StyleSheet.flatten([styles.container, style])}
      onPress={onRetry}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#FF6B35" style={styles.icon} />
        ) : (
          <Icon name="refresh" size={20} color="#FF6B35" style={styles.icon} />
        )}
        <Text style={styles.text}>{loading ? '載入中...' : message}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0D6',
    alignSelf: 'center' },
  content: {
    flexDirection: 'row',
    alignItems: 'center' },
  icon: {
    marginRight: 8 },
  text: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '500' } });