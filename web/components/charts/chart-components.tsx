/**
 * 圖表組件庫
 * 基於 Chart.js 和 React Chart.js 2 的圖表組件
 */

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import type { 
  TrendChartData, 
  PieChartData, 
  BarChartData 
} from '@/services/analytics.service';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// 基礎圖表屬性
interface BaseChartProps {
  className?: string;
  loading?: boolean;
  error?: string;
  height?: number;
  showLegend?: boolean;
}

// 折線圖組件
interface LineChartProps extends BaseChartProps {
  data: TrendChartData;
  showArea?: boolean;
  showGrid?: boolean;
  showPoints?: boolean;
}

export function LineChart({ 
  data, 
  className = '',
  loading = false,
  error,
  height = 400,
  showArea = false,
  showGrid = true,
  showPoints = true,
  showLegend = true
}: LineChartProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingIndicator size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center text-red-500" style={{ height }}>
          <div className="text-center">
            <p className="font-medium">載入圖表時發生錯誤</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: data.data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: data.title,
        data: data.data.map(point => point.value),
        borderColor: data.color,
        backgroundColor: showArea ? `${data.color}20` : data.color,
        borderWidth: 2,
        fill: showArea,
        tension: 0.4,
        pointBackgroundColor: data.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: showPoints ? 4 : 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: data.color,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const unit = data.yAxisLabel.includes('NT$') ? 'NT$' : '';
            return `${context.dataset.label}: ${unit}${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            if (data.yAxisLabel.includes('NT$')) {
              return `NT$${(value / 1000).toFixed(0)}K`;
            }
            return value.toLocaleString();
          },
        },
        title: {
          display: true,
          text: data.yAxisLabel,
          color: '#374151',
          font: {
            size: 13,
            weight: '500',
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}

// 長條圖組件
interface BarChartProps extends BaseChartProps {
  data: BarChartData;
  horizontal?: boolean;
  showValues?: boolean;
}

export function BarChart({
  data,
  className = '',
  loading = false,
  error,
  height = 400,
  horizontal = false,
  showValues = false,
  showLegend = false
}: BarChartProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingIndicator size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center text-red-500" style={{ height }}>
          <div className="text-center">
            <p className="font-medium">載入圖表時發生錯誤</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  // 生成顏色
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'
  ];

  const chartData = {
    labels: data.data.map(item => item.category),
    datasets: [
      {
        label: data.title,
        data: data.data.map(item => item.value),
        backgroundColor: data.data.map((item, index) => 
          item.color || colors[index % colors.length] + '80'
        ),
        borderColor: data.data.map((item, index) => 
          item.color || colors[index % colors.length]
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed[horizontal ? 'x' : 'y'];
            const unit = data.yAxisLabel.includes('NT$') ? 'NT$' : 
                        data.yAxisLabel.includes('%') ? '%' : '';
            return `${context.dataset.label}: ${unit}${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
        title: {
          display: !horizontal,
          text: horizontal ? data.yAxisLabel : '',
          color: '#374151',
          font: {
            size: 13,
            weight: '500',
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            if (data.yAxisLabel.includes('NT$')) {
              return `NT$${(value / 1000).toFixed(0)}K`;
            }
            if (data.yAxisLabel.includes('%')) {
              return `${value}%`;
            }
            return value.toLocaleString();
          },
        },
        title: {
          display: horizontal,
          text: horizontal ? '' : data.yAxisLabel,
          color: '#374151',
          font: {
            size: 13,
            weight: '500',
          },
        },
      },
    },
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{data.title}</h3>
      <div style={{ height }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

// 圓餅圖組件
interface PieChartProps extends BaseChartProps {
  data: PieChartData;
  type?: 'pie' | 'doughnut';
  showPercentages?: boolean;
  showValues?: boolean;
}

export function PieChart({
  data,
  className = '',
  loading = false,
  error,
  height = 400,
  type = 'pie',
  showPercentages = true,
  showValues = false,
  showLegend = true
}: PieChartProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingIndicator size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center text-red-500" style={{ height }}>
          <div className="text-center">
            <p className="font-medium">載入圖表時發生錯誤</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: data.data.map(item => item.label),
    datasets: [
      {
        data: data.data.map(item => item.value),
        backgroundColor: data.data.map(item => item.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          generateLabels: function(chart: any) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            labels.forEach((label: any, index: number) => {
              const item = data.data[index];
              if (showPercentages && showValues) {
                label.text = `${item.label} (${item.percentage}%, ${item.value.toLocaleString()})`;
              } else if (showPercentages) {
                label.text = `${item.label} (${item.percentage}%)`;
              } else if (showValues) {
                label.text = `${item.label} (${item.value.toLocaleString()})`;
              }
            });
            
            return labels;
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const item = data.data[context.dataIndex];
            return `${item.label}: ${item.value.toLocaleString()} (${item.percentage}%)`;
          },
        },
      },
    },
    cutout: type === 'doughnut' ? '60%' : '0%',
  };

  const ChartComponent = type === 'doughnut' ? Doughnut : Pie;

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{data.title}</h3>
      <div style={{ height }}>
        <ChartComponent data={chartData} options={options} />
      </div>
    </Card>
  );
}

// 組合圖表組件
interface ComboChartProps extends BaseChartProps {
  lineData: TrendChartData;
  barData: BarChartData;
  title: string;
}

export function ComboChart({
  lineData,
  barData,
  title,
  className = '',
  loading = false,
  error,
  height = 400,
  showLegend = true
}: ComboChartProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingIndicator size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center text-red-500" style={{ height }}>
          <div className="text-center">
            <p className="font-medium">載入圖表時發生錯誤</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: lineData.data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        type: 'line' as const,
        label: lineData.title,
        data: lineData.data.map(point => point.value),
        borderColor: lineData.color,
        backgroundColor: lineData.color + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: barData.title,
        data: barData.data.map(item => item.value),
        backgroundColor: '#10B981' + '60',
        borderColor: '#10B981',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: '#f3f4f6',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          display: true,
          color: '#f3f4f6',
        },
        title: {
          display: true,
          text: lineData.yAxisLabel,
          color: '#374151',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: barData.yAxisLabel,
          color: '#374151',
        },
      },
    },
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div style={{ height }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

// 小型指標圖表（Sparkline）
interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
  height?: number;
}

export function Sparkline({ 
  data, 
  color = '#3B82F6', 
  className = '',
  height = 60 
}: SparklineProps) {
  const chartData = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div className={className} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}