/**
 * 智能查詢執行服務
 * 根據自然語言解析結果執行資料查詢
 */

import { Timestamp } from 'firebase/firestore';
import {
  QueryInterpretation,
  ChartData,
  ChartDataset,
  DataPoint,
  ChartType
} from '../../types/data-visualization';
import { getTeamDashboardData, getUserWorkloadStats } from './cross-db-queries';
import { getCustomers } from './customers';
import { getRecords } from './records';
import { getTasks } from './tasks';
import { getOrganizationAIUsageStats } from './cross-db-queries';

/**
 * 執行視覺化查詢
 */
export async function executeVisualizationQuery(
  interpretation: QueryInterpretation,
  userId: string,
  organizationId: string,
  teamIds: string[]
): Promise<ChartData> {
  const { entities, suggestedChartType } = interpretation;
  const startTime = Date.now();

  try {
    // 根據資料類型獲取原始資料
    const rawData = await fetchRawData(
      entities.dataType,
      userId,
      organizationId,
      teamIds,
      entities.filters,
      entities.timeRange
    );

    // 處理和聚合資料
    const processedData = await processDataForChart(
      rawData,
      entities.metrics,
      entities.dimensions,
      suggestedChartType
    );

    // 生成圖表配置
    const chartConfig = generateChartConfig(
      entities.metrics,
      entities.dimensions,
      suggestedChartType
    );

    // 生成標題和描述
    const metadata = generateChartMetadata(
      entities,
      suggestedChartType,
      rawData.length,
      Date.now() - startTime
    );

    // 建立圖表資料
    const chartData: ChartData = {
      id: `chart-${Date.now()}`,
      type: suggestedChartType,
      data: processedData,
      config: chartConfig,
      metadata,
      queryId: `query-${Date.now()}`
    };

    return chartData;
  } catch (error) {
    console.error('執行視覺化查詢失敗:', error);
    throw new Error('無法生成圖表，請確認查詢參數');
  }
}

/**
 * 獲取原始資料
 */
async function fetchRawData(
  dataType: string,
  userId: string,
  organizationId: string,
  teamIds: string[],
  filters: Record<string, any>,
  timeRange?: { start: Date; end: Date }
): Promise<any[]> {
  const teamId = teamIds[0]; // 暫時使用第一個團隊

  switch (dataType) {
    case 'customers':
      return await getCustomers(userId, teamId, {
        ...filters,
        dateFrom: timeRange?.start,
        dateTo: timeRange?.end
      });

    case 'records':
      return await getRecords(userId, {
        teamId,
        ...filters,
        dateFrom: timeRange?.start,
        dateTo: timeRange?.end
      });

    case 'tasks':
      return await getTasks(userId, {
        teamId,
        ...filters,
        dateFrom: timeRange?.start,
        dateTo: timeRange?.end
      });

    case 'aiUsage':
      // 獲取 AI 使用統計
      const stats = await getOrganizationAIUsageStats(organizationId, userId);
      return stats.processingTrends || [];

    default:
      throw new Error(`不支援的資料類型: ${dataType}`);
  }
}

/**
 * 處理資料為圖表格式
 */
async function processDataForChart(
  rawData: any[],
  metrics: string[],
  dimensions: string[],
  chartType: ChartType
): Promise<any> {
  if (rawData.length === 0) {
    return [];
  }

  const primaryDimension = dimensions[0] || 'category';
  const primaryMetric = metrics[0] || 'count';

  // 根據圖表類型處理資料
  switch (chartType) {
    case 'bar':
    case 'line':
      return processForBarOrLineChart(rawData, primaryMetric, primaryDimension);

    case 'pie':
      return processForPieChart(rawData, primaryMetric, primaryDimension);

    case 'grouped-bar':
    case 'stacked-bar':
      return processForGroupedChart(rawData, metrics, dimensions);

    case 'scatter':
      return processForScatterChart(rawData, metrics);

    default:
      return processForBarOrLineChart(rawData, primaryMetric, primaryDimension);
  }
}

/**
 * 處理長條圖或折線圖資料
 */
function processForBarOrLineChart(
  data: any[],
  metric: string,
  dimension: string
): DataPoint[] {
  const grouped = groupByDimension(data, dimension);
  
  return Object.entries(grouped).map(([key, items]) => ({
    x: formatDimensionValue(key, dimension),
    y: calculateMetric(items, metric),
    label: `${key}: ${calculateMetric(items, metric)}`
  }));
}

/**
 * 處理圓餅圖資料
 */
function processForPieChart(
  data: any[],
  metric: string,
  dimension: string
): DataPoint[] {
  const grouped = groupByDimension(data, dimension);
  
  return Object.entries(grouped).map(([key, items]) => ({
    x: formatDimensionValue(key, dimension),
    y: calculateMetric(items, metric),
    label: key,
    value: calculateMetric(items, metric)
  }));
}

/**
 * 處理分組圖表資料
 */
function processForGroupedChart(
  data: any[],
  metrics: string[],
  dimensions: string[]
): ChartDataset[] {
  const primaryDimension = dimensions[0];
  const secondaryDimension = dimensions[1] || 'category';
  
  // 先按次要維度分組
  const secondaryGroups = groupByDimension(data, secondaryDimension);
  
  return Object.entries(secondaryGroups).map(([groupKey, groupData]) => {
    // 再按主要維度分組
    const primaryGroups = groupByDimension(groupData, primaryDimension);
    
    const dataPoints = Object.entries(primaryGroups).map(([key, items]) => ({
      x: formatDimensionValue(key, primaryDimension),
      y: calculateMetric(items, metrics[0])
    }));
    
    return {
      label: groupKey,
      data: dataPoints
    };
  });
}

/**
 * 處理散點圖資料
 */
function processForScatterChart(
  data: any[],
  metrics: string[]
): DataPoint[] {
  const xMetric = metrics[0] || 'value1';
  const yMetric = metrics[1] || 'value2';
  
  return data.map(item => ({
    x: getMetricValue(item, xMetric),
    y: getMetricValue(item, yMetric),
    label: item.name || item.title || ''
  }));
}

/**
 * 按維度分組資料
 */
function groupByDimension(data: any[], dimension: string): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  data.forEach(item => {
    const key = getDimensionValue(item, dimension);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  return groups;
}

/**
 * 獲取維度值
 */
function getDimensionValue(item: any, dimension: string): string {
  switch (dimension) {
    case 'time':
      // 按日期分組
      const date = item.createdAt?.toDate?.() || new Date(item.createdAt);
      return date.toLocaleDateString();
      
    case 'user':
      return item.assignedTo || item.createdBy || 'Unknown';
      
    case 'team':
      return item.teamId || 'No Team';
      
    case 'status':
      return item.status || 'Unknown';
      
    case 'type':
      return item.type || 'Other';
      
    case 'priority':
      return item.priority || 'normal';
      
    default:
      return item[dimension] || 'Other';
  }
}

/**
 * 計算指標值
 */
function calculateMetric(items: any[], metric: string): number {
  switch (metric) {
    case 'count':
      return items.length;
      
    case 'sum':
      return items.reduce((sum, item) => sum + (getMetricValue(item, 'value') || 0), 0);
      
    case 'average':
      const total = items.reduce((sum, item) => sum + (getMetricValue(item, 'value') || 0), 0);
      return items.length > 0 ? total / items.length : 0;
      
    case 'percentage':
      // 需要總數來計算百分比
      return items.length; // 暫時返回計數
      
    case 'duration':
      return items.reduce((sum, item) => sum + (item.duration || 0), 0);
      
    default:
      return items.length;
  }
}

/**
 * 獲取指標值
 */
function getMetricValue(item: any, metric: string): number {
  switch (metric) {
    case 'duration':
      return item.duration || 0;
      
    case 'value':
      return item.value || item.amount || 0;
      
    case 'count':
      return 1;
      
    default:
      return Number(item[metric]) || 0;
  }
}

/**
 * 格式化維度值
 */
function formatDimensionValue(value: string, dimension: string): string {
  switch (dimension) {
    case 'time':
      // 簡化日期顯示
      const date = new Date(value);
      return `${date.getMonth() + 1}/${date.getDate()}`;
      
    case 'user':
      // 顯示用戶名稱或 ID
      return value.split('@')[0] || value;
      
    default:
      return value;
  }
}

/**
 * 生成圖表配置
 */
function generateChartConfig(
  metrics: string[],
  dimensions: string[],
  chartType: ChartType
): any {
  const config: any = {
    enableTooltip: true,
    enableLegend: chartType === 'pie' || chartType.includes('grouped'),
    animate: true,
    animationDuration: 500
  };
  
  // X 軸配置
  if (dimensions[0] === 'time') {
    config.xAxis = {
      label: '日期',
      tickFormat: (d: any) => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    };
  } else {
    config.xAxis = {
      label: getDimensionLabel(dimensions[0])
    };
  }
  
  // Y 軸配置
  config.yAxis = {
    label: getMetricLabel(metrics[0])
  };
  
  return config;
}

/**
 * 生成圖表元資料
 */
function generateChartMetadata(
  entities: QueryInterpretation['entities'],
  chartType: ChartType,
  recordCount: number,
  processingTime: number
): any {
  const dataTypeLabels: Record<string, string> = {
    customers: '客戶',
    records: '紀錄',
    tasks: '任務',
    aiUsage: 'AI使用'
  };
  
  const title = generateChartTitle(entities, chartType);
  const description = generateChartDescription(entities);
  
  return {
    title,
    description,
    generatedAt: new Date(),
    dataSource: entities.dataType,
    metrics: entities.metrics,
    dimensions: entities.dimensions,
    filters: entities.filters,
    timeRange: entities.timeRange,
    recordCount
  };
}

/**
 * 生成圖表標題
 */
function generateChartTitle(
  entities: QueryInterpretation['entities'],
  chartType: ChartType
): string {
  const dataTypeLabel = getDataTypeLabel(entities.dataType);
  const metricLabel = getMetricLabel(entities.metrics[0]);
  const dimensionLabel = getDimensionLabel(entities.dimensions[0]);
  
  if (entities.timeRange) {
    const start = entities.timeRange.start.toLocaleDateString();
    const end = entities.timeRange.end.toLocaleDateString();
    return `${dataTypeLabel}${metricLabel} - ${dimensionLabel}分析 (${start} - ${end})`;
  }
  
  return `${dataTypeLabel}${metricLabel} - ${dimensionLabel}分析`;
}

/**
 * 生成圖表描述
 */
function generateChartDescription(entities: QueryInterpretation['entities']): string {
  const filters = Object.entries(entities.filters || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
    
  if (filters) {
    return `篩選條件: ${filters}`;
  }
  
  return '';
}

/**
 * 獲取資料類型標籤
 */
function getDataTypeLabel(dataType: string): string {
  const labels: Record<string, string> = {
    customers: '客戶',
    records: '紀錄',
    tasks: '任務',
    aiUsage: 'AI使用'
  };
  return labels[dataType] || dataType;
}

/**
 * 獲取指標標籤
 */
function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    count: '數量',
    sum: '總和',
    average: '平均',
    percentage: '百分比',
    duration: '時長'
  };
  return labels[metric] || metric;
}

/**
 * 獲取維度標籤
 */
function getDimensionLabel(dimension: string): string {
  const labels: Record<string, string> = {
    time: '時間',
    user: '用戶',
    team: '團隊',
    status: '狀態',
    type: '類型',
    priority: '優先級'
  };
  return labels[dimension] || dimension;
}