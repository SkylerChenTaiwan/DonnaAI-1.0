/**
 * 折線圖元件
 * 支援單線和多線顯示，適用於趨勢分析
 * 
 * 注意：此檔案已棄用，請使用 src/components/admin/charts/LineChart.tsx
 * Victory Native v41+ 不再支援舊版 API
 */

import React from 'react';
import { Text, View } from 'react-native';
import { ChartData } from '../../types/data-visualization';

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
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
        線型圖元件已棄用
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 8 }}>
        請使用 src/components/admin/charts/LineChart.tsx
      </Text>
    </View>
  );
};