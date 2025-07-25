/**
 * 可重用的圓餅圖元件
 * 用於顯示比例資料
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// Note: Victory Native v41+ has a different API
// TODO: Update to use PieChart from victory-native-xl
// For now, these imports are commented out to avoid type errors
// import {
//   VictoryPie,
//   VictoryLabel,
//   VictoryContainer,
// } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface PieData {
  x: string;
  y: number;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  padAngle?: number;
  colorScale?: string[];
  showLabels?: boolean;
  labelRadius?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 300,
  innerRadius = 0,
  padAngle = 2,
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
  showLabels = true,
  labelRadius = 90,
}) => {
  // 計算總和和百分比
  const total = data.reduce((sum, item) => sum + item.y, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.y / total) * 100).toFixed(1),
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        {/* TODO: Implement chart using PieChart from victory-native-xl */}
        <View style={{ height, width, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: DesignSystem.colors.text.secondary }}>
            圖表元件需要更新以支援 Victory Native v41+
          </Text>
        </View>
      </View>
      
      {/* 圖例 */}
      <View style={styles.legend}>
        {dataWithPercentage.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: colorScale[index % colorScale.length] }
              ]} 
            />
            <Text style={styles.legendText}>
              {item.x} ({item.percentage}%)
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