import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '@/components/common/Layout';

/**
 * AI 業務訓練畫面
 * 暫時停用，等待開發環境升級到 Blaze 計畫
 */
export default function AIRolePlayScreen() {
  return (
    <Layout
      showBackButton
      headerTitle="AI 業務訓練"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="construct-outline" size={64} color="#666" />
          <Text style={styles.title}>功能升級中</Text>
          <Text style={styles.message}>
            AI 業務訓練功能正在進行系統升級，{'\n'}
            預計很快就會重新上線。
          </Text>
          <Text style={styles.subMessage}>
            感謝您的耐心等待！
          </Text>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});