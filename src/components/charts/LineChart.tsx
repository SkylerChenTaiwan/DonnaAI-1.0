/**
 * 折線圖元件
 * 支援單線和多線顯示，適用於趨勢分析
 */

import React from 'react';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryTooltip,
  VictoryLegend,
  VictoryScatter,
  VictoryVoronoiContainer
} from 'victory-native';
import { BaseChart, formatDateLabel, formatNumberLabel } from './BaseChart';
import { ChartData, ChartDataset } from '../../types/data-visualization';
import { Text } from 'react-native';

interface LineChartProps {
  data: ChartData;
  showPoints?: boolean;
  smooth?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  showPoints = true,
  smooth = true 
}) => {
  const { config, metadata } = data;
  
  // 判斷是否為多線圖
  const isMultiLine = Array.isArray(data.data) && data.data.length > 0 && 
    'label' in data.data[0] && 'data' in data.data[0];

  // 準備資料
  const chartData = isMultiLine ? data.data as ChartDataset[] : [{ 
    label: metadata.metrics[0], 
    data: data.data 
  }];

  // Voronoi 容器配置（用於更好的工具提示）
  const containerComponent = (
    <VictoryVoronoiContainer
      voronoiDimension="x"
      labels={({ datum }) => `${datum.x}: ${formatNumberLabel(datum.y)}`}
      labelComponent={
        <VictoryTooltip
          cornerRadius={4}
          flyoutStyle={{ 
            stroke: '#666',
            fill: 'white'
          }}
          style={{ fontSize: 12 }}
        />
      }
    />
  );

  // 圖例資料
  const legendData = isMultiLine ? 
    chartData.map((dataset, index) => ({
      name: dataset.label,
      symbol: { 
        fill: config?.colorScale?.[index] || '#FF6B6B',
        type: 'square'
      }
    })) : [];

  return (
    <BaseChart config={config} containerComponent={containerComponent}>
      <VictoryChart
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
          tickFormat={config?.xAxis?.tickFormat || (
            metadata.dimensions[0] === 'time' ? formatDateLabel : undefined
          )}
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
          domain={config?.yAxis?.domain}
        />
        
        {/* 折線 */}
        {chartData.map((dataset, index) => (
          <React.Fragment key={dataset.label}>
            <VictoryLine
              data={dataset.data}
              x="x"
              y="y"
              interpolation={smooth ? "natural" : "linear"}
              style={{
                data: { 
                  stroke: config?.colorScale?.[index] || '#FF6B6B',
                  strokeWidth: 2
                }
              }}
            />
            
            {/* 資料點 */}
            {showPoints && (
              <VictoryScatter
                data={dataset.data}
                x="x"
                y="y"
                size={4}
                style={{
                  data: { 
                    fill: config?.colorScale?.[index] || '#FF6B6B'
                  }
                }}
              />
            )}
          </React.Fragment>
        ))}
        
        {/* 圖例（僅用於多線圖） */}
        {isMultiLine && config?.enableLegend !== false && (
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