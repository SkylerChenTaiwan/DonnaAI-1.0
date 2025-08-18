/**
 * 儀表板資料管理 Hook
 * 統一管理儀表板所有資料的載入、快取和更新
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';

// 儀表板資料介面
export interface DashboardData {
  metrics: MetricData[];
  charts: ChartData[];
  tasks: TaskData[];
  activities: ActivityData[];
  notifications: NotificationData[];
  insights: InsightData[];
  teamStatus: TeamStatusData[];
  quickActions: QuickActionData[];
}

export interface MetricData {
  id: string;
  name: string;
  description?: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  lastUpdated: Date;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  timeRange: string;
  lastUpdated: Date;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId: string;
  completed: boolean;
  progress?: number;
}

export interface ActivityData {
  id: string;
  type: 'user_action' | 'system_event' | 'notification' | 'task_update';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
  actionUrl?: string;
}

export interface InsightData {
  id: string;
  title: string;
  description: string;
  category: 'sales' | 'customer' | 'performance' | 'risk' | 'opportunity';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  recommendations?: string[];
  createdAt: Date;
}

export interface TeamStatusData {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  currentTask?: string;
  completedTasks: number;
  efficiency: number;
  lastActivity: Date;
}

export interface QuickActionData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'create' | 'view' | 'analyze' | 'manage';
  url: string;
  permissions?: string[];
  usage: number;
}

// Hook 狀態介面
interface DashboardState {
  data: Partial<DashboardData>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshing: boolean;
}

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
  enableCache?: boolean;
  cacheTimeout?: number; // 毫秒
}

/**
 * 儀表板資料管理 Hook
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 分鐘
    enableCache = true,
    cacheTimeout = 2 * 60 * 1000, // 2 分鐘
  } = options;

  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    data: {},
    isLoading: true,
    error: null,
    lastUpdated: null,
    refreshing: false,
  });

  // 載入指標資料
  const loadMetrics = useCallback(async (): Promise<MetricData[]> => {
    try {
      const response = await fetch('/api/dashboard/metrics', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load metrics: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load metrics');
      }

      return result.data.metrics || [];
    } catch (error) {
      console.error('Load metrics error:', error);
      return getMockMetrics(); // 回退到模擬資料
    }
  }, []);

  // 載入任務資料
  const loadTasks = useCallback(async (): Promise<TaskData[]> => {
    try {
      const response = await fetch('/api/dashboard/tasks', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.tasks || [];
    } catch (error) {
      console.error('Load tasks error:', error);
      return getMockTasks();
    }
  }, []);

  // 載入活動資料
  const loadActivities = useCallback(async (): Promise<ActivityData[]> => {
    try {
      const response = await fetch('/api/dashboard/activities', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.activities || [];
    } catch (error) {
      console.error('Load activities error:', error);
      return getMockActivities();
    }
  }, []);

  // 載入通知資料
  const loadNotifications = useCallback(async (): Promise<NotificationData[]> => {
    try {
      const response = await fetch('/api/notifications?limit=10&unreadOnly=false', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load notifications: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.notifications || [];
    } catch (error) {
      console.error('Load notifications error:', error);
      return getMockNotifications();
    }
  }, []);

  // 載入 AI 洞察資料
  const loadInsights = useCallback(async (): Promise<InsightData[]> => {
    try {
      const response = await fetch('/api/dashboard/ai-insights', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load insights: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.insights || [];
    } catch (error) {
      console.error('Load insights error:', error);
      return getMockInsights();
    }
  }, []);

  // 載入團隊狀態
  const loadTeamStatus = useCallback(async (): Promise<TeamStatusData[]> => {
    try {
      const response = await fetch('/api/dashboard/team-status', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load team status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.teamStatus || [];
    } catch (error) {
      console.error('Load team status error:', error);
      return getMockTeamStatus();
    }
  }, []);

  // 主要資料載入函數
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      isLoading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      // 檢查快取
      if (enableCache && !isRefresh) {
        const cached = getCachedData();
        if (cached) {
          setState(prev => ({
            ...prev,
            data: cached,
            isLoading: false,
            refreshing: false,
            lastUpdated: new Date(),
          }));
          return;
        }
      }

      // 並行載入所有資料
      const [
        metrics,
        tasks,
        activities,
        notifications,
        insights,
        teamStatus,
      ] = await Promise.all([
        loadMetrics(),
        loadTasks(),
        loadActivities(),
        loadNotifications(),
        loadInsights(),
        loadTeamStatus(),
      ]);

      const dashboardData: Partial<DashboardData> = {
        metrics,
        tasks,
        activities,
        notifications,
        insights,
        teamStatus,
        quickActions: getMockQuickActions(),
      };

      // 快取資料
      if (enableCache) {
        setCachedData(dashboardData);
      }

      setState(prev => ({
        ...prev,
        data: dashboardData,
        isLoading: false,
        refreshing: false,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error) {
      console.error('Load dashboard data error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [user, enableCache, loadMetrics, loadTasks, loadActivities, loadNotifications, loadInsights, loadTeamStatus]);

  // 刷新資料
  const refresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // 初始載入
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, loadDashboardData]);

  // 快取管理
  const cacheKey = useMemo(() => 
    `dashboard-data-${user?.uid || 'anonymous'}`, [user?.uid]);

  const getCachedData = useCallback((): Partial<DashboardData> | null => {
    if (!enableCache || typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const cacheTime = new Date(parsed.timestamp);
      const now = new Date();

      // 檢查是否過期
      if (now.getTime() - cacheTime.getTime() > cacheTimeout) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Get cached data error:', error);
      return null;
    }
  }, [cacheKey, cacheTimeout, enableCache]);

  const setCachedData = useCallback((data: Partial<DashboardData>) => {
    if (!enableCache || typeof window === 'undefined') return;

    try {
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Set cached data error:', error);
    }
  }, [cacheKey, enableCache]);

  // 清除快取
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  // 導出資料和方法
  return {
    // 資料狀態
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshing: state.refreshing,

    // 操作方法
    refresh,
    clearCache,

    // 個別資料存取器（方便小工具使用）
    metrics: state.data.metrics || [],
    tasks: state.data.tasks || [],
    activities: state.data.activities || [],
    notifications: state.data.notifications || [],
    insights: state.data.insights || [],
    teamStatus: state.data.teamStatus || [],
    quickActions: state.data.quickActions || [],
  };
}

// 模擬資料函數
function getMockMetrics(): MetricData[] {
  return [
    {
      id: 'revenue',
      name: '本月營收',
      description: '當月總營收',
      value: 125430,
      change: 12.5,
      trend: 'up',
      category: 'revenue',
      format: 'currency',
      lastUpdated: new Date(),
    },
    {
      id: 'customers',
      name: '新增客戶',
      description: '本月新增',
      value: 34,
      change: 8.3,
      trend: 'up',
      category: 'customers',
      format: 'number',
      lastUpdated: new Date(),
    },
    {
      id: 'tasks',
      name: '完成任務',
      description: '本週完成',
      value: 89,
      change: -3.2,
      trend: 'down',
      category: 'tasks',
      format: 'number',
      lastUpdated: new Date(),
    },
    {
      id: 'efficiency',
      name: '團隊效率',
      description: '平均完成率',
      value: 94,
      change: 2.1,
      trend: 'up',
      category: 'performance',
      format: 'percentage',
      lastUpdated: new Date(),
    },
  ];
}

function getMockTasks(): TaskData[] {
  return [
    {
      id: '1',
      title: '完成季度報告',
      description: '準備 Q4 業績報告',
      dueDate: '今天',
      priority: 'high',
      status: 'in_progress',
      assigneeId: 'user1',
      completed: false,
      progress: 75,
    },
    {
      id: '2',
      title: '客戶會議準備',
      description: '準備明天的客戶簡報',
      dueDate: '明天',
      priority: 'medium',
      status: 'pending',
      assigneeId: 'user1',
      completed: false,
      progress: 25,
    },
    {
      id: '3',
      title: '產品功能規劃',
      description: '下季度產品路線圖',
      dueDate: '本週五',
      priority: 'medium',
      status: 'completed',
      assigneeId: 'user1',
      completed: true,
      progress: 100,
    },
    {
      id: '4',
      title: '團隊績效評估',
      description: '月度團隊表現評估',
      dueDate: '下週一',
      priority: 'low',
      status: 'pending',
      assigneeId: 'user1',
      completed: false,
      progress: 0,
    },
  ];
}

function getMockActivities(): ActivityData[] {
  return [
    {
      id: '1',
      type: 'user_action',
      description: '張三完成了客戶資料更新',
      timestamp: '2 分鐘前',
      userId: 'user2',
    },
    {
      id: '2',
      type: 'system_event',
      description: '新增了 3 筆客戶記錄',
      timestamp: '15 分鐘前',
    },
    {
      id: '3',
      type: 'task_update',
      description: '李四完成了月度報告',
      timestamp: '1 小時前',
      userId: 'user3',
    },
    {
      id: '4',
      type: 'system_event',
      description: '系統備份已完成',
      timestamp: '2 小時前',
    },
  ];
}

function getMockNotifications(): NotificationData[] {
  return [
    {
      id: '1',
      title: '新的客戶訊息',
      message: '客戶詢問產品相關問題',
      type: 'info',
      time: '剛才',
      read: false,
      actionUrl: '/customers/123',
    },
    {
      id: '2',
      title: '會議提醒',
      message: '下午 2 點與客戶會議',
      type: 'warning',
      time: '10 分鐘前',
      read: false,
      actionUrl: '/calendar/meeting-123',
    },
    {
      id: '3',
      title: '報告已生成完成',
      message: '月度績效報告已準備就緒',
      type: 'success',
      time: '1 小時前',
      read: true,
      actionUrl: '/reports/monthly-123',
    },
    {
      id: '4',
      title: '系統維護通知',
      message: '今晚 11 點將進行系統維護',
      type: 'info',
      time: '昨天',
      read: true,
    },
  ];
}

function getMockInsights(): InsightData[] {
  return [
    {
      id: '1',
      title: '客戶流失風險',
      description: '檢測到 3 位客戶可能流失，建議主動聯繫',
      category: 'risk',
      confidence: 85,
      priority: 'high',
      recommendations: [
        '立即聯繫高風險客戶',
        '提供客製化優惠方案',
        '安排客戶成功經理跟進',
      ],
      createdAt: new Date(),
    },
    {
      id: '2',
      title: '最佳銷售時機',
      description: '本週三下午是聯繫潛在客戶的最佳時間',
      category: 'opportunity',
      confidence: 72,
      priority: 'medium',
      recommendations: [
        '安排週三下午的銷售電話',
        '準備針對性的銷售材料',
      ],
      createdAt: new Date(),
    },
  ];
}

function getMockTeamStatus(): TeamStatusData[] {
  return [
    {
      id: '1',
      userId: 'user1',
      userName: '張小明',
      status: 'online',
      currentTask: '準備客戶簡報',
      completedTasks: 12,
      efficiency: 92,
      lastActivity: new Date(),
    },
    {
      id: '2',
      userId: 'user2',
      userName: '李小華',
      status: 'busy',
      currentTask: '客戶會議中',
      completedTasks: 8,
      efficiency: 88,
      lastActivity: new Date(),
    },
    {
      id: '3',
      userId: 'user3',
      userName: '王小美',
      status: 'away',
      currentTask: '外勤拜訪',
      completedTasks: 15,
      efficiency: 95,
      lastActivity: new Date(),
    },
  ];
}

function getMockQuickActions(): QuickActionData[] {
  return [
    {
      id: '1',
      name: '新增客戶',
      description: '建立新的客戶檔案',
      icon: 'users',
      category: 'create',
      url: '/customers/new',
      usage: 25,
    },
    {
      id: '2',
      name: '建立任務',
      description: '新增工作任務',
      icon: 'check-square',
      category: 'create',
      url: '/tasks/new',
      usage: 18,
    },
    {
      id: '3',
      name: '安排會議',
      description: '預約會議時間',
      icon: 'calendar',
      category: 'create',
      url: '/calendar/new',
      usage: 12,
    },
    {
      id: '4',
      name: '生成報告',
      description: '建立分析報告',
      icon: 'pie-chart',
      category: 'analyze',
      url: '/reports/new',
      usage: 8,
    },
  ];
}