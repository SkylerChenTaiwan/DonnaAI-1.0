/**
 * 可重用的圓餅圖元件
 * 用於顯示比例資料
 * 使用 Victory Native v41+ PolarChart API
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions , Platform } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';
import { PieDataPoint, toVictoryPolar, formatPercentage } from '@/types/charts';

const { width: screenWidth } = Dimensions.get('window');

interface PieChartProps {
  data: PieDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  colorScale?: string[];
  showPercentage?: boolean;
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
  showPercentage = true }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const pieData = data.map((item, index) => ({
    ...item,
    percentage: formatPercentage(item.value / total),
    color: item.color || colorScale[index % colorScale.length] }));
  
  // 轉換為 Victory Native 格式
  const victoryData = toVictoryPolar(pieData);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        <View style={{ height, width }}>
          {/* @ts-ignore - Victory Native v41 TypeScript 類型定義不完善 */}
          <PolarChart
            data={victoryData}
            labelKey="label"
            valueKey="value"
            colorKey="color"
          >
            <Pie.Chart innerRadius={innerRadius} />
          </PolarChart>
        </View>
      </View>
      
      {/* 圖例 */}
      <View style={styles.legend}>
        {pieData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={StyleSheet.flatten([
                styles.legendColor, 
                { backgroundColor: item.color }
              ])} 
            />
            <Text style={styles.legendText}>
              {item.label} {showPercentage && `(${item.percentage})`}
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
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center' },
  chartContainer: {
    alignItems: 'center' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6 },
  legendText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary } });