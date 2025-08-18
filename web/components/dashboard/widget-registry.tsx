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
  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <p className="text-sm text-gray-500">營收圖表組件</p>
        <p className="text-xs text-gray-400 mt-1">即將推出</p>
      </div>
    </div>
  );
};

/**
 * 客戶成長小工具
 */
const CustomerGrowthWidget: WidgetRenderer = ({ config, data, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-sm text-gray-500">客戶成長圖表</p>
        <p className="text-xs text-gray-400 mt-1">即將推出</p>
      </div>
    </div>
  );
};

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
      <div className="flex items-center space-x-2">
        <Brain className="w-4 h-4 text-blue-500" />
        <h4 className="text-sm font-medium text-gray-900">AI 洞察</h4>
      </div>
      
      {insights.slice(0, 3).map((insight: any, index: number) => (
        <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-gray-900 mb-1">{insight.title}</p>
          <p className="text-xs text-gray-600">{insight.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-blue-600 font-medium">可信度: {insight.confidence}%</span>
            <span className="text-xs text-gray-500">{insight.category}</span>
          </div>
        </div>
      ))}
      
      {insights.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无洞察</p>
        </div>
      )}
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

export { WidgetRegistry };