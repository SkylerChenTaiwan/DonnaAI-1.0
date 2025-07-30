import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { RetryButton } from './RetryButton';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
  style?: any;
}

export function ErrorMessage({ error, onRetry, isNetworkError = false, style }: ErrorMessageProps) {
  // 根據錯誤類型提供更友善的訊息
  const getFriendlyMessage = (error: string): string => {
    if (isNetworkError || error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return '無法連線到伺服器，請檢查您的網路連線';
    }
    if (error.toLowerCase().includes('permission') || error.includes('權限')) {
      return '您沒有執行此操作的權限';
    }
    if (error.toLowerCase().includes('not found') || error.includes('找不到')) {
      return '找不到請求的資源';
    }
    if (error.toLowerCase().includes('timeout') || error.includes('逾時')) {
      return '請求逾時，請稍後再試';
    }
    if (error.toLowerCase().includes('auth') || error.includes('認證') || error.includes('登入')) {
      return '認證失敗，請重新登入';
    }
    
    // 預設訊息
    return error.length > 100 ? '發生錯誤，請稍後再試' : error;
  };

  const friendlyMessage = getFriendlyMessage(error);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Icon 
          name={isNetworkError ? "wifi-outline" : "alert-circle-outline"} 
          size={48} 
          color="#EF4444" 
        />
      </View>
      
      <Text style={styles.title}>
        {isNetworkError ? '網路連線問題' : '發生錯誤'}
      </Text>
      
      <Text style={styles.message}>{friendlyMessage}</Text>
      
      {isNetworkError && (
        <Text style={styles.suggestion}>
          建議：{'\n'}
          • 檢查您的網路連線{'\n'}
          • 嘗試切換 WiFi 或行動數據{'\n'}
          • 關閉 VPN（如果有使用）
        </Text>
      )}
      
      {onRetry && (
        <View style={styles.retryContainer}>
          <RetryButton onRetry={onRetry} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  suggestion: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'left',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryContainer: {
    marginTop: 8,
  },
});