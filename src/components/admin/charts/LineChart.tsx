/**
 * 可重用的線型圖元件
 * 用於顯示趨勢資料
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// Note: Victory Native v41+ has a different API
// TODO: Update to use CartesianChart from victory-native-xl
// For now, these imports are commented out to avoid type errors
// import {
//   VictoryChart,
//   VictoryLine,
//   VictoryAxis,
//   VictoryTheme,
//   VictoryArea,
//   VictoryLabel,
// } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  x: number | string | Date;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 250,
  color = DesignSystem.colors.primary,
  showArea = true,
  yAxisLabel,
  xAxisLabel,
  formatXAxis,
  formatYAxis,
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {/* TODO: Implement chart using CartesianChart from victory-native-xl */}
      <View style={{ height, width, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: DesignSystem.colors.text.secondary }}>
          圖表元件需要更新以支援 Victory Native v41+
        </Text>
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
  },
});