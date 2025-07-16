/**
 * 會議記錄畫面
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '@/components/common/Layout';

export const MeetingsScreen: React.FC = () => {
  return (
    <Layout>
      <View style={styles.container}>
        <Text style={styles.title}>會議記錄</Text>
        <Text style={styles.subtitle}>此功能正在開發中...</Text>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});