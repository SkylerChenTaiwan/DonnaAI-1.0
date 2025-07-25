/**
 * 基礎圖表元件
 * 提供所有圖表的共用功能和配置
 * 
 * 注意：此檔案已棄用，請使用 src/components/admin/charts/ 目錄下的新版圖表元件
 * Victory Native v41+ 不再支援舊版 API
 */

import React from 'react';
import { Text, View } from 'react-native';
import { ChartConfig } from '../../types/data-visualization';

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
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
        基礎圖表元件已棄用
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 8 }}>
        請使用 src/components/admin/charts/ 目錄下的新版圖表元件
      </Text>
    </View>
  );
};

/**
 * 通用圖表工具函數（保留供向後相容）
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