/**
 * 長條圖元件
 * 支援基本長條圖、分組長條圖和堆疊長條圖
 * 
 * 注意：此檔案已棄用，請使用 src/components/admin/charts/BarChart.tsx
 * Victory Native v41+ 不再支援舊版 API
 */

import React from 'react';
import { Text, View } from 'react-native';
import { ChartData } from '../../types/data-visualization';

interface BarChartProps {
  data: ChartData;
  variant?: 'single' | 'grouped' | 'stacked';
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  variant = 'single' 
}) => {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
        長條圖元件已棄用
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 8 }}>
        請使用 src/components/admin/charts/BarChart.tsx
      </Text>
    </View>
  );
};