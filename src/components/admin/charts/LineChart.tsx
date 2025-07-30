/**
 * 可重用的線型圖元件
 * 用於顯示趨勢資料
 * 使用 Victory Native v41+ CartesianChart API
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';
import { ChartDataPoint, ChartSeries, isMultiSeries, flattenSeries } from '@/types/charts';

const { width: screenWidth } = Dimensions.get('window');

interface LineChartProps {
  data: ChartDataPoint[] | ChartSeries[];
  title?: string;
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  curve?: 'linear' | 'smooth' | 'step';
  showPoints?: boolean;
  strokeWidth?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 250,
  color = DesignSystem.colors.primary,
  yAxisLabel,
  xAxisLabel,
  curve = 'linear',
  showPoints = false,
  strokeWidth = 2,
}) => {
  // 處理多系列資料
  const chartData = isMultiSeries(data) ? flattenSeries(data) : data;
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={{ height, width }}>
        {/* @ts-ignore - Victory Native v41 TypeScript 類型定義不完善 */}
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domainPadding={{ left: 50, right: 50, top: 20, bottom: 20 }}
        >
          {/* @ts-ignore */}
          {({ points }) => (
            <Line 
              points={points.y} 
              color={color} 
              strokeWidth={strokeWidth}
              curve={curve === 'smooth' ? 'natural' : curve}
            />
          )}
        </CartesianChart>
      </View>
      
      {xAxisLabel && <Text style={styles.xLabel}>{xAxisLabel}</Text>}
      {yAxisLabel && <Text style={styles.yLabel}>{yAxisLabel}</Text>}
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
  xLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  yLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
});