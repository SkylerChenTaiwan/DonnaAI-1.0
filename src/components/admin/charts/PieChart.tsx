/**
 * 可重用的圓餅圖元件
 * 用於顯示比例資料
 * 注意：Victory Native v41+ API 需要進一步研究實作
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface PieData {
  label: string;
  value: number;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  colorScale?: string[];
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 300,
  innerRadius = 0,
  colorScale = [
    DesignSystem.colors.primary,
    DesignSystem.colors.status.success,
    DesignSystem.colors.status.warning,
    DesignSystem.colors.status.error,
    '#9B59B6',
    '#3498DB',
    '#1ABC9C',
    '#F39C12',
  ],
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const pieData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
    color: colorScale[index % colorScale.length],
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        {/* 暫時佔位符 - Victory Native v41 API 需要進一步研究 */}
        <View style={[styles.placeholder, { height, width }]}>
          <Text style={styles.placeholderText}>
            圓餅圖
          </Text>
          <Text style={styles.placeholderSubtext}>
            {data.length} 個資料點
          </Text>
        </View>
      </View>
      
      {/* 圖例 */}
      <View style={styles.legend}>
        {pieData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: item.color }
              ]} 
            />
            <Text style={styles.legendText}>
              {item.label} ({item.percentage}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: DesignSystem.colors.background.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
  },
  placeholderText: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 4,
  },
  placeholderSubtext: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.disabled,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
});