/**
 * 圖表資料管理 Hook
 * 負責圖表資料的載入、處理和更新
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChartData, ChartConfig, ChartType } from '@/components/charts/chart-container';

interface ChartDataState {
  data: ChartData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseChartDataOptions {
  chartId: string;
  type: ChartType;
  apiEndpoint?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  transformData?: (rawData: any[]) => ChartData[];
}

interface ChartApiResponse {
  success: boolean;
  data: {
    chartData: any[];
    metadata?: {
      total: number;
      timeRange: {
        start: string;
        end: string;
      };
      granularity: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 圖表資料管理 Hook
 */
export function useChartData(options: UseChartDataOptions) {
  const {
    chartId,
    type,
    apiEndpoint,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 分鐘
    transformData,
  } = options;

  const [state, setState] = useState<ChartDataState>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // 資料載入函數
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      let data: ChartData[] = [];

      if (apiEndpoint) {
        // 從 API 載入資料
        const response = await fetch(apiEndpoint, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const result: ChartApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load chart data');
        }

        const rawData = result.data.chartData || [];
        data = transformData ? transformData(rawData) : rawData;
      } else {
        // 使用模擬資料
        data = generateMockData(type, chartId);
      }

      setState({
        data,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error('Load chart data error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [apiEndpoint, type, chartId, transformData]);

  // 刷新資料
  const refresh = useCallback(() => {
    loadData(false);
  }, [loadData]);

  // 初始載入
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    ...state,
    refresh,
  };
}

/**
 * 多圖表資料管理 Hook
 */
export function useMultiChartData(charts: Array<{ id: string; config: ChartConfig }>) {
  const [chartsData, setChartsData] = useState<Record<string, ChartDataState>>({});

  // 載入單個圖表資料
  const loadChartData = useCallback(async (chartId: string, config: ChartConfig) => {
    setChartsData(prev => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        isLoading: true,
        error: null,
      },
    }));

    try {
      const data = generateMockData(config.type, chartId);
      
      setChartsData(prev => ({
        ...prev,
        [chartId]: {
          data,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        },
      }));

    } catch (error) {
      setChartsData(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  }, []);

  // 載入所有圖表資料
  const loadAllCharts = useCallback(async () => {
    await Promise.all(
      charts.map(chart => loadChartData(chart.id, chart.config))
    );
  }, [charts, loadChartData]);

  // 刷新單個圖表
  const refreshChart = useCallback((chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (chart) {
      loadChartData(chartId, chart.config);
    }
  }, [charts, loadChartData]);

  // 初始載入
  useEffect(() => {
    loadAllCharts();
  }, [loadAllCharts]);

  return {
    chartsData,
    refreshChart,
    refreshAll: loadAllCharts,
  };
}

/**
 * 圖表配置管理 Hook
 */
export function useChartConfig(initialConfig: ChartConfig) {
  const [config, setConfig] = useState<ChartConfig>(initialConfig);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // 重置配置
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // 更新圖表類型
  const updateChartType = useCallback((type: ChartType) => {
    setConfig(prev => ({ ...prev, type }));
  }, []);

  // 更新時間範圍
  const updateTimeRange = useCallback((timeRange: ChartConfig['timeRange']) => {
    setConfig(prev => ({ ...prev, timeRange }));
  }, []);

  // 切換設定
  const toggleSetting = useCallback((key: keyof ChartConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    updateChartType,
    updateTimeRange,
    toggleSetting,
  };
}

/**
 * 生成模擬圖表資料
 */
function generateMockData(type: ChartType, chartId: string): ChartData[] {
  const baseData = {
    line: generateLineChartData,
    bar: generateBarChartData,
    pie: generatePieChartData,
    area: generateAreaChartData,
    scatter: generateScatterChartData,
    column: generateColumnChartData,
    donut: generateDonutChartData,
    heatmap: generateHeatmapData,
    funnel: generateFunnelData,
    gauge: generateGaugeData,
  };

  return baseData[type]?.(chartId) || [];
}

/**
 * 折線圖資料
 */
function generateLineChartData(chartId: string): ChartData[] {
  const data: ChartData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      id: `${chartId}-${i}`,
      name: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 1000) + 500,
      date: date.toISOString(),
      category: 'revenue',
    });
  }

  return data;
}

/**
 * 柱狀圖資料
 */
function generateBarChartData(chartId: string): ChartData[] {
  const categories = ['產品A', '產品B', '產品C', '產品D', '產品E'];
  
  return categories.map((category, index) => ({
    id: `${chartId}-${index}`,
    name: category,
    value: Math.floor(Math.random() * 500) + 100,
    category: 'product',
  }));
}

/**
 * 圓餅圖資料
 */
function generatePieChartData(chartId: string): ChartData[] {
  const segments = [
    { name: '直接流量', color: '#3b82f6' },
    { name: '搜尋引擎', color: '#10b981' },
    { name: '社群媒體', color: '#f59e0b' },
    { name: '廣告投放', color: '#ef4444' },
    { name: '其他來源', color: '#8b5cf6' },
  ];

  return segments.map((segment, index) => ({
    id: `${chartId}-${index}`,
    name: segment.name,
    value: Math.floor(Math.random() * 30) + 10,
    category: 'traffic',
    metadata: { color: segment.color },
  }));
}

/**
 * 面積圖資料
 */
function generateAreaChartData(chartId: string): ChartData[] {
  const data: ChartData[] = [];
  const categories = ['新用戶', '回訪用戶'];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14);

  for (let i = 0; i < 14; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    categories.forEach((category, catIndex) => {
      data.push({
        id: `${chartId}-${i}-${catIndex}`,
        name: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 200) + 50,
        date: date.toISOString(),
        category: category,
      });
    });
  }

  return data;
}

/**
 * 散點圖資料
 */
function generateScatterChartData(chartId: string): ChartData[] {
  const data: ChartData[] = [];
  
  for (let i = 0; i < 50; i++) {
    data.push({
      id: `${chartId}-${i}`,
      name: `數據點 ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      category: 'analysis',
      metadata: {
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
      },
    });
  }

  return data;
}

/**
 * 直條圖資料
 */
function generateColumnChartData(chartId: string): ChartData[] {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  
  return months.map((month, index) => ({
    id: `${chartId}-${index}`,
    name: month,
    value: Math.floor(Math.random() * 800) + 200,
    category: 'monthly',
  }));
}

/**
 * 甜甜圈圖資料
 */
function generateDonutChartData(chartId: string): ChartData[] {
  return generatePieChartData(chartId); // 使用相同的資料結構
}

/**
 * 熱點圖資料
 */
function generateHeatmapData(chartId: string): ChartData[] {
  const data: ChartData[] = [];
  const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  days.forEach((day, dayIndex) => {
    hours.forEach((hour, hourIndex) => {
      data.push({
        id: `${chartId}-${dayIndex}-${hourIndex}`,
        name: `${day} ${hour}`,
        value: Math.floor(Math.random() * 100),
        category: 'heatmap',
        metadata: {
          day: dayIndex,
          hour: hourIndex,
        },
      });
    });
  });

  return data;
}

/**
 * 漏斗圖資料
 */
function generateFunnelData(chartId: string): ChartData[] {
  const stages = [
    { name: '訪問量', value: 10000 },
    { name: '瀏覽產品', value: 5000 },
    { name: '加入購物車', value: 2000 },
    { name: '結帳', value: 800 },
    { name: '完成購買', value: 400 },
  ];

  return stages.map((stage, index) => ({
    id: `${chartId}-${index}`,
    name: stage.name,
    value: stage.value,
    category: 'funnel',
  }));
}

/**
 * 儀表板資料
 */
function generateGaugeData(chartId: string): ChartData[] {
  return [
    {
      id: `${chartId}-gauge`,
      name: '績效指標',
      value: Math.floor(Math.random() * 100),
      category: 'performance',
      metadata: {
        min: 0,
        max: 100,
        target: 80,
      },
    },
  ];
}