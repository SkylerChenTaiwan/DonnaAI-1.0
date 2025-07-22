/**
 * 智能分析畫面
 * 自然語言資料視覺化功能的主要入口
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout } from '../../components/common/Layout';
import { QueryInterface } from '../../components/DataVisualization';

export const SmartAnalyticsScreen: React.FC = () => {
  return (
    <Layout style={styles.container} showHeader={true} title="智能分析">
      <QueryInterface />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  }
});