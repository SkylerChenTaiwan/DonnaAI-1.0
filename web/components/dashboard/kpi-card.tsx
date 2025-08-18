/**
 * KPI 指標卡片組件
 * 顯示關鍵業務指標和變化趨勢
 */

'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Briefcase, 
  Star, 
  Clock,
  Activity,
  Target,
  BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/charts/chart-components';
import type { KPIMetric } from '@/services/analytics.service';

// 圖標映射
const iconMap = {
  users: Users,
  'dollar-sign': DollarSign,
  briefcase: Briefcase,
  star: Star,
  clock: Clock,
  'trending-up': TrendingUp,
  activity: Activity,
  target: Target,
  'bar-chart': BarChart3,
};

// KPI 卡片屬性
interface KPICardProps {
  metric: KPIMetric;
  className?: string;
  showSparkline?: boolean;
  sparklineData?: number[];
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function KPICard({
  metric,
  className = '',
  showSparkline = false,
  sparklineData,
  size = 'md',
  onClick
}: KPICardProps) {
  const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Activity;
  
  // 格式化數值
  const formatValue = (value: number, unit: string): string => {
    if (unit === 'NT$') {
      if (value >= 1000000) {
        return `NT$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `NT$${(value / 1000).toFixed(0)}K`;
      } else {
        return `NT$${value.toLocaleString()}`;
      }
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === '/5.0') {
      return `${value.toFixed(1)}/5.0`;
    } else {
      return `${value.toLocaleString()}${unit !== '位' && unit !== '筆' && unit !== '項' ? ` ${unit}` : unit}`;
    }
  };

  // 格式化變化百分比
  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // 尺寸樣式
  const sizeStyles = {
    sm: {
      card: 'p-4',
      icon: 'w-8 h-8',
      iconContainer: 'w-10 h-10',
      title: 'text-xs',
      value: 'text-lg',
      change: 'text-xs',
    },
    md: {
      card: 'p-6',
      icon: 'w-8 h-8',
      iconContainer: 'w-12 h-12',
      title: 'text-sm',
      value: 'text-2xl',
      change: 'text-sm',
    },
    lg: {
      card: 'p-8',
      icon: 'w-10 h-10',
      iconContainer: 'w-16 h-16',
      title: 'text-base',
      value: 'text-3xl',
      change: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  // 變化趨勢顏色
  const changeColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  // 圖標容器顏色
  const getIconColor = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return 'bg-green-100 text-green-600';
      case 'negative':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <Card 
      className={`${styles.card} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* 左側內容 */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {/* 指標名稱 */}
            <p className={`${styles.title} font-medium text-gray-600 truncate`}>
              {metric.name}
            </p>
            
            {/* 圖標 */}
            <div className={`${styles.iconContainer} rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${getIconColor(metric.changeType)}`}>
              <IconComponent className={styles.icon} />
            </div>
          </div>
          
          {/* 數值 */}
          <div className="mt-2">
            <p className={`${styles.value} font-bold text-gray-900`}>
              {formatValue(metric.value, metric.unit)}
            </p>
          </div>
          
          {/* 變化趨勢 */}
          <div className="mt-3 flex items-center justify-between">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${styles.change} font-medium ${changeColor[metric.changeType]}`}>
              {metric.changeType === 'positive' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : metric.changeType === 'negative' ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : null}
              {formatChange(metric.change)}
            </div>
            
            {/* Sparkline */}
            {showSparkline && sparklineData && (
              <div className="flex-1 ml-3">
                <Sparkline 
                  data={sparklineData}
                  color={metric.changeType === 'positive' ? '#10B981' : metric.changeType === 'negative' ? '#EF4444' : '#3B82F6'}
                  height={24}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 描述文字 */}
      {metric.description && size !== 'sm' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {metric.description}
          </p>
        </div>
      )}
    </Card>
  );
}

// KPI 網格組件
interface KPIGridProps {
  metrics: KPIMetric[];
  className?: string;
  columns?: 2 | 3 | 4 | 6;
  size?: 'sm' | 'md' | 'lg';
  showSparklines?: boolean;
  sparklineData?: Record<string, number[]>;
  onKPIClick?: (metric: KPIMetric) => void;
  loading?: boolean;
}

export function KPIGrid({
  metrics,
  className = '',
  columns = 4,
  size = 'md',
  showSparklines = false,
  sparklineData = {},
  onKPIClick,
  loading = false
}: KPIGridProps) {
  if (loading) {
    // 載入骨架
    const skeletonCards = Array.from({ length: columns }, (_, index) => (
      <Card key={index} className="p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </Card>
    ));
    
    return (
      <div className={`grid gap-6 ${getGridCols(columns)} ${className}`}>
        {skeletonCards}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${getGridCols(columns)} ${className}`}>
      {metrics.map((metric) => (
        <KPICard
          key={metric.id}
          metric={metric}
          size={size}
          showSparkline={showSparklines}
          sparklineData={sparklineData[metric.id]}
          onClick={onKPIClick ? () => onKPIClick(metric) : undefined}
        />
      ))}
    </div>
  );
}

// 輔助函數：獲取網格列數樣式
function getGridCols(columns: number): string {
  const gridMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };
  return gridMap[columns as keyof typeof gridMap] || gridMap[4];
}

// 比較 KPI 卡片（顯示多個時期的比較）
interface ComparisonKPICardProps {
  metric: KPIMetric;
  comparisons: {
    period: string;
    value: number;
    change?: number;
  }[];
  className?: string;
}

export function ComparisonKPICard({
  metric,
  comparisons,
  className = ''
}: ComparisonKPICardProps) {
  const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Activity;
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600`}>
            <IconComponent className="w-8 h-8" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{metric.name}</h3>
            <p className="text-xs text-gray-500">多期比較</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {comparisons.map((comparison, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{comparison.period}</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 mr-2">
                {comparison.value.toLocaleString()}{metric.unit}
              </span>
              {comparison.change !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  comparison.change >= 0 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  {comparison.change >= 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}