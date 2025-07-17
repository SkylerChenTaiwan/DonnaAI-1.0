/**
 * 儀表板狀態管理 Store
 * 整合跨資料庫查詢結果
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CustomerDoc } from '../types/firebase';
import { RecordDoc } from '../types/record';
import { TaskDoc } from '../types/task';
import {
  getTeamDashboardData,
  getCustomerActivityHistory,
  globalSearch,
  getUserWorkloadStats,
  getOrganizationAIUsageStats
} from '../services/firebase/cross-db-queries';

interface DashboardState {
  // 團隊儀表板資料
  teamDashboard: {
    customers: CustomerDoc[];
    recentRecords: RecordDoc[];
    pendingTasks: TaskDoc[];
    statistics: {
      totalCustomers: number;
      totalRecords: number;
      pendingTasks: number;
      completedTasks: number;
      totalAudioMinutes: number;
    };
  } | null;
  
  // 客戶活動歷史
  customerActivity: {
    customer: CustomerDoc | null;
    activities: Array<{
      type: 'record' | 'task' | 'update';
      timestamp: Date;
      title: string;
      description?: string;
      data: RecordDoc | TaskDoc | any;
    }>;
  } | null;
  
  // 搜尋結果
  searchResults: {
    customers: CustomerDoc[];
    records: RecordDoc[];
    tasks: TaskDoc[];
  } | null;
  
  // 使用者工作負載
  userWorkload: {
    assignedTasks: {
      total: number;
      byStatus: Record<string, number>;
      overdue: number;
      dueThisWeek: number;
    };
    recordsCreated: number;
    customersManaged: number;
    upcomingMeetings: RecordDoc[];
  } | null;
  
  // AI 使用統計
  aiUsageStats: {
    totalProcessedRecords: number;
    totalAudioMinutes: number;
    averageConfidenceScore: number;
    topExtractedFields: Array<{ fieldKey: string; count: number }>;
    processingTrend: Array<{ date: string; count: number }>;
  } | null;
  
  // 狀態
  isLoading: boolean;
  error: string | null;
  
  // 動作
  fetchTeamDashboard: (teamId: string, userId: string, dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchCustomerActivity: (customerId: string, userId: string, limit?: number) => Promise<void>;
  performGlobalSearch: (searchTerm: string, userId: string, teamId?: string) => Promise<void>;
  fetchUserWorkload: (userId: string, dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchAIUsageStats: (organizationId: string, dateRange?: { start: Date; end: Date }) => Promise<void>;
  
  // 狀態管理
  clearSearch: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  teamDashboard: null,
  customerActivity: null,
  searchResults: null,
  userWorkload: null,
  aiUsageStats: null,
  isLoading: false,
  error: null
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // 獲取團隊儀表板資料
      fetchTeamDashboard: async (teamId: string, userId: string, dateRange?: { start: Date; end: Date }) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await getTeamDashboardData(teamId, userId, dateRange);
          set({ teamDashboard: data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取團隊儀表板資料失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取客戶活動歷史
      fetchCustomerActivity: async (customerId: string, userId: string, limit?: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await getCustomerActivityHistory(customerId, userId, limit);
          set({ customerActivity: data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取客戶活動歷史失敗',
            isLoading: false 
          });
        }
      },
      
      // 執行全域搜尋
      performGlobalSearch: async (searchTerm: string, userId: string, teamId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const results = await globalSearch(searchTerm, userId, teamId);
          set({ searchResults: results, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '搜尋失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取使用者工作負載
      fetchUserWorkload: async (userId: string, dateRange?: { start: Date; end: Date }) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await getUserWorkloadStats(userId, dateRange);
          set({ userWorkload: data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取使用者工作負載失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取 AI 使用統計
      fetchAIUsageStats: async (organizationId: string, dateRange?: { start: Date; end: Date }) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await getOrganizationAIUsageStats(organizationId, dateRange);
          set({ aiUsageStats: data, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取 AI 使用統計失敗',
            isLoading: false 
          });
        }
      },
      
      // 清除搜尋結果
      clearSearch: () => {
        set({ searchResults: null });
      },
      
      // 清除錯誤
      clearError: () => {
        set({ error: null });
      },
      
      // 重置狀態
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);