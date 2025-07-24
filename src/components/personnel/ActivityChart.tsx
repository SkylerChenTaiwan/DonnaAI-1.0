/**
 * 活動圖表元件 - 使用 victory-native 顯示活動統計
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryContainer,
  VictoryArea,
} from 'victory-native';
import { DesignSystem } from '../../theme/DesignSystem';

interface ActivityChartProps {
  data: number[];
  height?: number;
  showArea?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  height = 200,
  showArea = true,
}) => {
  // 將數據轉換為 Victory 格式
  const chartData = data.map((value, index) => ({
    x: index + 1,
    y: value,
  }));

  // 計算 Y 軸最大值
  const maxValue = Math.max(...data, 5);
  const yMax = Math.ceil(maxValue * 1.2);

  return (
    <View style={styles.container}>
      <VictoryChart
        width={screenWidth - DesignSystem.spacing.lg * 4}
        height={height}
        padding={{ left: 50, top: 20, right: 20, bottom: 40 }}
        theme={VictoryTheme.grayscale}
        containerComponent={
          <VictoryContainer
            disableContainerEvents
            style={styles.chartContainer}
          />
        }
      >
        {/* X 軸 */}
        <VictoryAxis
          style={{
            axis: { stroke: DesignSystem.colors.border.light },
            tickLabels: {
              fontSize: 10,
              fill: DesignSystem.colors.text.tertiary,
            },
            grid: {
              stroke: DesignSystem.colors.border.light,
              strokeDasharray: '2,2',
              opacity: 0.5,
            },
          }}
          tickFormat={(x) => {
            // 只顯示部分標籤
            if (x === 1) return '30天前';
            if (x === 15) return '15天前';
            if (x === 30) return '今天';
            return '';
          }}
        />

        {/* Y 軸 */}
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: DesignSystem.colors.border.light },
            tickLabels: {
              fontSize: 10,
              fill: DesignSystem.colors.text.tertiary,
            },
            grid: {
              stroke: DesignSystem.colors.border.light,
              strokeDasharray: '2,2',
              opacity: 0.5,
            },
          }}
          domain={[0, yMax]}
          tickFormat={(y) => Math.round(y).toString()}
        />

        {/* 區域圖（可選） */}
        {showArea && (
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: DesignSystem.colors.primary,
                fillOpacity: 0.1,
              },
            }}
            interpolation="monotoneX"
          />
        )}

        {/* 折線圖 */}
        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: DesignSystem.colors.primary,
              strokeWidth: 2,
            },
          }}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    backgroundColor: 'transparent',
  },
});