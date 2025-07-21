/**
 * 圖表顯示元件
 * 根據圖表類型動態渲染相應的圖表
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ChartData } from '../../types/data-visualization';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { colors } from '../../theme/colors';

interface ChartDisplayProps {
  chartData: ChartData | null;
  isLoading?: boolean;
  error?: string | null;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  chartData,
  isLoading = false,
  error = null
}) => {
  // 載入中狀態
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>正在生成圖表...</Text>
      </View>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>圖表生成失敗</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  // 無資料狀態
  if (!chartData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>尚無圖表資料</Text>
      </View>
    );
  }

  // 根據圖表類型渲染
  const renderChart = () => {
    switch (chartData.type) {
      case 'bar':
        return <BarChart data={chartData} variant="single" />;
      
      case 'grouped-bar':
        return <BarChart data={chartData} variant="grouped" />;
      
      case 'stacked-bar':
        return <BarChart data={chartData} variant="stacked" />;
      
      case 'line':
        return <LineChart data={chartData} />;
      
      case 'pie':
        return <PieChart data={chartData} />;
      
      case 'scatter':
        // TODO: 實作散點圖
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.noDataText}>散點圖尚未實作</Text>
          </View>
        );
      
      default:
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              不支援的圖表類型: {chartData.type}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderChart()}
      
      {/* 圖表資訊 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          資料來源: {chartData.metadata.dataSource} | 
          資料筆數: {chartData.metadata.recordCount}
        </Text>
        {chartData.metadata.timeRange && (
          <Text style={styles.infoText}>
            時間範圍: {new Date(chartData.metadata.timeRange.start).toLocaleDateString()} - 
            {new Date(chartData.metadata.timeRange.end).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600'
  },
  errorDetail: {
    marginTop: 5,
    fontSize: 14,
    color: '#666'
  },
  noDataText: {
    fontSize: 16,
    color: '#999'
  },
  infoContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  }
});