/**
 * Super Admin 統計資料 Hook
 * 提供平台統計數據的即時更新和快取機制
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SuperAdminStats, 
  PlatformRevenue, 
  OrganizationUsageStats 
} from '@/types/superadmin';
import { 
  getPlatformStats, 
  getMonthlyRevenueStats, 
  getOrganizationUsageStats 
} from '@/services/firebase/admin/statsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 快取設定
const CACHE_KEY_STATS = '@donnaai/superadmin_stats';
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取時間
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分鐘自動更新

export interface UseSuperAdminStatsReturn {
  stats: SuperAdminStats | null;
  monthlyRevenue: PlatformRevenue | null;
  topOrganizations: OrganizationUsageStats[];
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshMonthlyRevenue: (yearMonth?: string) => Promise<void>;
  refreshTopOrganizations: () => Promise<void>;
}

export function useSuperAdminStats(): UseSuperAdminStatsReturn {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<PlatformRevenue | null>(null);
  const [topOrganizations, setTopOrganizations] = useState<OrganizationUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 從快取載入統計資料
  const loadFromCache = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY_STATS);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheTime = parsed.timestamp;
        const now = Date.now();
        
        // 檢查快取是否過期
        if (now - cacheTime < CACHE_DURATION) {
          setStats(parsed.stats);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('載入快取失敗:', err);
      return false;
    }
  }, []);

  // 儲存到快取
  const saveToCache = useCallback(async (data: SuperAdminStats) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY_STATS, JSON.stringify({
        stats: data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('儲存快取失敗:', err);
    }
  }, []);

  // 載入平台統計資料
  const loadStats = useCallback(async (useCache: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 嘗試從快取載入
      if (useCache) {
        const cached = await loadFromCache();
        if (cached) {
          setIsLoading(false);
          return;
        }
      }
      
      // 從服務載入新資料
      const newStats = await getPlatformStats();
      setStats(newStats);
      
      // 儲存到快取
      await saveToCache(newStats);
    } catch (err) {
      console.error('載入統計資料失敗:', err);
      setError(err instanceof Error ? err.message : '載入統計資料失敗');
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  // 載入月度收入統計
  const loadMonthlyRevenue = useCallback(async (yearMonth?: string) => {
    try {
      // 如果沒有指定月份，使用當前月份
      const targetMonth = yearMonth || new Date().toISOString().slice(0, 7);
      const revenue = await getMonthlyRevenueStats(targetMonth);
      setMonthlyRevenue(revenue);
    } catch (err) {
      console.error('載入月度收入失敗:', err);
      setError(err instanceof Error ? err.message : '載入月度收入失敗');
    }
  }, []);

  // 載入組織使用統計
  const loadTopOrganizations = useCallback(async () => {
    try {
      const orgs = await getOrganizationUsageStats(10, 'monthlyBill');
      setTopOrganizations(orgs);
    } catch (err) {
      console.error('載入組織統計失敗:', err);
      setError(err instanceof Error ? err.message : '載入組織統計失敗');
    }
  }, []);

  // 強制更新統計資料（不使用快取）
  const refreshStats = useCallback(async () => {
    await loadStats(false);
  }, [loadStats]);

  // 更新月度收入
  const refreshMonthlyRevenue = useCallback(async (yearMonth?: string) => {
    await loadMonthlyRevenue(yearMonth);
  }, [loadMonthlyRevenue]);

  // 更新組織排行
  const refreshTopOrganizations = useCallback(async () => {
    await loadTopOrganizations();
  }, [loadTopOrganizations]);

  // 初始載入
  useEffect(() => {
    const initLoad = async () => {
      await Promise.all([
        loadStats(true),
        loadMonthlyRevenue(),
        loadTopOrganizations()
      ]);
    };
    
    initLoad();
    
    // 設定自動更新
    intervalRef.current = setInterval(() => {
      refreshStats();
    }, REFRESH_INTERVAL);
    
    // 清理函數
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadStats, loadMonthlyRevenue, loadTopOrganizations, refreshStats]);

  return {
    stats,
    monthlyRevenue,
    topOrganizations,
    isLoading,
    error,
    refreshStats,
    refreshMonthlyRevenue,
    refreshTopOrganizations
  };
}

// 輔助 Hook：只獲取簡單統計數據
export function useSimpleStats() {
  const [stats, setStats] = useState<{
    totalOrganizations: number;
    activeUsers: number;
    monthlyRevenue: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSimpleStats = async () => {
      try {
        const fullStats = await getPlatformStats();
        setStats({
          totalOrganizations: fullStats.totalOrganizations,
          activeUsers: fullStats.activeUsers,
          monthlyRevenue: fullStats.monthlyRevenue
        });
      } catch (err) {
        console.error('載入簡單統計失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSimpleStats();
  }, []);

  return { stats, isLoading };
}