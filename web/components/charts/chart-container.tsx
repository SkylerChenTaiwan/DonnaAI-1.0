/**
 * 圖表容器元件
 * 提供統一的圖表渲染和配置介面
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useRealTimeMetrics } from '@/hooks/use-real-time-data';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Settings, 
  Download, 
  RefreshCw,
  Maximize2,
  Filter,
  Calendar,
  Info,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 圖表資料介面
export interface ChartData {
  id: string;
  name: string;
  value: number;
  category?: string;
  date?: string;
  metadata?: Record<string, any>;
}

// 圖表配置介面
export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  data: ChartData[];
  
  // 樣式配置
  colors?: string[];
  theme?: 'light' | 'dark';
  animated?: boolean;
  
  // 資料配置
  xAxis?: {
    key: string;
    label?: string;
    format?: 'date' | 'number' | 'text';
  };
  yAxis?: {
    key: string;
    label?: string;
    format?: 'currency' | 'percentage' | 'number';
  };
  
  // 互動配置
  interactive?: boolean;
  zoomable?: boolean;
  clickable?: boolean;
  
  // 時間範圍
  timeRange?: {
    start: Date;
    end: Date;
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  
  // 篩選配置
  filters?: ChartFilter[];
  
  // 導出配置
  exportable?: boolean;
  exportFormats?: ('png' | 'svg' | 'pdf' | 'csv')[];
}

// 圖表類型
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'area' 
  | 'scatter' 
  | 'column' 
  | 'donut'
  | 'heatmap'
  | 'funnel'
  | 'gauge';

// 圖表篩選器
export interface ChartFilter {
  key: string;
  label: string;
  type: 'select' | 'range' | 'date' | 'multi-select';
  options?: { value: string; label: string }[];
  value?: any;
}

// 時間範圍選項
export const TIME_RANGE_OPTIONS = [
  { value: '7d', label: '過去 7 天' },
  { value: '30d', label: '過去 30 天' },
  { value: '90d', label: '過去 3 個月' },
  { value: '6m', label: '過去 6 個月' },
  { value: '1y', label: '過去 1 年' },
  { value: 'custom', label: '自訂範圍' },
];

// 圖表容器屬性
interface ChartContainerProps {
  config: ChartConfig;
  isLoading?: boolean;
  error?: string;
  onConfigChange?: (config: Partial<ChartConfig>) => void;
  onRefresh?: () => void;
  onExport?: (format: string) => void;
  onFullscreen?: () => void;
  className?: string;
}

export function ChartContainer({
  config,
  isLoading = false,
  error,
  onConfigChange,
  onRefresh,
  onExport,
  onFullscreen,
  className
}: ChartContainerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // 即時指標更新
  const { isConnected } = useRealTimeMetrics((data) => {
    // 當收到即時更新時，觸發重新載入
    if (data && onRefresh) {
      setLastUpdateTime(new Date());
      onRefresh();
    }
  });

  // 圖表類型圖標對應
  const chartIcons = {
    line: LineChart,
    bar: BarChart,
    pie: PieChart,
    area: TrendingUp,
    scatter: TrendingUp,
    column: BarChart,
    donut: PieChart,
    heatmap: BarChart,
    funnel: BarChart,
    gauge: PieChart,
  };

  // 處理圖表類型變更
  const handleChartTypeChange = useCallback((newType: ChartType) => {
    onConfigChange?.({ type: newType });
  }, [onConfigChange]);

  // 處理時間範圍變更
  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
    // TODO: 實作時間範圍邏輯
    if (range !== 'custom') {
      // 計算時間範圍並更新配置
      const end = new Date();
      let start = new Date();
      
      switch (range) {
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
        case '90d':
          start.setDate(end.getDate() - 90);
          break;
        case '6m':
          start.setMonth(end.getMonth() - 6);
          break;
        case '1y':
          start.setFullYear(end.getFullYear() - 1);
          break;
      }
      
      onConfigChange?.({
        timeRange: {
          start,
          end,
          granularity: range === '7d' ? 'day' : range === '30d' ? 'day' : 'week'
        }
      });
    }
  }, [onConfigChange]);

  // 處理導出
  const handleExport = useCallback((format: string) => {
    onExport?.(format);
  }, [onExport]);

  // 渲染圖表內容
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">載入圖表資料中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">載入圖表時發生錯誤</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              重試
            </Button>
          )}
        </div>
      );
    }

    if (!config.data || config.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {React.createElement(chartIcons[config.type], { 
              className: "w-8 h-8 text-gray-400" 
            })}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暫無資料</h3>
          <p className="text-sm text-gray-500">目前沒有可顯示的圖表資料</p>
        </div>
      );
    }

    // 實際圖表渲染 (目前顯示模擬內容)
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center">
          {React.createElement(chartIcons[config.type], { 
            className: "w-16 h-16 text-blue-500 mx-auto mb-4" 
          })}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {config.type.charAt(0).toUpperCase() + config.type.slice(1)} 圖表
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            顯示 {config.data.length} 筆資料
          </p>
          <Badge variant="outline">
            {config.timeRange?.granularity || 'daily'} 粒度
          </Badge>
        </div>
      </div>
    );
  };

  // 渲染工具列
  const renderToolbar = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-3">
        {/* 圖表標題 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          {config.subtitle && (
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          )}
        </div>
        
        {/* 資料狀態指示 */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {config.data?.length || 0} 筆資料
          </Badge>
          {config.timeRange && (
            <Badge variant="outline" className="text-xs">
              {selectedTimeRange}
            </Badge>
          )}
          {/* 即時更新狀態 */}
          <div className={cn(
            "flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs",
            isConnected ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span>即時</span>
          </div>
          {lastUpdateTime && (
            <Badge variant="outline" className="text-xs text-blue-600">
              更新: {lastUpdateTime.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </Badge>
          )}
        </div>
      </div>

      {/* 工具按鈕 */}
      <div className="flex items-center space-x-2">
        {/* 時間範圍選擇器 */}
        <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-32">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 圖表類型選擇器 */}
        <Select 
          value={config.type} 
          onValueChange={(value) => handleChartTypeChange(value as ChartType)}
        >
          <SelectTrigger className="w-24">
            {React.createElement(chartIcons[config.type], { className: "w-4 h-4" })}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChart className="w-4 h-4 mr-2" />
                線圖
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                條圖
              </div>
            </SelectItem>
            <SelectItem value="pie">
              <div className="flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                圓餅圖
              </div>
            </SelectItem>
            <SelectItem value="area">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                面積圖
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 刷新按鈕 */}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}

        {/* 設定按鈕 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* 全螢幕按鈕 */}
        {onFullscreen && (
          <Button variant="outline" size="sm" onClick={onFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}

        {/* 導出按鈕 */}
        {config.exportable && (
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="py-1">
                {(config.exportFormats || ['png', 'svg', 'csv']).map(format => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    導出為 {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染設定面板
  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-3">圖表設定</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 動畫設定 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.animated !== false}
                onChange={(e) => onConfigChange?.({ animated: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">動畫效果</span>
            </label>
          </div>

          {/* 互動設定 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.interactive !== false}
                onChange={(e) => onConfigChange?.({ interactive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">互動模式</span>
            </label>
          </div>

          {/* 縮放設定 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.zoomable === true}
                onChange={(e) => onConfigChange?.({ zoomable: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">允許縮放</span>
            </label>
          </div>
        </div>

        {/* 顏色主題 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            顏色主題
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={config.theme !== 'dark'}
                onChange={() => onConfigChange?.({ theme: 'light' })}
                className="rounded-full"
              />
              <span className="text-sm text-gray-700">淺色</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={config.theme === 'dark'}
                onChange={() => onConfigChange?.({ theme: 'dark' })}
                className="rounded-full"
              />
              <span className="text-sm text-gray-700">深色</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* 工具列 */}
      {renderToolbar()}
      
      {/* 圖表內容 */}
      <div className="p-4">
        {renderChart()}
      </div>

      {/* 設定面板 */}
      {renderSettings()}

      {/* 圖表資訊 */}
      {config.timeRange && (
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center">
          <Info className="w-3 h-3 mr-1" />
          資料時間範圍: {config.timeRange.start.toLocaleDateString()} - {config.timeRange.end.toLocaleDateString()}
          <span className="ml-2">
            粒度: {config.timeRange.granularity}
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * 圖表網格容器
 */
interface ChartsGridProps {
  charts: ChartConfig[];
  isLoading?: boolean;
  onChartConfigChange?: (chartId: string, config: Partial<ChartConfig>) => void;
  onChartRefresh?: (chartId: string) => void;
  onChartExport?: (chartId: string, format: string) => void;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ChartsGrid({
  charts,
  isLoading = false,
  onChartConfigChange,
  onChartRefresh,
  onChartExport,
  columns = 2,
  className
}: ChartsGridProps) {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid gap-6",
      gridColsClass[columns],
      className
    )}>
      {charts.map((chart) => (
        <ChartContainer
          key={chart.id}
          config={chart}
          isLoading={isLoading}
          onConfigChange={(updates) => onChartConfigChange?.(chart.id, updates)}
          onRefresh={() => onChartRefresh?.(chart.id)}
          onExport={(format) => onChartExport?.(chart.id, format)}
        />
      ))}
    </div>
  );
}