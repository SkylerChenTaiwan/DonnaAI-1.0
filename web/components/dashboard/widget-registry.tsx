/**
 * 儀表板小工具註冊系統
 * 管理所有可用的儀表板小工具類型和渲染邏輯
 */

'use client';

import React from 'react';
import { WidgetType, WidgetConfig } from './dashboard-layout';
import { 
  TrendingUp, 
  Users, 
  CheckSquare, 
  PieChart, 
  Bell, 
  Zap, 
  Brain,
  Activity,
  DollarSign,
  Calendar
} from 'lucide-react';

// 小工具元資料介面
export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: WidgetCategory;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize?: { width: number; height: number };
  configurable: boolean;
  requiresData?: boolean;
  permissions?: string[];
}

// 小工具分類
export type WidgetCategory = 
  | 'metrics'
  | 'charts'
  | 'lists'
  | 'notifications'
  | 'tools'
  | 'ai'
  | 'custom';

// 小工具渲染器介面
export interface WidgetRenderer {
  (props: { 
    config: WidgetConfig; 
    data?: any; 
    isLoading?: boolean; 
    error?: string;
    onConfigChange?: (config: Partial<WidgetConfig>) => void;
  }): React.ReactElement;
}

// 小工具註冊項目
interface WidgetRegistration {
  metadata: WidgetMetadata;
  component: WidgetRenderer;
}

/**
 * 小工具註冊表
 */
class WidgetRegistryClass {
  private widgets = new Map<WidgetType, WidgetRegistration>();

  /**
   * 註冊小工具
   */
  register(type: WidgetType, metadata: WidgetMetadata, component: WidgetRenderer): void {
    this.widgets.set(type, { metadata, component });
  }

  /**
   * 獲取小工具元資料
   */
  getMetadata(type: WidgetType): WidgetMetadata | undefined {
    return this.widgets.get(type)?.metadata;
  }

  /**
   * 獲取小工具組件
   */
  getComponent(type: WidgetType): WidgetRenderer | undefined {
    return this.widgets.get(type)?.component;
  }

  /**
   * 獲取所有註冊的小工具
   */
  getAllWidgets(): { type: WidgetType; metadata: WidgetMetadata }[] {
    return Array.from(this.widgets.entries()).map(([type, { metadata }]) => ({
      type,
      metadata,
    }));
  }

  /**
   * 按分類獲取小工具
   */
  getWidgetsByCategory(category: WidgetCategory): { type: WidgetType; metadata: WidgetMetadata }[] {
    return this.getAllWidgets().filter(widget => widget.metadata.category === category);
  }

  /**
   * 檢查小工具是否存在
   */
  hasWidget(type: WidgetType): boolean {
    return this.widgets.has(type);
  }

  /**
   * 渲染小工具
   */
  renderWidget(config: WidgetConfig, props: any = {}): React.ReactElement | null {
    const component = this.getComponent(config.type);
    if (!component) {
      return <div className="p-4 text-center text-gray-500">未知的小工具類型: {config.type}</div>;
    }

    return React.createElement(component, { config, ...props });
  }
}

// 單例模式
export const WidgetRegistry = new WidgetRegistryClass();

/**
 * 指標概覽小工具
 */
const MetricsOverviewWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  // 延遲載入指標卡片組件以避免 SSR 問題
  const [MetricCardsGrid, setMetricCardsGrid] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('./metric-cards').then(module => {
      setMetricCardsGrid(() => module.MetricCardsGrid);
    });
  }, []);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  if (!MetricCardsGrid) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  const rawMetrics = data?.metrics || [];
  
  // 轉換為指標卡片所需格式
  const metrics = rawMetrics.map((metric: any, index: number) => ({
    id: `metric-${index}`,
    name: metric.name,
    description: metric.description,
    value: metric.value,
    change: metric.change,
    changeType: metric.change > 0 ? 'increase' : 'decrease',
    category: getMetricCategory(metric.name),
    priority: 'medium' as const,
    status: getMetricStatus(metric.change),
    format: getMetricFormat(metric.value),
    lastUpdated: new Date(),
  }));

  return (
    <div className="space-y-4">
      {metrics.slice(0, 4).map((metric: any) => (
        <div key={metric.id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getMetricColorClass(metric.category)}`}>
              {React.createElement(getMetricIcon(metric.category), { className: "w-4 h-4 text-white" })}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
              {metric.description && (
                <p className="text-xs text-gray-500">{metric.description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
            {metric.change !== undefined && (
              <p className={`text-xs font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change >= 0 ? '+' : ''}{metric.change}%
              </p>
            )}
          </div>
        </div>
      ))}
      
      {metrics.length === 0 && (
        <div className="text-center py-8">
          <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暫無指標資料</p>
        </div>
      )}
    </div>
  );
};

// 輔助函數：根據指標名稱決定分類
function getMetricCategory(name: string): any {
  if (name.includes('營收') || name.includes('收入') || name.includes('銷售')) return 'revenue';
  if (name.includes('客戶') || name.includes('用戶')) return 'customers';
  if (name.includes('任務') || name.includes('完成')) return 'tasks';
  if (name.includes('效率') || name.includes('績效')) return 'performance';
  return 'performance';
}

// 輔助函數：根據變化決定狀態
function getMetricStatus(change: number): any {
  if (Math.abs(change) < 5) return 'healthy';
  if (Math.abs(change) < 15) return 'warning';
  return 'critical';
}

// 輔助函數：根據值決定格式
function getMetricFormat(value: string): any {
  if (value.includes('$') || value.includes('¥') || value.includes('元')) return 'currency';
  if (value.includes('%')) return 'percentage';
  return 'number';
}

// 輔助函數：獲取指標圖標
function getMetricIcon(category: string) {
  switch (category) {
    case 'revenue': return DollarSign;
    case 'customers': return Users;
    case 'tasks': return CheckSquare;
    case 'performance': return Activity;
    default: return Activity;
  }
}

// 輔助函數：獲取指標顏色類別
function getMetricColorClass(category: string): string {
  switch (category) {
    case 'revenue': return 'bg-green-500';
    case 'customers': return 'bg-blue-500';
    case 'tasks': return 'bg-purple-500';
    case 'performance': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

/**
 * 營收圖表小工具
 */
const RevenueChartWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  // 延遲載入圖表組件以避免 SSR 問題
  const [ChartContainer, setChartContainer] = React.useState<any>(null);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    import('../charts/chart-container').then(module => {
      setChartContainer(() => module.ChartContainer);
    });
  }, []);

  React.useEffect(() => {
    if (data?.metrics) {
      // 轉換指標資料為圖表格式
      const chartData = generateRevenueChartData(data.metrics);
      setChartData(chartData);
    }
  }, [data]);

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  if (!ChartContainer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const chartConfig = {
    id: 'revenue-chart',
    type: 'line' as const,
    title: '營收趨勢',
    subtitle: '過去 30 天營收變化',
    data: chartData,
    animated: true,
    interactive: true,
    exportable: true,
    colors: ['#3b82f6', '#10b981'],
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      granularity: 'day' as const,
    },
  };

  return (
    <div className="h-full">
      <ChartContainer 
        config={chartConfig}
        isLoading={isLoading}
      />
    </div>
  );
};

// 輔助函數：生成營收圖表資料
function generateRevenueChartData(metrics: any[]): any[] {
  const revenueMetric = metrics.find(m => 
    m.name.includes('營收') || m.name.includes('收入')
  );

  if (!revenueMetric) {
    return generateDefaultLineData();
  }

  // 生成過去 30 天的模擬營收資料
  const data = [];
  const baseValue = parseFloat(revenueMetric.value.toString().replace(/[^\d.]/g, '')) || 100000;
  const change = revenueMetric.change || 0;

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 模擬資料波動
    const variance = (Math.random() - 0.5) * 0.2; // ±10% 隨機變化
    const trendEffect = (change / 100) * (29 - i) / 29; // 趨勢效果
    const dailyValue = baseValue * (1 + variance + trendEffect) / 30;

    data.push({
      id: `revenue-${i}`,
      name: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      value: Math.floor(dailyValue),
      date: date.toISOString(),
      category: 'revenue',
    });
  }

  return data;
}

function generateDefaultLineData(): any[] {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      id: `default-${i}`,
      name: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 5000) + 3000,
      date: date.toISOString(),
      category: 'default',
    });
  }
  return data;
}

/**
 * 客戶成長小工具
 */
const CustomerGrowthWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  // 延遲載入圖表組件
  const [ChartContainer, setChartContainer] = React.useState<any>(null);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    import('../charts/chart-container').then(module => {
      setChartContainer(() => module.ChartContainer);
    });
  }, []);

  React.useEffect(() => {
    if (data?.metrics) {
      const chartData = generateCustomerGrowthData(data.metrics);
      setChartData(chartData);
    }
  }, [data]);

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  if (!ChartContainer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const chartConfig = {
    id: 'customer-growth',
    type: 'bar' as const,
    title: '客戶成長',
    subtitle: '每月新增客戶數',
    data: chartData,
    animated: true,
    interactive: true,
    exportable: true,
    colors: ['#10b981', '#059669'],
    timeRange: {
      start: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 個月
      end: new Date(),
      granularity: 'month' as const,
    },
  };

  return (
    <div className="h-full">
      <ChartContainer 
        config={chartConfig}
        isLoading={isLoading}
      />
    </div>
  );
};

// 生成客戶成長資料
function generateCustomerGrowthData(metrics: any[]): any[] {
  const customerMetric = metrics.find(m => 
    m.name.includes('客戶') || m.name.includes('用戶')
  );

  const data = [];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const baseValue = customerMetric ? parseInt(customerMetric.value) || 30 : 30;
  
  months.forEach((month, index) => {
    const variance = Math.floor(Math.random() * 20) - 10; // ±10 變化
    const trend = customerMetric?.change > 0 ? index * 2 : -index * 1; // 趨勢效果
    
    data.push({
      id: `customer-${index}`,
      name: month,
      value: Math.max(baseValue + variance + trend, 5), // 最少 5 個客戶
      category: 'customer',
    });
  });

  return data;
}

/**
 * 任務摘要小工具
 */
const TaskSummaryWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  const tasks = data?.tasks || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">任務概覽</h4>
        <span className="text-xs text-gray-500">{tasks.length} 項任務</span>
      </div>
      
      {tasks.slice(0, 5).map((task: any, index: number) => (
        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
          <CheckSquare className={`w-4 h-4 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-500">截止: {task.dueDate}</p>
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center py-8">
          <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无任务</p>
        </div>
      )}
    </div>
  );
};

/**
 * 團隊績效小工具
 */
const TeamPerformanceWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <p className="text-sm text-gray-500">團隊績效儀表</p>
        <p className="text-xs text-gray-400 mt-1">即將推出</p>
      </div>
    </div>
  );
};

/**
 * 最近活動小工具
 */
const RecentActivitiesWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  const activities = data?.activities || [];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">最近活動</h4>
      
      {activities.slice(0, 4).map((activity: any, index: number) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-500">{activity.timestamp}</p>
          </div>
        </div>
      ))}
      
      {activities.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无活动</p>
        </div>
      )}
    </div>
  );
};

/**
 * AI 洞察小工具
 */
const AIInsightsWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="h-20 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  const insights = data?.insights || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-medium text-gray-900">AI 洞察</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {insights.length} 項洞察
        </Badge>
      </div>
      
      {insights.slice(0, 3).map((insight: any, index: number) => (
        <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 hover:bg-blue-100 transition-colors">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm text-gray-900 font-medium">{insight.title}</p>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs ml-2",
                insight.priority === 'high' ? 'text-red-600 border-red-200' :
                insight.priority === 'medium' ? 'text-yellow-600 border-yellow-200' :
                'text-green-600 border-green-200'
              )}
            >
              {insight.priority}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-600 font-medium">
                可信度: {insight.confidence}%
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">{insight.category}</span>
            </div>
            
            {insight.recommendations && insight.recommendations.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                查看建議
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {insights.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暫無 AI 洞察</p>
          <Button variant="outline" size="sm" className="mt-3">
            生成新洞察
          </Button>
        </div>
      )}

      {insights.length > 3 && (
        <div className="text-center pt-2 border-t">
          <Button variant="ghost" size="sm" className="text-xs">
            查看全部 {insights.length} 項洞察
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * AI 查詢小工具 (新增)
 */
const AIQueryWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  // 延遲載入 AI 查詢組件
  const [AIQueryInterface, setAIQueryInterface] = React.useState<any>(null);

  React.useEffect(() => {
    import('../ai/ai-query-interface').then(module => {
      setAIQueryInterface(() => module.AIQueryInterface);
    });
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  if (!AIQueryInterface) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <AIQueryInterface />
    </div>
  );
};

/**
 * 通知小工具
 */
const NotificationsWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">通知</h4>
        <span className="text-xs text-blue-600">查看全部</span>
      </div>
      
      {notifications.slice(0, 4).map((notification: any, index: number) => (
        <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
          <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{notification.title}</p>
            <p className="text-xs text-gray-500">{notification.time}</p>
          </div>
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      ))}
      
      {notifications.length === 0 && (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无通知</p>
        </div>
      )}
    </div>
  );
};

/**
 * 快速操作小工具
 */
const QuickActionsWidget: WidgetRenderer = ({ config, data }) => {
  const actions = [
    { name: '新增客戶', icon: Users, color: 'bg-blue-500' },
    { name: '建立任務', icon: CheckSquare, color: 'bg-green-500' },
    { name: '安排會議', icon: Calendar, color: 'bg-purple-500' },
    { name: '生成報告', icon: PieChart, color: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <button
          key={index}
          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
            <action.icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-gray-700 text-center">{action.name}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * 自訂圖表小工具
 */
const CustomChartWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <PieChart className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <p className="text-sm text-gray-500">自訂圖表</p>
        <p className="text-xs text-gray-400 mt-1">配置您的專屬圖表</p>
      </div>
    </div>
  );
};

// 註冊所有內建小工具
WidgetRegistry.register('metrics-overview', {
  type: 'metrics-overview',
  name: '指標概覽',
  description: '顯示關鍵業務指標的快速概覽',
  icon: DollarSign,
  category: 'metrics',
  defaultSize: { width: 4, height: 3 },
  minSize: { width: 3, height: 2 },
  maxSize: { width: 6, height: 4 },
  configurable: true,
  requiresData: true,
}, MetricsOverviewWidget);

WidgetRegistry.register('revenue-chart', {
  type: 'revenue-chart',
  name: '營收圖表',
  description: '顯示營收趨勢和變化',
  icon: TrendingUp,
  category: 'charts',
  defaultSize: { width: 6, height: 4 },
  minSize: { width: 4, height: 3 },
  maxSize: { width: 8, height: 6 },
  configurable: true,
  requiresData: true,
}, RevenueChartWidget);

WidgetRegistry.register('customer-growth', {
  type: 'customer-growth',
  name: '客戶成長',
  description: '追蹤客戶數量和成長趨勢',
  icon: Users,
  category: 'charts',
  defaultSize: { width: 4, height: 3 },
  minSize: { width: 3, height: 2 },
  maxSize: { width: 6, height: 4 },
  configurable: true,
  requiresData: true,
}, CustomerGrowthWidget);

WidgetRegistry.register('task-summary', {
  type: 'task-summary',
  name: '任務摘要',
  description: '顯示待辦和已完成的任務',
  icon: CheckSquare,
  category: 'lists',
  defaultSize: { width: 3, height: 4 },
  minSize: { width: 2, height: 3 },
  maxSize: { width: 4, height: 6 },
  configurable: true,
  requiresData: true,
}, TaskSummaryWidget);

WidgetRegistry.register('team-performance', {
  type: 'team-performance',
  name: '團隊績效',
  description: '顯示團隊整體績效指標',
  icon: Activity,
  category: 'metrics',
  defaultSize: { width: 4, height: 3 },
  minSize: { width: 3, height: 2 },
  maxSize: { width: 6, height: 4 },
  configurable: true,
  requiresData: true,
}, TeamPerformanceWidget);

WidgetRegistry.register('recent-activities', {
  type: 'recent-activities',
  name: '最近活動',
  description: '顯示最近的系統活動和更新',
  icon: Activity,
  category: 'lists',
  defaultSize: { width: 3, height: 4 },
  minSize: { width: 3, height: 3 },
  maxSize: { width: 4, height: 6 },
  configurable: false,
  requiresData: true,
}, RecentActivitiesWidget);

WidgetRegistry.register('ai-insights', {
  type: 'ai-insights',
  name: 'AI 洞察',
  description: '顯示 AI 分析產生的業務洞察',
  icon: Brain,
  category: 'ai',
  defaultSize: { width: 4, height: 4 },
  minSize: { width: 3, height: 3 },
  maxSize: { width: 6, height: 6 },
  configurable: true,
  requiresData: true,
}, AIInsightsWidget);

WidgetRegistry.register('notifications', {
  type: 'notifications',
  name: '通知中心',
  description: '顯示系統通知和提醒',
  icon: Bell,
  category: 'notifications',
  defaultSize: { width: 3, height: 4 },
  minSize: { width: 2, height: 3 },
  maxSize: { width: 4, height: 6 },
  configurable: true,
  requiresData: true,
}, NotificationsWidget);

WidgetRegistry.register('quick-actions', {
  type: 'quick-actions',
  name: '快速操作',
  description: '常用功能的快速存取',
  icon: Zap,
  category: 'tools',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 3, height: 3 },
  configurable: false,
  requiresData: false,
}, QuickActionsWidget);

WidgetRegistry.register('custom-chart', {
  type: 'custom-chart',
  name: '自訂圖表',
  description: '建立您專屬的資料圖表',
  icon: PieChart,
  category: 'custom',
  defaultSize: { width: 4, height: 3 },
  minSize: { width: 3, height: 2 },
  maxSize: { width: 8, height: 6 },
  configurable: true,
  requiresData: false,
}, CustomChartWidget);

WidgetRegistry.register('ai-query', {
  type: 'ai-query',
  name: 'AI 智能查詢',
  description: '使用自然語言查詢業務資料',
  icon: Brain,
  category: 'ai',
  defaultSize: { width: 6, height: 5 },
  minSize: { width: 4, height: 4 },
  maxSize: { width: 8, height: 8 },
  configurable: true,
  requiresData: false,
}, AIQueryWidget);

export { WidgetRegistry };