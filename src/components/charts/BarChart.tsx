/**
 * 長條圖元件
 * 支援基本長條圖、分組長條圖和堆疊長條圖
 */

import React from 'react';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryTooltip,
  VictoryStack,
  VictoryGroup,
  VictoryLegend
} from 'victory-native';
import { BaseChart, formatNumberLabel } from './BaseChart';
import { ChartData, ChartDataset } from '../../types/data-visualization';
import { Text } from 'react-native';

interface BarChartProps {
  data: ChartData;
  variant?: 'single' | 'grouped' | 'stacked';
}

export const BarChart: React.FC<BarChartProps> = ({ data, variant = 'single' }) => {
  const { config, metadata } = data;
  
  // 準備資料
  const prepareData = () => {
    if (variant === 'single') {
      // 單一資料集
      return data.data;
    } else {
      // 多資料集（分組或堆疊）
      const datasets: ChartDataset[] = data.data as ChartDataset[];
      return datasets;
    }
  };

  const chartData = prepareData();

  // 建立圖表內容
  const renderChartContent = () => {
    if (variant === 'single') {
      return (
        <VictoryBar
          data={chartData}
          x="x"
          y="y"
          labelComponent={
            <VictoryTooltip
              renderInPortal={false}
              flyoutStyle={{ 
                stroke: '#666',
                fill: 'white'
              }}
            />
          }
          style={{
            data: { fill: config?.colorScale?.[0] || '#FF6B6B' },
            labels: { fontSize: 12 }
          }}
        />
      );
    } else if (variant === 'grouped') {
      return (
        <VictoryGroup offset={20} colorScale={config?.colorScale}>
          {(chartData as ChartDataset[]).map((dataset, index) => (
            <VictoryBar
              key={dataset.label}
              data={dataset.data}
              x="x"
              y="y"
              labelComponent={
                <VictoryTooltip
                  renderInPortal={false}
                  flyoutStyle={{ 
                    stroke: '#666',
                    fill: 'white'
                  }}
                />
              }
            />
          ))}
        </VictoryGroup>
      );
    } else if (variant === 'stacked') {
      return (
        <VictoryStack colorScale={config?.colorScale}>
          {(chartData as ChartDataset[]).map((dataset) => (
            <VictoryBar
              key={dataset.label}
              data={dataset.data}
              x="x"
              y="y"
            />
          ))}
        </VictoryStack>
      );
    }
  };

  // 圖例資料（用於分組和堆疊圖表）
  const legendData = variant !== 'single' && Array.isArray(chartData) ? 
    (chartData as ChartDataset[]).map((dataset, index) => ({
      name: dataset.label,
      symbol: { fill: config?.colorScale?.[index] || '#FF6B6B' }
    })) : [];

  return (
    <BaseChart config={config}>
      <VictoryChart
        domainPadding={{ x: 20 }}
        padding={config?.padding}
      >
        {/* X 軸 */}
        <VictoryAxis
          dependentAxis={false}
          style={{
            axis: { stroke: '#666' },
            tickLabels: { 
              fontSize: 12, 
              padding: 5,
              angle: -45,
              textAnchor: 'end'
            },
            grid: { stroke: '#e0e0e0', strokeDasharray: '3,3' }
          }}
          label={config?.xAxis?.label || metadata.dimensions[0]}
          axisLabelComponent={
            <VictoryLabel dy={30} style={{ fontSize: 14 }} />
          }
          tickFormat={config?.xAxis?.tickFormat}
        />
        
        {/* Y 軸 */}
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#666' },
            tickLabels: { fontSize: 12, padding: 5 },
            grid: { stroke: '#e0e0e0', strokeDasharray: '3,3' }
          }}
          label={config?.yAxis?.label || metadata.metrics[0]}
          axisLabelComponent={
            <VictoryLabel dy={-30} style={{ fontSize: 14 }} />
          }
          tickFormat={config?.yAxis?.tickFormat || formatNumberLabel}
        />
        
        {/* 圖表內容 */}
        {renderChartContent()}
        
        {/* 圖例（僅用於分組和堆疊） */}
        {variant !== 'single' && config?.enableLegend !== false && (
          <VictoryLegend
            x={50}
            y={10}
            orientation="horizontal"
            gutter={20}
            data={legendData}
            style={{
              labels: { fontSize: 12 }
            }}
          />
        )}
      </VictoryChart>
      
      {/* 標題 */}
      <Text style={{
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
        color: '#333'
      }}>
        {metadata.title}
      </Text>
    </BaseChart>
  );
};