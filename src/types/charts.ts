/**
 * 統一的圖表資料類型定義
 * 用於所有圖表元件的標準資料格式
 */

// === 基礎資料點類型 ===

/**
 * 基礎資料點 - 用於線型圖、長條圖、散點圖等
 */
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  category?: string;
  metadata?: any;
}

/**
 * 圓餅圖資料點
 */
export interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * 多系列資料集
 */
export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// === 圖表通用 Props 類型 ===

/**
 * 圖表基礎 Props
 */
export interface BaseChartProps {
  title?: string;
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScale?: string[];
  animate?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

/**
 * 長條圖 Props
 */
export interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[] | ChartSeries[];
  variant?: 'single' | 'grouped' | 'stacked';
  barWidth?: number;
  horizontal?: boolean;
}

/**
 * 線型圖 Props
 */
export interface LineChartProps extends BaseChartProps {
  data: ChartDataPoint[] | ChartSeries[];
  curve?: 'linear' | 'smooth' | 'step';
  showPoints?: boolean;
  strokeWidth?: number;
}

/**
 * 圓餅圖 Props
 */
export interface PieChartProps extends Omit<BaseChartProps, 'xAxisLabel' | 'yAxisLabel'> {
  data: PieDataPoint[];
  innerRadius?: number;  // 0 為實心圓餅圖，> 0 為甜甜圈圖
  labelRadius?: number;
  showPercentage?: boolean;
}

/**
 * 散點圖 Props
 */
export interface ScatterChartProps extends BaseChartProps {
  data: ChartDataPoint[] | ChartSeries[];
  pointSize?: number;
  showTrendLine?: boolean;
}

// === 統計卡片類型 ===

/**
 * 統計卡片資料
 */
export interface StatCardData {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  color?: string;
}

// === 工具函數類型 ===

/**
 * 資料轉換函數簽名
 */
export interface DataTransformer<T, R> {
  (data: T): R;
}

/**
 * 格式化函數簽名
 */
export interface ValueFormatter {
  (value: any): string;
}

// === Victory Native 兼容類型 ===

/**
 * Victory Native CartesianChart 資料格式
 */
export interface VictoryCartesianData {
  x: string | number;
  y: number;
  [key: string]: any;
}

/**
 * Victory Native PolarChart 資料格式
 */
export interface VictoryPolarData {
  label: string;
  value: number;
  color?: string;
  [key: string]: any;
}

// === 資料轉換工具 ===

/**
 * 將通用資料格式轉換為 Victory Native 格式
 */
export const toVictoryCartesian = (data: ChartDataPoint[]): VictoryCartesianData[] => {
  return data.map(point => ({
    x: point.x,
    y: point.y,
    ...point.metadata
  }));
};

/**
 * 將圓餅圖資料轉換為 Victory Native 格式
 */
export const toVictoryPolar = (data: PieDataPoint[]): VictoryPolarData[] => {
  return data.map(point => ({
    label: point.label,
    value: point.value,
    color: point.color
  }));
};

/**
 * 檢查是否為多系列資料
 */
export const isMultiSeries = (data: ChartDataPoint[] | ChartSeries[]): data is ChartSeries[] => {
  return data.length > 0 && 'name' in data[0] && 'data' in data[0];
};

/**
 * 扁平化多系列資料
 */
export const flattenSeries = (series: ChartSeries[]): ChartDataPoint[] => {
  return series.reduce((acc, s) => {
    return acc.concat(s.data.map(point => ({
      ...point,
      category: s.name
    })));
  }, [] as ChartDataPoint[]);
};

// === 常用格式化函數 ===

/**
 * 數字格式化
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * 百分比格式化
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 貨幣格式化
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * 日期格式化
 */
export const formatDate = (date: Date | string | number, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date);
  if (format === 'short') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString('zh-TW');
};