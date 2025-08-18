/**
 * 分析儀表板組件
 * 整合 KPI、圖表、活動動態等各種分析組件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw, 
  Settings,
  Search,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { KPIGrid } from '@/components/dashboard/kpi-card';
import { LineChart, BarChart, PieChart } from '@/components/charts/chart-components';
import { ActivityFeed, AlertList } from '@/components/dashboard/activity-feed';
import { 
  analyticsService, 
  type TimeRange, 
  type AnalyticsFilters,
  type DashboardData 
} from '@/services/analytics.service';
import { queryKeys } from '@/providers/query-provider';

// 時間範圍選項
const timeRangeOptions = [
  { value: '7d', label: '過去 7 天' },
  { value: '30d', label: '過去 30 天' },
  { value: '90d', label: '過去 90 天' },
  { value: '1y', label: '過去 1 年' },
];

// 儀表板屬性
interface AnalyticsDashboardProps {
  className?: string;
  defaultTimeRange?: TimeRange;
  organizationId?: string;
}

export function AnalyticsDashboard({
  className = '',
  defaultTimeRange = '30d',
  organizationId
}: AnalyticsDashboardProps) {
  // 狀態管理
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: defaultTimeRange,
    organizationId,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // 獲取儀表板資料
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...queryKeys.dashboard(organizationId, filters.timeRange), refreshKey],
    queryFn: () => analyticsService.getDashboardData(filters),
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000, // 10 分鐘
  });

  // 處理時間範圍變更
  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };

  // 處理重新整理
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // 處理導出
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const blob = await analyticsService.exportDashboardReport(format, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // 處理 KPI 點擊
  const handleKPIClick = (metric: any) => {
    console.log('KPI clicked:', metric);
    // TODO: 導航到詳細分析頁面
  };

  // 錯誤狀態
  if (error) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <p className="font-medium">載入儀表板資料時發生錯誤</p>
          <p className="text-sm mt-1">請檢查網路連線或稍後再試</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          重新嘗試
        </Button>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 頂部控制欄 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 左側：標題和描述 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分析儀表板</h1>
          <p className="text-gray-600 mt-1">
            關鍵業務指標和趋勢分析總覽
          </p>
        </div>

        {/* 右側：操作按鈕 */}
        <div className="flex items-center space-x-3">
          {/* AI 查詢入口 */}
          <Button 
            variant="outline" 
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI 分析助手
          </Button>

          {/* 時間範圍選擇 */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select
              value={filters.timeRange}
              onValueChange={handleTimeRangeChange}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* 更多操作 */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden sm:inline-flex"
            >
              <Filter className="w-4 h-4 mr-2" />
              篩選
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            {/* 導出選單 */}
            <div className="relative group">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                導出
              </Button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleExport('pdf')}
                >
                  PDF 報告
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleExport('excel')}
                >
                  Excel 檔案
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleExport('csv')}
                >
                  CSV 資料
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 進階篩選面板 */}
      {showFilters && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜尋關鍵字
              </label>
              <Input
                placeholder="搜尋客戶、產品、交易..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業務類別
              </label>
              <Select>
                <option value="">全部類別</option>
                <option value="sales">銷售</option>
                <option value="marketing">行銷</option>
                <option value="support">客服</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                團隊成員
              </label>
              <Select>
                <option value="">全部成員</option>
                <option value="team1">業務一組</option>
                <option value="team2">業務二組</option>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* KPI 指標網格 */}
      <KPIGrid
        metrics={dashboardData?.kpis || []}
        loading={isLoading}
        columns={3}
        size="md"
        showSparklines={true}
        onKPIClick={handleKPIClick}
      />

      {/* 主要內容區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：圖表區域（佔 2/3） */}
        <div className="lg:col-span-2 space-y-6">
          {/* 趨勢圖表 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {dashboardData?.trends.map((trend, index) => (
              <LineChart
                key={index}
                data={trend}
                loading={isLoading}
                showArea={true}
                height={300}
              />
            ))}
          </div>

          {/* 比較圖表 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {dashboardData?.comparisons.map((comparison, index) => (
              <BarChart
                key={index}
                data={comparison}
                loading={isLoading}
                height={300}
                showValues={true}
              />
            ))}
          </div>

          {/* 分佈圖表 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {dashboardData?.distribution.map((distribution, index) => (
              <PieChart
                key={index}
                data={distribution}
                loading={isLoading}
                type="doughnut"
                height={300}
                showPercentages={true}
              />
            ))}
          </div>
        </div>

        {/* 右側：活動和警報（佔 1/3） */}
        <div className="space-y-6">
          {/* 系統警報 */}
          <AlertList
            alerts={dashboardData?.alerts || []}
            loading={isLoading}
            maxItems={3}
          />

          {/* 最近活動 */}
          <ActivityFeed
            activities={dashboardData?.recentActivities || []}
            loading={isLoading}
            maxItems={8}
          />

          {/* 快速操作 */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                生成 AI 報告
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                深入分析
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                自訂儀表板
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 底部統計摘要 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            資料更新時間
          </h3>
          <p className="text-sm text-gray-600">
            最後更新：{new Date().toLocaleString('zh-TW')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            資料每 5 分鐘自動更新一次
          </p>
        </div>
      </Card>
    </div>
  );
}