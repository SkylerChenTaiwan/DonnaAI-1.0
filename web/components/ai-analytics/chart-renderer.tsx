/**
 * PRP-124 Phase 3: Dynamic Chart Rendering System
 * 
 * @description 動態圖表渲染系統，支援多種圖表類型和互動功能
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Maximize2,
  Settings,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ChartType,
  ChartConfig,
  ChartData,
  DataRow,
  ColumnDefinition
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 介面定義
// ============================================================================

interface ChartRendererProps {
  /** 圖表類型 */
  type: ChartType;
  /** 圖表資料 */
  data: unknown;
  /** 圖表配置 */
  config: ChartConfig;
  /** 是否啟用互動功能 */
  interactive?: boolean;
  /** 自訂 CSS 類別 */
  className?: string;
  /** 高度 */
  height?: number;
  /** 是否顯示工具列 */
  showToolbar?: boolean;
  /** 是否顯示標題 */
  showTitle?: boolean;
  /** 載入狀態 */
  loading?: boolean;
  /** 錯誤訊息 */
  error?: string;
  /** 圖表點擊事件 */
  onChartClick?: (data: any) => void;
  /** 資料變更事件 */
  onDataChange?: (data: any) => void;
}

interface ChartToolbarProps {
  type: ChartType;
  config: ChartConfig;
  onTypeChange: (type: ChartType) => void;
  onConfigChange: (config: Partial<ChartConfig>) => void;
  onExport: () => void;
  onRefresh: () => void;
}

// ============================================================================
// 顏色主題
// ============================================================================

const COLOR_SCHEMES = {
  default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
  blue: ['#EBF8FF', '#BEE3F8', '#90CDF4', '#63B3ED', '#4299E0', '#3182CE', '#2C5282', '#2A4365'],
  green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D'],
  purple: ['#FAF5FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#6B21A8'],
  warm: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E']
};

// ============================================================================
// 工具函數
// ============================================================================

const formatValue = (value: any, format?: string): string => {
  if (typeof value !== 'number') return String(value);
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD'
      }).format(value);
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'integer':
      return Math.round(value).toString();
    default:
      return new Intl.NumberFormat('zh-TW').format(value);
  }
};

const getChartIcon = (type: ChartType) => {
  switch (type) {
    case 'line': return Activity;
    case 'bar': return BarChart3;
    case 'pie': return PieChartIcon;
    case 'scatter': return Zap;
    case 'radar': return Target;
    default: return BarChart3;
  }
};

// ============================================================================
// 圖表工具列組件
// ============================================================================

function ChartToolbar({
  type,
  config,
  onTypeChange,
  onConfigChange,
  onExport,
  onRefresh
}: ChartToolbarProps) {
  const [showOptions, setShowOptions] = useState(false);

  const chartTypes: { type: ChartType; label: string; icon: any }[] = [
    { type: 'line', label: '線圖', icon: Activity },
    { type: 'bar', label: '長條圖', icon: BarChart3 },
    { type: 'pie', label: '圓餅圖', icon: PieChartIcon },
    { type: 'scatter', label: '散佈圖', icon: Zap },
    { type: 'radar', label: '雷達圖', icon: Target }
  ];

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border border-gray-200">
          {chartTypes.map(({ type: chartType, label, icon: Icon }) => (
            <Button
              key={chartType}
              variant={type === chartType ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTypeChange(chartType)}
              className={cn(
                "h-7 px-2 text-xs",
                type === chartType && "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <Badge variant="outline" className="text-xs">
          {config.title || '無標題'}
        </Badge>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          className="h-7 px-2 text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          設定
          {showOptions ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-7 px-2"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-7 px-2"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg p-3 shadow-lg z-10"
          >
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">主題</label>
                <select 
                  className="w-full p-1 border border-gray-300 rounded"
                  value={config.styling?.theme || 'light'}
                  onChange={(e) => onConfigChange({
                    styling: {
                      ...config.styling,
                      theme: e.target.value as 'light' | 'dark'
                    }
                  })}
                >
                  <option value="light">淺色</option>
                  <option value="dark">深色</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">顏色方案</label>
                <select 
                  className="w-full p-1 border border-gray-300 rounded"
                  value="default"
                  onChange={(e) => onConfigChange({
                    styling: {
                      ...config.styling,
                      colorScheme: COLOR_SCHEMES[e.target.value as keyof typeof COLOR_SCHEMES]
                    }
                  })}
                >
                  <option value="default">預設</option>
                  <option value="blue">藍色</option>
                  <option value="green">綠色</option>
                  <option value="purple">紫色</option>
                  <option value="warm">暖色</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={config.styling?.grid !== false}
                    onChange={(e) => onConfigChange({
                      styling: {
                        ...config.styling,
                        grid: e.target.checked
                      }
                    })}
                  />
                  <span>顯示網格</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 自訂 Tooltip 組件
// ============================================================================

function CustomTooltip({ active, payload, label, config }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">
            {entry.name}: <span className="font-medium">{formatValue(entry.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 圖表渲染組件
// ============================================================================

function LineChartRenderer({ data, config, onChartClick }: any) {
  const colors = config.styling?.colorScheme || COLOR_SCHEMES.default;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} onClick={onChartClick}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey={config.dataBinding.xAxis?.field}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => formatValue(value, config.dataBinding.yAxis?.format)}
        />
        <Tooltip content={<CustomTooltip config={config} />} />
        {config.styling?.legend?.show && <Legend />}
        
        {config.dataBinding.series?.map((series: any, index: number) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey={series.dataField}
            stroke={series.color || colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={series.name}
          />
        )) || (
          <Line
            type="monotone"
            dataKey={config.dataBinding.yAxis?.field}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartRenderer({ data, config, onChartClick }: any) {
  const colors = config.styling?.colorScheme || COLOR_SCHEMES.default;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} onClick={onChartClick}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey={config.dataBinding.xAxis?.field}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatValue(value, config.dataBinding.yAxis?.format)}
        />
        <Tooltip content={<CustomTooltip config={config} />} />
        {config.styling?.legend?.show && <Legend />}
        
        {config.dataBinding.series?.map((series: any, index: number) => (
          <Bar
            key={series.name}
            dataKey={series.dataField}
            fill={series.color || colors[index % colors.length]}
            name={series.name}
            radius={[2, 2, 0, 0]}
          />
        )) || (
          <Bar
            dataKey={config.dataBinding.yAxis?.field}
            fill={colors[0]}
            radius={[2, 2, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartRenderer({ data, config, onChartClick }: any) {
  const colors = config.styling?.colorScheme || COLOR_SCHEMES.default;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart onClick={onChartClick}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey={config.dataBinding.yAxis?.field}
          nameKey={config.dataBinding.xAxis?.field}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip config={config} />} />
        {config.styling?.legend?.show && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

function AreaChartRenderer({ data, config, onChartClick }: any) {
  const colors = config.styling?.colorScheme || COLOR_SCHEMES.default;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} onClick={onChartClick}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={config.dataBinding.xAxis?.field} />
        <YAxis tickFormatter={(value) => formatValue(value, config.dataBinding.yAxis?.format)} />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Area
          type="monotone"
          dataKey={config.dataBinding.yAxis?.field}
          stroke={colors[0]}
          fillOpacity={1}
          fill="url(#colorGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ScatterChartRenderer({ data, config, onChartClick }: any) {
  const colors = config.styling?.colorScheme || COLOR_SCHEMES.default;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={data} onClick={onChartClick}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={config.dataBinding.xAxis?.field} />
        <YAxis dataKey={config.dataBinding.yAxis?.field} />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Scatter
          fill={colors[0]}
          name={config.title}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 主要組件
// ============================================================================

export function ChartRenderer({
  type,
  data,
  config,
  interactive = true,
  className,
  height = 300,
  showToolbar = true,
  showTitle = true,
  loading = false,
  error,
  onChartClick,
  onDataChange
}: ChartRendererProps) {
  // ============================================================================
  // State 管理
  // ============================================================================
  
  const [currentType, setCurrentType] = useState<ChartType>(type);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig>(config);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ============================================================================
  // 資料處理
  // ============================================================================

  const processedData = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    
    if (Array.isArray(data)) {
      return data;
    }
    
    // 如果資料是物件格式，嘗試轉換為陣列
    if ('rows' in data && Array.isArray((data as any).rows)) {
      return (data as any).rows;
    }
    
    return [data];
  }, [data]);

  // ============================================================================
  // 事件處理
  // ============================================================================

  const handleTypeChange = useCallback((newType: ChartType) => {
    setCurrentType(newType);
  }, []);

  const handleConfigChange = useCallback((newConfig: Partial<ChartConfig>) => {
    setCurrentConfig(prev => ({
      ...prev,
      ...newConfig,
      styling: {
        ...prev.styling,
        ...newConfig.styling
      }
    }));
  }, []);

  const handleExport = useCallback(() => {
    // TODO: 實作圖表匯出功能
    console.log('匯出圖表');
  }, []);

  const handleRefresh = useCallback(() => {
    if (onDataChange) {
      onDataChange(processedData);
    }
  }, [processedData, onDataChange]);

  // ============================================================================
  // 圖表渲染
  // ============================================================================

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-500">載入圖表中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Info className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">暫無資料</p>
          </div>
        </div>
      );
    }

    const chartProps = {
      data: processedData,
      config: currentConfig,
      onChartClick: interactive ? onChartClick : undefined
    };

    switch (currentType) {
      case 'line':
        return <LineChartRenderer {...chartProps} />;
      case 'bar':
        return <BarChartRenderer {...chartProps} />;
      case 'pie':
        return <PieChartRenderer {...chartProps} />;
      case 'area':
        return <AreaChartRenderer {...chartProps} />;
      case 'scatter':
        return <ScatterChartRenderer {...chartProps} />;
      default:
        return <BarChartRenderer {...chartProps} />;
    }
  };

  // ============================================================================
  // 主要渲染
  // ============================================================================

  return (
    <Card className={cn("relative", className)}>
      {showToolbar && (
        <ChartToolbar
          type={currentType}
          config={currentConfig}
          onTypeChange={handleTypeChange}
          onConfigChange={handleConfigChange}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      )}

      {showTitle && currentConfig.title && (
        <div className="p-4 pb-0">
          <h3 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h3>
          {currentConfig.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{currentConfig.subtitle}</p>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-4"
        style={{ height }}
      >
        {renderChart()}
      </motion.div>

      {/* 全螢幕按鈕 */}
      {interactive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
}

export default ChartRenderer;