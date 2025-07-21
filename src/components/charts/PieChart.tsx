/**
 * 圓餅圖元件
 * 用於顯示比例和分佈資料
 */

import React from 'react';
import {
  VictoryPie,
  VictoryLabel,
  VictoryContainer,
  VictoryTooltip
} from 'victory-native';
import { View, Text, StyleSheet } from 'react-native';
import { ChartData } from '../../types/data-visualization';
import { formatPercentageLabel } from './BaseChart';
import { colors } from '../../theme/colors';

interface PieChartProps {
  data: ChartData;
  showPercentage?: boolean;
  innerRadius?: number;  // 用於甜甜圈圖
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  showPercentage = true,
  innerRadius = 0 
}) => {
  const { config, metadata } = data;
  
  // 準備資料
  const chartData = data.data.map((item: any) => ({
    x: item.label || item.x,
    y: item.value || item.y
  }));

  // 計算總和和百分比
  const total = chartData.reduce((sum, item) => sum + item.y, 0);
  const dataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: item.y / total
  }));

  // 預設配置
  const width = config?.width || 350;
  const height = config?.height || 350;
  const radius = Math.min(width, height) / 2 - 40;

  // 標籤組件
  const labelComponent = showPercentage ? (
    <VictoryLabel
      style={{
        fontSize: 12,
        fill: 'white'
      }}
    />
  ) : undefined;

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <Text style={styles.title}>{metadata.title}</Text>
      
      {/* 圓餅圖 */}
      <VictoryContainer width={width} height={height}>
        <VictoryPie
          data={dataWithPercentage}
          x="x"
          y="y"
          width={width}
          height={height}
          innerRadius={innerRadius}
          radius={radius}
          padAngle={2}
          colorScale={config?.colorScale || [
            colors.primary,
            colors.secondary,
            '#34C759',
            '#007AFF',
            '#FF9500',
            '#AF52DE',
            '#FF3B30',
            '#5856D6'
          ]}
          labelComponent={
            <VictoryTooltip
              renderInPortal={false}
              flyoutStyle={{ 
                stroke: '#666',
                fill: 'white'
              }}
            />
          }
          labelRadius={radius - 30}
          labels={showPercentage ? 
            ({ datum }) => formatPercentageLabel(datum.percentage) : 
            undefined
          }
          animate={config?.animate !== false ? {
            duration: config?.animationDuration || 500,
            onLoad: { duration: 300 }
          } : undefined}
        />
      </VictoryContainer>
      
      {/* 圖例 */}
      {config?.enableLegend !== false && (
        <View style={styles.legend}>
          {dataWithPercentage.map((item, index) => (
            <View key={item.x} style={styles.legendItem}>
              <View style={[
                styles.legendColor,
                { backgroundColor: config?.colorScale?.[index] || colors.primary }
              ]} />
              <Text style={styles.legendLabel}>
                {item.x}: {item.y} ({formatPercentageLabel(item.percentage)})
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* 描述 */}
      {metadata.description && (
        <Text style={styles.description}>{metadata.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  legend: {
    marginTop: 20,
    paddingHorizontal: 20
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8
  },
  legendLabel: {
    fontSize: 14,
    color: '#666'
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20
  }
});