/**
 * 圓餅圖元件
 * 用於顯示比例和分佈資料
 * 
 * 注意：此檔案已棄用，請使用 src/components/admin/charts/PieChart.tsx
 * Victory Native v41+ 不再支援舊版 API
 */

import React from 'react';
import { Text, View } from 'react-native';
import { ChartData } from '../../types/data-visualization';

interface PieChartProps {
  data: ChartData;
  showPercentage?: boolean;
  innerRadius?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  showPercentage = true,
  innerRadius = 0 
}) => {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
        圓餅圖元件已棄用
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 8 }}>
        請使用 src/components/admin/charts/PieChart.tsx
      </Text>
    </View>
  );
};