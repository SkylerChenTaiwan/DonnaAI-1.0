/**
 * 可重用的線型圖元件
 * 用於顯示趨勢資料
 * 注意：Victory Native v41+ API 需要進一步研究實作
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  x: number | string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 250,
  color = DesignSystem.colors.primary,
  yAxisLabel,
  xAxisLabel,
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {/* 暫時佔位符 - Victory Native v41 API 需要進一步研究 */}
      <View style={[styles.placeholder, { height, width }]}>
        <Text style={styles.placeholderText}>
          線型圖
        </Text>
        <Text style={styles.placeholderSubtext}>
          {data.length} 個資料點
        </Text>
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