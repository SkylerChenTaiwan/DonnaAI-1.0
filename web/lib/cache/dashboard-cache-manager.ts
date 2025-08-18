/**
 * 儀表板快取管理器
 * 專門針對儀表板資料的快取策略和管理
 */

import { CacheFactory, defaultCacheConfigs } from './cache-factory';
import { CacheInterface } from './cache-interface';
import type {
  DashboardMetrics,
  TrendData,
  TeamStatusData
} from '@/docs/types/dashboard-data-models';

export class DashboardCacheManager {
  private cache: CacheInterface;
  private readonly TTL_CONFIGS = {
    // 即時資料 - 較短的快取時間
    realtime: 60, // 1 分鐘
    // 統計指標 - 中等快取時間
    metrics: 300, // 5 分鐘
    // 趨勢資料 - 較長的快取時間
    trends: 1800, // 30 分鐘
    // 團隊狀態 - 短時間快取
    teamStatus: 120, // 2 分鐘
    // AI 查詢結果 - 長時間快取
    aiQuery: 3600, // 1 小時
    // 使用者偏好 - 長時間快取
    userPreferences: 86400 // 24 小時
  };

  private readonly CACHE_KEYS = {
    // 組織指標
    organizationMetrics: (orgId: string) => `metrics:org:${orgId}`,
    // 趨勢資料
    trendData: (orgId: string, period: string, granularity: string) => 
      `trends:${orgId}:${period}:${granularity}`,
    // 團隊狀態
    teamStatus: (orgId: string) => `team:status:${orgId}`,
    // 個人指標
    userMetrics: (userId: string) => `metrics:user:${userId}`,
    // AI 查詢快取
    aiQuery: (query: string, orgId: string) => 
      `ai:query:${Buffer.from(query).toString('base64')}:${orgId}`,
    // 使用者偏好
    userPreferences: (userId: string) => `preferences:${userId}`,
    // 即時統計
    realtimeStats: (orgId: string) => `realtime:stats:${orgId}`,
    // 圖表配置
    chartConfig: (orgId: string, chartType: string) => `chart:${orgId}:${chartType}`
  };

  constructor() {
    // 根據環境選擇快取配置
    const env = process.env.NODE_ENV || 'development';
    const config = defaultCacheConfigs[env as keyof typeof defaultCacheConfigs] || 
                  defaultCacheConfigs.development;

    this.cache = CacheFactory.createCache(config, 'dashboard');
    console.log(`Dashboard cache manager initialized for ${env} environment`);
  }

  /**
   * 快取組織指標
   */
  async cacheOrganizationMetrics(
    organizationId: string,
    metrics: DashboardMetrics,
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.organizationMetrics(organizationId);
    await this.cache.set(key, metrics, ttl || this.TTL_CONFIGS.metrics);
  }

  /**
   * 獲取組織指標快取
   */
  async getOrganizationMetrics(organizationId: string): Promise<DashboardMetrics | null> {
    const key = this.CACHE_KEYS.organizationMetrics(organizationId);
    return await this.cache.get<DashboardMetrics>(key);
  }

  /**
   * 快取趨勢資料
   */
  async cacheTrendData(
    organizationId: string,
    period: string,
    granularity: string,
    data: TrendData[],
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.trendData(organizationId, period, granularity);
    await this.cache.set(key, data, ttl || this.TTL_CONFIGS.trends);
  }

  /**
   * 獲取趨勢資料快取
   */
  async getTrendData(
    organizationId: string,
    period: string,
    granularity: string
  ): Promise<TrendData[] | null> {
    const key = this.CACHE_KEYS.trendData(organizationId, period, granularity);
    return await this.cache.get<TrendData[]>(key);
  }

  /**
   * 快取團隊狀態
   */
  async cacheTeamStatus(
    organizationId: string,
    status: TeamStatusData[],
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.teamStatus(organizationId);
    await this.cache.set(key, status, ttl || this.TTL_CONFIGS.teamStatus);
  }

  /**
   * 獲取團隊狀態快取
   */
  async getTeamStatus(organizationId: string): Promise<TeamStatusData[] | null> {
    const key = this.CACHE_KEYS.teamStatus(organizationId);
    return await this.cache.get<TeamStatusData[]>(key);
  }

  /**
   * 快取 AI 查詢結果
   */
  async cacheAIQuery(
    query: string,
    organizationId: string,
    result: any,
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.aiQuery(query, organizationId);
    await this.cache.set(key, result, ttl || this.TTL_CONFIGS.aiQuery);
  }

  /**
   * 獲取 AI 查詢結果快取
   */
  async getAIQuery(query: string, organizationId: string): Promise<any | null> {
    const key = this.CACHE_KEYS.aiQuery(query, organizationId);
    return await this.cache.get(key);
  }

  /**
   * 快取使用者偏好
   */
  async cacheUserPreferences(
    userId: string,
    preferences: any,
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.userPreferences(userId);
    await this.cache.set(key, preferences, ttl || this.TTL_CONFIGS.userPreferences);
  }

  /**
   * 獲取使用者偏好快取
   */
  async getUserPreferences(userId: string): Promise<any | null> {
    const key = this.CACHE_KEYS.userPreferences(userId);
    return await this.cache.get(key);
  }

  /**
   * 快取即時統計
   */
  async cacheRealtimeStats(
    organizationId: string,
    stats: any,
    ttl?: number
  ): Promise<void> {
    const key = this.CACHE_KEYS.realtimeStats(organizationId);
    await this.cache.set(key, stats, ttl || this.TTL_CONFIGS.realtime);
  }

  /**
   * 獲取即時統計快取
   */
  async getRealtimeStats(organizationId: string): Promise<any | null> {
    const key = this.CACHE_KEYS.realtimeStats(organizationId);
    return await this.cache.get(key);
  }

  /**
   * 使無效化組織相關的所有快取
   */
  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    const patterns = [
      `metrics:org:${organizationId}`,
      `trends:${organizationId}:*`,
      `team:status:${organizationId}`,
      `realtime:stats:${organizationId}`,
      `chart:${organizationId}:*`,
      `ai:query:*:${organizationId}`
    ];

    const deletePromises = patterns.map(pattern => 
      this.cache.delPattern(pattern)
    );

    await Promise.all(deletePromises);
    console.log(`Invalidated cache for organization: ${organizationId}`);
  }

  /**
   * 使無效化使用者相關的快取
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      this.CACHE_KEYS.userMetrics(userId),
      this.CACHE_KEYS.userPreferences(userId)
    ];

    const deletePromises = keys.map(key => this.cache.del(key));
    await Promise.all(deletePromises);
    console.log(`Invalidated cache for user: ${userId}`);
  }

  /**
   * 預熱快取 - 預先載入常用資料
   */
  async warmupCache(organizationId: string): Promise<void> {
    console.log(`Starting cache warmup for organization: ${organizationId}`);

    try {
      // 這裡可以預先載入常用的資料
      // 例如：基本指標、最近的趨勢資料等
      
      // 預熱邏輯將在實際使用時實作
      console.log(`Cache warmup completed for organization: ${organizationId}`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  /**
   * 智能快取更新 - 根據資料變更類型選擇性更新
   */
  async smartCacheUpdate(
    organizationId: string,
    updateType: 'customer' | 'revenue' | 'task' | 'meeting',
    data?: any
  ): Promise<void> {
    console.log(`Smart cache update: ${updateType} for org ${organizationId}`);

    // 根據更新類型決定要失效的快取
    switch (updateType) {
      case 'customer':
        // 失效客戶相關的快取
        await this.cache.delPattern(`metrics:org:${organizationId}`);
        await this.cache.delPattern(`trends:${organizationId}:*`);
        break;

      case 'revenue':
        // 失效營收相關的快取
        await this.cache.delPattern(`metrics:org:${organizationId}`);
        await this.cache.delPattern(`trends:${organizationId}:*`);
        break;

      case 'task':
        // 失效任務相關的快取
        await this.cache.delPattern(`metrics:org:${organizationId}`);
        await this.cache.delPattern(`team:status:${organizationId}`);
        break;

      case 'meeting':
        // 失效會議相關的快取
        await this.cache.delPattern(`metrics:org:${organizationId}`);
        break;
    }

    // 更新即時統計
    await this.cache.del(this.CACHE_KEYS.realtimeStats(organizationId));
  }

  /**
   * 獲取快取統計資訊
   */
  async getCacheStats(): Promise<any> {
    return await this.cache.getStats();
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 嘗試設置和獲取測試值
      const testKey = 'health:check:test';
      const testValue = { timestamp: Date.now() };
      
      await this.cache.set(testKey, testValue, 10);
      const retrieved = await this.cache.get(testKey);
      await this.cache.del(testKey);

      return retrieved !== null;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * 清理過期快取（手動觸發）
   */
  async cleanup(): Promise<void> {
    try {
      console.log('Starting cache cleanup...');
      
      // 這裡可以實作具體的清理邏輯
      // 例如：清理超過一定時間的快取項目
      
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }
}

// 導出單例
export const dashboardCacheManager = new DashboardCacheManager();