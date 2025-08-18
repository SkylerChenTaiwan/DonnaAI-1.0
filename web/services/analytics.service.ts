/**
 * 分析資料服務
 * 處理儀表板統計資料和分析查詢
 */

import { apiClient } from '@/lib/api-client';

// 時間範圍類型
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

// KPI 指標介面
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description?: string;
}

// 圖表資料點
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

// 趨勢圖資料
export interface TrendChartData {
  title: string;
  data: ChartDataPoint[];
  yAxisLabel: string;
  color: string;
}

// 圓餅圖資料
export interface PieChartData {
  title: string;
  data: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }[];
}

// 長條圖資料
export interface BarChartData {
  title: string;
  data: {
    category: string;
    value: number;
    color?: string;
  }[];
  yAxisLabel: string;
}

// 儀表板資料介面
export interface DashboardData {
  kpis: KPIMetric[];
  trends: TrendChartData[];
  distribution: PieChartData[];
  comparisons: BarChartData[];
  recentActivities: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
    metadata?: Record<string, any>;
  }[];
  alerts: {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    actionUrl?: string;
  }[];
}

// 過濾條件
export interface AnalyticsFilters {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  userId?: string;
  categories?: string[];
  tags?: string[];
}

class AnalyticsService {
  /**
   * 獲取儀表板總覽資料
   */
  async getDashboardData(filters: AnalyticsFilters = { timeRange: '30d' }): Promise<DashboardData> {
    try {
      const response = await apiClient.post('/analytics/dashboard', filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 返回模擬資料以供開發使用
      return this.getMockDashboardData();
    }
  }

  /**
   * 獲取 KPI 指標
   */
  async getKPIMetrics(filters: AnalyticsFilters): Promise<KPIMetric[]> {
    try {
      const response = await apiClient.post('/analytics/kpis', filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch KPI metrics:', error);
      return this.getMockKPIs();
    }
  }

  /**
   * 獲取趨勢圖資料
   */
  async getTrendData(
    metric: string, 
    filters: AnalyticsFilters
  ): Promise<TrendChartData> {
    try {
      const response = await apiClient.post(`/analytics/trends/${metric}`, filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      return this.getMockTrendData(metric);
    }
  }

  /**
   * 獲取分佈圖資料
   */
  async getDistributionData(
    category: string,
    filters: AnalyticsFilters
  ): Promise<PieChartData> {
    try {
      const response = await apiClient.post(`/analytics/distribution/${category}`, filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch distribution data:', error);
      return this.getMockDistributionData(category);
    }
  }

  /**
   * 獲取比較圖資料
   */
  async getComparisonData(
    metric: string,
    groupBy: string,
    filters: AnalyticsFilters
  ): Promise<BarChartData> {
    try {
      const response = await apiClient.post(`/analytics/comparison/${metric}/${groupBy}`, filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
      return this.getMockComparisonData(metric, groupBy);
    }
  }

  /**
   * 獲取最近活動
   */
  async getRecentActivities(
    limit: number = 10,
    filters: Partial<AnalyticsFilters> = {}
  ): Promise<DashboardData['recentActivities']> {
    try {
      const response = await apiClient.post('/analytics/activities', { ...filters, limit });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      return this.getMockRecentActivities();
    }
  }

  /**
   * 導出報表資料
   */
  async exportDashboardReport(
    format: 'pdf' | 'excel' | 'csv',
    filters: AnalyticsFilters
  ): Promise<Blob> {
    const response = await apiClient.post(
      `/analytics/export/${format}`,
      filters,
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * 建立自訂查詢
   */
  async createCustomQuery(query: {
    name: string;
    description?: string;
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    timeRange: TimeRange;
  }) {
    const response = await apiClient.post('/analytics/custom-query', query);
    return response.data;
  }

  // === 模擬資料方法（開發用） ===

  private getMockDashboardData(): DashboardData {
    return {
      kpis: this.getMockKPIs(),
      trends: [
        this.getMockTrendData('revenue'),
        this.getMockTrendData('customers'),
      ],
      distribution: [
        this.getMockDistributionData('customer-segments'),
        this.getMockDistributionData('product-categories'),
      ],
      comparisons: [
        this.getMockComparisonData('sales', 'team'),
        this.getMockComparisonData('conversions', 'channel'),
      ],
      recentActivities: this.getMockRecentActivities(),
      alerts: this.getMockAlerts(),
    };
  }

  private getMockKPIs(): KPIMetric[] {
    return [
      {
        id: 'total-customers',
        name: '總客戶數',
        value: 2345,
        unit: '位',
        change: 12.5,
        changeType: 'positive',
        icon: 'users',
        description: '相較於上月增長 12.5%',
      },
      {
        id: 'monthly-revenue',
        name: '本月收入',
        value: 2456789,
        unit: 'NT$',
        change: 8.3,
        changeType: 'positive',
        icon: 'dollar-sign',
        description: '相較於上月增長 8.3%',
      },
      {
        id: 'active-deals',
        name: '進行中交易',
        value: 147,
        unit: '筆',
        change: -5.2,
        changeType: 'negative',
        icon: 'briefcase',
        description: '相較於上月減少 5.2%',
      },
      {
        id: 'conversion-rate',
        name: '轉換率',
        value: 24.5,
        unit: '%',
        change: 2.1,
        changeType: 'positive',
        icon: 'trending-up',
        description: '相較於上月提升 2.1%',
      },
      {
        id: 'customer-satisfaction',
        name: '客戶滿意度',
        value: 4.7,
        unit: '/5.0',
        change: 0.3,
        changeType: 'positive',
        icon: 'star',
        description: '相較於上月提升 0.3 分',
      },
      {
        id: 'pending-tasks',
        name: '待辦任務',
        value: 23,
        unit: '項',
        change: -15.5,
        changeType: 'positive',
        icon: 'clock',
        description: '相較於上週減少 15.5%',
      },
    ];
  }

  private getMockTrendData(metric: string): TrendChartData {
    const generateData = (days: number) => {
      const data: ChartDataPoint[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // 生成具有趨勢的隨機資料
        const baseValue = metric === 'revenue' ? 80000 : metric === 'customers' ? 50 : 1000;
        const trend = Math.sin((days - i) / 10) * 0.3;
        const noise = (Math.random() - 0.5) * 0.4;
        const value = Math.max(0, baseValue * (1 + trend + noise));
        
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(value),
        });
      }
      
      return data;
    };

    const configs = {
      revenue: {
        title: '收入趨勢',
        yAxisLabel: '收入 (NT$)',
        color: '#3B82F6',
      },
      customers: {
        title: '客戶增長',
        yAxisLabel: '新增客戶數',
        color: '#10B981',
      },
      deals: {
        title: '交易趨勢',
        yAxisLabel: '交易數量',
        color: '#F59E0B',
      },
    };

    const config = configs[metric as keyof typeof configs] || {
      title: '資料趨勢',
      yAxisLabel: '數值',
      color: '#6B7280',
    };

    return {
      title: config.title,
      data: generateData(30),
      yAxisLabel: config.yAxisLabel,
      color: config.color,
    };
  }

  private getMockDistributionData(category: string): PieChartData {
    const configs = {
      'customer-segments': {
        title: '客戶分類分佈',
        data: [
          { label: '企業客戶', value: 45, color: '#3B82F6' },
          { label: '中小企業', value: 35, color: '#10B981' },
          { label: '個人客戶', value: 20, color: '#F59E0B' },
        ],
      },
      'product-categories': {
        title: '產品類別銷售',
        data: [
          { label: 'SaaS 軟體', value: 60, color: '#8B5CF6' },
          { label: '諮詢服務', value: 25, color: '#EF4444' },
          { label: '培訓課程', value: 15, color: '#06B6D4' },
        ],
      },
    };

    const config = configs[category as keyof typeof configs] || {
      title: '資料分佈',
      data: [
        { label: '類別A', value: 50, color: '#3B82F6' },
        { label: '類別B', value: 30, color: '#10B981' },
        { label: '類別C', value: 20, color: '#F59E0B' },
      ],
    };

    // 計算百分比
    const total = config.data.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentage = config.data.map(item => ({
      ...item,
      percentage: Math.round((item.value / total) * 100),
    }));

    return {
      title: config.title,
      data: dataWithPercentage,
    };
  }

  private getMockComparisonData(metric: string, groupBy: string): BarChartData {
    const configs = {
      'sales-team': {
        title: '團隊銷售表現',
        yAxisLabel: '銷售額 (NT$)',
        data: [
          { category: '業務一組', value: 850000 },
          { category: '業務二組', value: 720000 },
          { category: '業務三組', value: 640000 },
          { category: '業務四組', value: 590000 },
        ],
      },
      'conversions-channel': {
        title: '管道轉換率比較',
        yAxisLabel: '轉換率 (%)',
        data: [
          { category: '官網', value: 28.5 },
          { category: '社群媒體', value: 22.3 },
          { category: '電話行銷', value: 19.7 },
          { category: '展會活動', value: 35.2 },
        ],
      },
    };

    const key = `${metric}-${groupBy}`;
    const config = configs[key as keyof typeof configs] || {
      title: '資料比較',
      yAxisLabel: '數值',
      data: [
        { category: 'A', value: 100 },
        { category: 'B', value: 80 },
        { category: 'C', value: 60 },
      ],
    };

    return {
      title: config.title,
      data: config.data,
      yAxisLabel: config.yAxisLabel,
    };
  }

  private getMockRecentActivities(): DashboardData['recentActivities'] {
    return [
      {
        id: '1',
        type: 'customer_created',
        description: '新客戶「台灣科技股份有限公司」已註冊',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: '王小明',
      },
      {
        id: '2',
        type: 'deal_closed',
        description: '交易「企業軟體授權」已成功簽約，金額 NT$500,000',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: '李小華',
      },
      {
        id: '3',
        type: 'task_completed',
        description: '完成客戶需求分析報告',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        user: '張小美',
      },
      {
        id: '4',
        type: 'ai_analysis',
        description: 'AI 完成月度業績分析報告',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        type: 'customer_updated',
        description: '客戶「創新有限公司」資料已更新',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        user: '陳小強',
      },
    ];
  }

  private getMockAlerts(): DashboardData['alerts'] {
    return [
      {
        id: '1',
        type: 'warning',
        title: '轉換率下降',
        message: '本週轉換率比上週下降 3.2%，建議檢查行銷策略',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/analytics/conversion-analysis',
      },
      {
        id: '2',
        type: 'info',
        title: '新功能上線',
        message: 'AI 查詢分析功能已正式上線，開始體驗智能分析',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/ai-query',
      },
      {
        id: '3',
        type: 'success',
        title: '目標達成',
        message: '本月銷售目標已達成 105%，表現優異！',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

// 導出單例
export const analyticsService = new AnalyticsService();