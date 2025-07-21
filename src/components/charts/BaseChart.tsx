/**
 * 基礎圖表元件
 * 提供所有圖表的共用功能和配置
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryContainer, VictoryTheme } from 'victory-native';
import { ChartConfig } from '../../types/data-visualization';
import { colors } from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface BaseChartProps {
  config?: ChartConfig;
  children: React.ReactNode;
  containerComponent?: React.ReactElement;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  config,
  children,
  containerComponent
}) => {
  // 預設配置
  const defaultConfig: ChartConfig = {
    width: config?.width || screenWidth - 40,
    height: config?.height || 300,
    padding: config?.padding || { top: 20, right: 20, bottom: 60, left: 60 },
    theme: config?.theme || 'light',
    animate: config?.animate !== false,
    animationDuration: config?.animationDuration || 500,
    enableTooltip: config?.enableTooltip !== false,
    enableLegend: config?.enableLegend !== false
  };

  // 根據主題選擇顏色
  const theme = defaultConfig.theme === 'dark' ? 
    VictoryTheme.material : 
    VictoryTheme.material;

  // 預設顏色方案
  const defaultColorScale = [
    colors.primary,
    colors.secondary,
    '#34C759',  // 綠色
    '#007AFF',  // 藍色
    '#FF9500',  // 橘色
    '#AF52DE',  // 紫色
    '#FF3B30',  // 紅色
    '#5856D6'   // 靛藍色
  ];

  const colorScale = config?.colorScale || defaultColorScale;

  // 容器元件配置
  const defaultContainer = (
    <VictoryContainer
      width={defaultConfig.width}
      height={defaultConfig.height}
      style={styles.container}
    />
  );

  return (
    <View style={styles.chartWrapper}>
      {React.cloneElement(containerComponent || defaultContainer, {
        theme,
        width: defaultConfig.width,
        height: defaultConfig.height,
        padding: defaultConfig.padding,
        colorScale,
        animate: defaultConfig.animate ? {
          duration: defaultConfig.animationDuration,
          onLoad: { duration: 300 }
        } : undefined,
        children
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: 'center',
    marginVertical: 10
  },
  container: {
    backgroundColor: 'transparent'
  }
});

/**
 * 通用圖表工具函數
 */

// 格式化日期標籤
export const formatDateLabel = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// 格式化數字標籤
export const formatNumberLabel = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// 格式化百分比標籤
export const formatPercentageLabel = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`;
};

// 格式化時長標籤
export const formatDurationLabel = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};