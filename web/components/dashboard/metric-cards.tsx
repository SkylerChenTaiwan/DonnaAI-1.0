/**
 * 關鍵指標卡片元件
 * 提供各種業務指標的視覺化展示
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CheckSquare, 
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 指標資料介面
export interface MetricData {
  id: string;
  name: string;
  description?: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  target?: string | number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  category: MetricCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastUpdated?: Date;
  icon?: React.ComponentType<any>;
  color?: string;
  bgColor?: string;
}

// 指標分類
export type MetricCategory = 
  | 'revenue'
  | 'customers' 
  | 'tasks'
  | 'performance'
  | 'growth'
  | 'efficiency'
  | 'quality'
  | 'satisfaction';

// 指標卡片配置
export interface MetricCardConfig {
  layout: 'compact' | 'standard' | 'detailed' | 'mini';
  showChange?: boolean;
  showTrend?: boolean;
  showTarget?: boolean;
  showStatus?: boolean;
  showLastUpdated?: boolean;
  animated?: boolean;
  clickable?: boolean;
}

interface MetricCardProps {
  metric: MetricData;
  config?: MetricCardConfig;
  onClick?: (metric: MetricData) => void;
  className?: string;
}

/**
 * 主要指標卡片組件
 */
export function MetricCard({ 
  metric, 
  config = { layout: 'standard' },
  onClick,
  className 
}: MetricCardProps) {
  const {
    layout = 'standard',
    showChange = true,
    showTrend = true,
    showTarget = false,
    showStatus = true,
    showLastUpdated = false,
    animated = true,
    clickable = true,
  } = config;

  const IconComponent = metric.icon || getDefaultIcon(metric.category);
  
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(metric);
    }
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'string') return value;
    
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'duration':
        return `${value} 天`;
      default:
        return new Intl.NumberFormat('zh-TW').format(value);
    }
  };

  const getChangeColor = () => {
    if (!metric.change) return 'text-gray-500';
    
    const isPositiveGood = ['revenue', 'customers', 'performance', 'growth'].includes(metric.category);
    const isIncrease = metric.change > 0;
    
    if (isIncrease) {
      return isPositiveGood ? 'text-green-600' : 'text-red-600';
    } else {
      return isPositiveGood ? 'text-red-600' : 'text-green-600';
    }
  };

  const getChangeIcon = () => {
    if (!metric.change) return Minus;
    return metric.change > 0 ? ArrowUpRight : ArrowDownRight;
  };

  const getStatusColor = () => {
    switch (metric.status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Mini 佈局
  if (layout === 'mini') {
    return (
      <Card 
        className={cn(
          "p-3 hover:shadow-md transition-all duration-200",
          clickable && "cursor-pointer hover:border-blue-300",
          animated && "hover:scale-105",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 truncate">{metric.name}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatValue(metric.value)}
            </p>
          </div>
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            metric.bgColor || 'bg-blue-100'
          )}>
            <IconComponent className={cn(
              "w-4 h-4",
              metric.color || 'text-blue-600'
            )} />
          </div>
        </div>
      </Card>
    );
  }

  // Compact 佈局
  if (layout === 'compact') {
    return (
      <Card 
        className={cn(
          "p-4 hover:shadow-md transition-all duration-200",
          clickable && "cursor-pointer hover:border-blue-300",
          animated && "hover:scale-102",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {metric.name}
              </p>
              {showStatus && metric.status && (
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor()
                )} />
              )}
            </div>
            
            <div className="flex items-baseline space-x-2">
              <p className="text-xl font-bold text-gray-900">
                {formatValue(metric.value)}
              </p>
              
              {showChange && metric.change !== undefined && (
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  getChangeColor()
                )}>
                  {React.createElement(getChangeIcon(), { className: "w-3 h-3 mr-1" })}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
          </div>

          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center ml-3",
            metric.bgColor || 'bg-blue-100'
          )}>
            <IconComponent className={cn(
              "w-5 h-5",
              metric.color || 'text-blue-600'
            )} />
          </div>
        </div>
      </Card>
    );
  }

  // Standard 佈局（預設）
  if (layout === 'standard') {
    return (
      <Card 
        className={cn(
          "p-6 hover:shadow-md transition-all duration-200",
          clickable && "cursor-pointer hover:border-blue-300",
          animated && "hover:scale-102",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900">
                {metric.name}
              </h3>
              {showStatus && metric.status && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getStatusColor())}
                >
                  {metric.status}
                </Badge>
              )}
            </div>
            {metric.description && (
              <p className="text-xs text-gray-500 mb-2">
                {metric.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              metric.bgColor || 'bg-blue-100'
            )}>
              <IconComponent className={cn(
                "w-6 h-6",
                metric.color || 'text-blue-600'
              )} />
            </div>
            
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(metric.value)}
            </p>
            {metric.unit && (
              <p className="text-sm text-gray-500 mt-1">{metric.unit}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {showChange && metric.change !== undefined && (
              <div className={cn(
                "flex items-center text-sm font-medium",
                getChangeColor()
              )}>
                {React.createElement(getChangeIcon(), { className: "w-4 h-4 mr-1" })}
                <span>{Math.abs(metric.change)}%</span>
                <span className="ml-1 text-gray-500">vs 上期</span>
              </div>
            )}

            {showTarget && metric.target && (
              <div className="text-right">
                <p className="text-xs text-gray-500">目標</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatValue(metric.target)}
                </p>
              </div>
            )}
          </div>

          {showLastUpdated && metric.lastUpdated && (
            <p className="text-xs text-gray-400 text-right">
              更新時間: {metric.lastUpdated.toLocaleString('zh-TW')}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // Detailed 佈局
  if (layout === 'detailed') {
    return (
      <Card 
        className={cn(
          "p-6 hover:shadow-md transition-all duration-200",
          clickable && "cursor-pointer hover:border-blue-300",
          className
        )}
        onClick={handleClick}
      >
        <div className="space-y-4">
          {/* 標題區 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  metric.bgColor || 'bg-blue-100'
                )}>
                  <IconComponent className={cn(
                    "w-5 h-5",
                    metric.color || 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {metric.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {metric.description || `${metric.category} 指標`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showStatus && metric.status && (
                <Badge className={getStatusColor()}>
                  {metric.status}
                </Badge>
              )}
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 數值區 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">當前值</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatValue(metric.value)}
              </p>
              {metric.unit && (
                <p className="text-sm text-gray-500 mt-1">{metric.unit}</p>
              )}
            </div>

            {metric.previousValue && (
              <div>
                <p className="text-sm text-gray-500 mb-1">上期值</p>
                <p className="text-xl font-semibold text-gray-700">
                  {formatValue(metric.previousValue)}
                </p>
              </div>
            )}
          </div>

          {/* 變化和目標區 */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            {showChange && metric.change !== undefined && (
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  metric.change > 0 ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {React.createElement(getChangeIcon(), { 
                    className: cn("w-4 h-4", getChangeColor()) 
                  })}
                </div>
                <div>
                  <p className={cn("text-lg font-semibold", getChangeColor())}>
                    {Math.abs(metric.change)}%
                  </p>
                  <p className="text-xs text-gray-500">環比變化</p>
                </div>
              </div>
            )}

            {showTarget && metric.target && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatValue(metric.target)}
                  </p>
                  <p className="text-xs text-gray-500">目標值</p>
                </div>
              </div>
            )}
          </div>

          {/* 底部資訊 */}
          {showLastUpdated && metric.lastUpdated && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-400 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                最後更新: {metric.lastUpdated.toLocaleString('zh-TW')}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return null;
}

/**
 * 指標卡片網格容器
 */
interface MetricCardsGridProps {
  metrics: MetricData[];
  config?: MetricCardConfig;
  onMetricClick?: (metric: MetricData) => void;
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

export function MetricCardsGrid({ 
  metrics, 
  config,
  onMetricClick,
  columns = 4,
  className 
}: MetricCardsGridProps) {
  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn(
      "grid gap-4",
      gridColsClass[columns],
      className
    )}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          config={config}
          onClick={onMetricClick}
        />
      ))}
    </div>
  );
}

/**
 * 指標摘要卡片（顯示多個相關指標）
 */
interface MetricSummaryCardProps {
  title: string;
  metrics: MetricData[];
  icon?: React.ComponentType<any>;
  className?: string;
}

export function MetricSummaryCard({ 
  title, 
  metrics, 
  icon: IconComponent,
  className 
}: MetricSummaryCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center space-x-3 mb-4">
        {IconComponent && (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.id || index} className="flex items-center justify-between py-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{metric.name}</p>
              {metric.description && (
                <p className="text-xs text-gray-500">{metric.description}</p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {formatValue(metric.value, metric.format)}
              </p>
              {metric.change !== undefined && (
                <p className={cn(
                  "text-xs font-medium",
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * 輔助函數：獲取預設圖標
 */
function getDefaultIcon(category: MetricCategory) {
  const iconMap = {
    revenue: DollarSign,
    customers: Users,
    tasks: CheckSquare,
    performance: Activity,
    growth: TrendingUp,
    efficiency: Target,
    quality: CheckSquare,
    satisfaction: Users,
  };
  
  return iconMap[category] || Activity;
}

/**
 * 輔助函數：格式化數值
 */
function formatValue(
  value: string | number, 
  format?: 'number' | 'currency' | 'percentage' | 'duration'
): string {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
      }).format(value);
    case 'percentage':
      return `${value}%`;
    case 'duration':
      return `${value} 天`;
    default:
      return new Intl.NumberFormat('zh-TW').format(value);
  }
}

/**
 * 預設指標配置
 */
export const defaultMetricConfigs = {
  mini: { layout: 'mini' as const },
  compact: { layout: 'compact' as const, showChange: true, showStatus: true },
  standard: { layout: 'standard' as const, showChange: true, showStatus: true, showTarget: false },
  detailed: { 
    layout: 'detailed' as const, 
    showChange: true, 
    showStatus: true, 
    showTarget: true,
    showLastUpdated: true 
  },
};