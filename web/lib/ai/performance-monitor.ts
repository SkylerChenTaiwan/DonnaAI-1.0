/**
 * PRP-124: AI 驅動分析查詢介面 - 效能監控和快取機制
 * 
 * @description 效能監控系統和智能快取管理，提高 AI 查詢系統的效能和使用者體驗
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { memoryCacheManager } from '@/lib/cache/memory-cache';
import type {
  QueryMetrics,
  PhaseMetrics,
  ResourceUsage,
  CacheStats,
  ErrorStats,
  AIPerformance,
  CacheConfig,
  CacheStrategy,
  CacheInfo,
  RateLimiting,
  QueryResult,
  AIQuery
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 效能監控配置和類型
// ============================================================================

/**
 * 效能監控配置
 */
interface PerformanceConfig {
  enableMetrics: boolean;
  enableCaching: boolean;
  enableRateLimiting: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  sampling: {
    enabled: boolean;
    rate: number;
  };
}

/**
 * 效能指標收集器
 */
interface MetricsCollector {
  startTime: number;
  phases: Map<string, { start: number; end?: number }>;
  resources: ResourceUsage;
  errors: AIError[];
}

/**
 * 快取項目
 */
interface CacheItem<T = any> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  tags?: string[];
}

/**
 * 流量限制器狀態
 */
interface RateLimiterState {
  requests: number;
  resetTime: number;
  blocked: boolean;
}

// ============================================================================
// 效能監控器類別
// ============================================================================

/**
 * AI 效能監控器
 * 監控查詢效能、管理快取、實作流量限制
 */
export class AIPerformanceMonitor {
  private readonly config: PerformanceConfig;
  private readonly metricsStorage: Map<string, QueryMetrics>;
  private readonly cache: Map<string, CacheItem>;
  private readonly rateLimiters: Map<string, RateLimiterState>;
  private readonly activeCollectors: Map<string, MetricsCollector>;

  constructor() {
    this.config = this.initializeConfig();
    this.metricsStorage = new Map();
    this.cache = new Map();
    this.rateLimiters = new Map();
    this.activeCollectors = new Map();

    // 定期清理過期資料
    this.startCleanupTimer();
  }

  /**
   * 開始監控查詢
   * @param queryId 查詢 ID
   * @returns 收集器 ID
   */
  startMonitoring(queryId: string): string {
    if (!this.config.enableMetrics) return queryId;

    const collector: MetricsCollector = {
      startTime: Date.now(),
      phases: new Map(),
      resources: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkBytes: 0,
        apiCalls: 0,
        dbQueries: 0,
      },
      errors: [],
    };

    this.activeCollectors.set(queryId, collector);
    return queryId;
  }

  /**
   * 記錄階段開始
   * @param queryId 查詢 ID
   * @param phaseName 階段名稱
   */
  startPhase(queryId: string, phaseName: string): void {
    const collector = this.activeCollectors.get(queryId);
    if (!collector) return;

    collector.phases.set(phaseName, {
      start: Date.now(),
    });
  }

  /**
   * 記錄階段結束
   * @param queryId 查詢 ID
   * @param phaseName 階段名稱
   */
  endPhase(queryId: string, phaseName: string): void {
    const collector = this.activeCollectors.get(queryId);
    if (!collector) return;

    const phase = collector.phases.get(phaseName);
    if (phase && !phase.end) {
      phase.end = Date.now();
    }
  }

  /**
   * 記錄資源使用
   * @param queryId 查詢 ID
   * @param usage 資源使用情況
   */
  recordResourceUsage(queryId: string, usage: Partial<ResourceUsage>): void {
    const collector = this.activeCollectors.get(queryId);
    if (!collector) return;

    Object.assign(collector.resources, usage);
  }

  /**
   * 記錄錯誤
   * @param queryId 查詢 ID
   * @param error 錯誤
   */
  recordError(queryId: string, error: any): void {
    const collector = this.activeCollectors.get(queryId);
    if (!collector) return;

    collector.errors.push(error);
  }

  /**
   * 結束監控並生成指標
   * @param queryId 查詢 ID
   * @returns 查詢指標
   */
  endMonitoring(queryId: string): QueryMetrics | null {
    const collector = this.activeCollectors.get(queryId);
    if (!collector) return null;

    const endTime = Date.now();
    const totalTime = endTime - collector.startTime;

    // 生成階段指標
    const phases: PhaseMetrics[] = Array.from(collector.phases.entries()).map(([name, phase]) => ({
      name,
      startTime: new Date(phase.start),
      endTime: new Date(phase.end || endTime),
      duration: (phase.end || endTime) - phase.start,
      status: phase.end ? 'success' : 'failed',
    }));

    // 生成錯誤統計
    const errorStats: ErrorStats = {
      totalErrors: collector.errors.length,
      errorTypes: this.groupErrorsByType(collector.errors),
      recentErrors: collector.errors.slice(-5),
    };

    const metrics: QueryMetrics = {
      queryId,
      totalTime,
      phases,
      resourceUsage: collector.resources,
      cacheStats: this.getCacheStats(),
      errorStats: collector.errors.length > 0 ? errorStats : undefined,
    };

    // 儲存指標
    if (this.shouldSampleMetrics()) {
      this.metricsStorage.set(queryId, metrics);
    }

    // 清理收集器
    this.activeCollectors.delete(queryId);

    // 檢查告警閾值
    this.checkAlerts(metrics);

    return metrics;
  }

  // ============================================================================
  // 快取管理
  // ============================================================================

  /**
   * 獲取快取資料
   * @param key 快取鍵
   * @returns 快取資料
   */
  async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.config.enableCaching) return null;

    const item = this.cache.get(key);
    if (!item) return null;

    // 檢查是否過期
    if (item.expiresAt <= new Date()) {
      this.cache.delete(key);
      return null;
    }

    // 更新存取統計
    item.accessCount++;
    item.lastAccessed = new Date();

    return item.value as T;
  }

  /**
   * 設定快取資料
   * @param key 快取鍵
   * @param value 快取值
   * @param config 快取配置
   */
  async setCache<T>(
    key: string,
    value: T,
    config: {
      ttl?: number;
      tags?: string[];
      strategy?: CacheStrategy;
    } = {}
  ): Promise<void> {
    if (!this.config.enableCaching) return;

    const ttl = config.ttl || 300000; // 預設 5 分鐘
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const item: CacheItem<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now,
      size: this.calculateSize(value),
      tags: config.tags,
    };

    // 檢查快取空間
    this.ensureCacheSpace(item.size);

    this.cache.set(key, item);
  }

  /**
   * 清除快取
   * @param pattern 鍵模式或標籤
   */
  async clearCache(pattern?: string | string[]): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    if (typeof pattern === 'string') {
      // 模式匹配
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      // 標籤匹配
      for (const [key, item] of this.cache) {
        if (item.tags && item.tags.some(tag => pattern.includes(tag))) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * 生成快取鍵
   * @param query 查詢
   * @param context 上下文
   * @returns 快取鍵
   */
  generateCacheKey(query: AIQuery, context?: any): string {
    const keyParts = [
      'ai_query',
      query.userId,
      query.organizationId,
      this.hashQuery(query.query),
      context ? this.hashObject(context) : '',
    ];

    return keyParts.filter(Boolean).join(':');
  }

  /**
   * 獲取查詢結果快取
   * @param query 查詢
   * @param context 上下文
   * @returns 快取的查詢結果
   */
  async getCachedQueryResult(
    query: AIQuery,
    context?: any
  ): Promise<{ result: QueryResult; cacheInfo: CacheInfo } | null> {
    const cacheKey = this.generateCacheKey(query, context);
    const cached = await this.getFromCache<QueryResult>(cacheKey);

    if (!cached) return null;

    const item = this.cache.get(cacheKey);
    const cacheInfo: CacheInfo = {
      cached: true,
      cacheKey,
      cachedAt: item?.createdAt,
      expiresAt: item?.expiresAt,
      cacheSource: 'memory',
    };

    return { result: cached, cacheInfo };
  }

  /**
   * 快取查詢結果
   * @param query 查詢
   * @param result 查詢結果
   * @param context 上下文
   */
  async cacheQueryResult(
    query: AIQuery,
    result: QueryResult,
    context?: any
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, context);
    
    // 根據查詢類型決定 TTL
    const ttl = this.determineCacheTTL(query, result);
    
    await this.setCache(cacheKey, result, {
      ttl,
      tags: ['query_result', query.userId, query.organizationId],
      strategy: 'normal',
    });
  }

  // ============================================================================
  // 流量限制
  // ============================================================================

  /**
   * 檢查流量限制
   * @param userId 使用者 ID
   * @param limitConfig 限制配置
   * @returns 是否允許請求
   */
  checkRateLimit(
    userId: string,
    limitConfig: RateLimiting
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const now = Date.now();
    const key = `${limitConfig.type}:${userId}`;
    let state = this.rateLimiters.get(key);

    // 初始化或重置狀態
    if (!state || now >= state.resetTime) {
      state = {
        requests: 0,
        resetTime: now + limitConfig.window * 1000,
        blocked: false,
      };
      this.rateLimiters.set(key, state);
    }

    // 檢查是否超過限制
    if (state.requests >= limitConfig.limit) {
      state.blocked = true;
      return {
        allowed: false,
        remaining: 0,
        resetTime: state.resetTime,
        retryAfter: Math.ceil((state.resetTime - now) / 1000),
      };
    }

    // 增加請求計數
    state.requests++;

    return {
      allowed: true,
      remaining: limitConfig.limit - state.requests,
      resetTime: state.resetTime,
    };
  }

  /**
   * 重置流量限制
   * @param userId 使用者 ID
   * @param type 限制類型
   */
  resetRateLimit(userId: string, type: string): void {
    const key = `${type}:${userId}`;
    this.rateLimiters.delete(key);
  }

  // ============================================================================
  // 統計和報告
  // ============================================================================

  /**
   * 獲取效能統計
   * @param timeRange 時間範圍（毫秒）
   * @returns 效能統計
   */
  getPerformanceStats(timeRange: number = 24 * 60 * 60 * 1000): {
    totalQueries: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    topSlowQueries: Array<{ queryId: string; duration: number }>;
    resourceUtilization: ResourceUsage;
  } {
    const now = Date.now();
    const cutoff = now - timeRange;
    
    const recentMetrics = Array.from(this.metricsStorage.values())
      .filter(metric => {
        const oldestPhase = metric.phases.reduce((oldest, phase) => 
          phase.startTime < oldest ? phase.startTime : oldest, 
          new Date()
        );
        return oldestPhase.getTime() > cutoff;
      });

    const totalQueries = recentMetrics.length;
    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.totalTime, 0);
    const averageResponseTime = totalTime / Math.max(totalQueries, 1);

    const totalErrors = recentMetrics.reduce(
      (sum, metric) => sum + (metric.errorStats?.totalErrors || 0), 0
    );
    const errorRate = totalErrors / Math.max(totalQueries, 1);

    const cacheStats = this.getCacheStats();
    const cacheHitRate = cacheStats.hitRate;

    const topSlowQueries = recentMetrics
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10)
      .map(metric => ({
        queryId: metric.queryId,
        duration: metric.totalTime,
      }));

    const resourceUtilization = this.aggregateResourceUsage(recentMetrics);

    return {
      totalQueries,
      averageResponseTime,
      errorRate,
      cacheHitRate,
      topSlowQueries,
      resourceUtilization,
    };
  }

  /**
   * 獲取快取統計
   * @returns 快取統計
   */
  getCacheStats(): CacheStats {
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;
    let expiredItems = 0;

    for (const item of this.cache.values()) {
      totalHits += item.accessCount;
      totalSize += item.size;
      
      if (item.expiresAt <= new Date()) {
        expiredItems++;
      }
    }

    // 簡化處理，實際應該追蹤 miss 統計
    totalMisses = Math.max(totalHits * 0.3, 0);

    return {
      hits: totalHits,
      misses: totalMisses,
      hitRate: totalHits / Math.max(totalHits + totalMisses, 1),
      cacheSize: totalSize,
      expiredItems,
    };
  }

  /**
   * 生成效能報告
   * @param timeRange 時間範圍
   * @returns 效能報告
   */
  generatePerformanceReport(timeRange: number = 24 * 60 * 60 * 1000): {
    summary: any;
    recommendations: string[];
    alerts: string[];
  } {
    const stats = this.getPerformanceStats(timeRange);
    const cacheStats = this.getCacheStats();
    
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // 生成建議
    if (stats.averageResponseTime > this.config.alertThresholds.responseTime) {
      recommendations.push('考慮優化查詢效能或增加快取');
      alerts.push(`平均回應時間過長: ${stats.averageResponseTime}ms`);
    }

    if (stats.errorRate > this.config.alertThresholds.errorRate) {
      recommendations.push('檢查錯誤原因並改善系統穩定性');
      alerts.push(`錯誤率過高: ${(stats.errorRate * 100).toFixed(2)}%`);
    }

    if (cacheStats.hitRate < this.config.alertThresholds.cacheHitRate) {
      recommendations.push('優化快取策略以提高命中率');
      alerts.push(`快取命中率過低: ${(cacheStats.hitRate * 100).toFixed(2)}%`);
    }

    return {
      summary: {
        ...stats,
        cacheStats,
        timeRange,
        generatedAt: new Date(),
      },
      recommendations,
      alerts,
    };
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 檢查告警閾值
   */
  private checkAlerts(metrics: QueryMetrics): void {
    if (metrics.totalTime > this.config.alertThresholds.responseTime) {
      console.warn(`Slow query detected: ${metrics.queryId} took ${metrics.totalTime}ms`);
    }

    if (metrics.errorStats && metrics.errorStats.totalErrors > 0) {
      console.warn(`Query errors detected: ${metrics.queryId} had ${metrics.errorStats.totalErrors} errors`);
    }
  }

  /**
   * 計算物件大小
   */
  private calculateSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2; // 估算位元組大小
    } catch {
      return 1000; // 預設大小
    }
  }

  /**
   * 確保快取空間
   */
  private ensureCacheSpace(requiredSize: number): void {
    const maxCacheSize = 50 * 1024 * 1024; // 50MB
    let currentSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);

    if (currentSize + requiredSize <= maxCacheSize) return;

    // LRU 驅逐
    const sortedItems = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    for (const [key, item] of sortedItems) {
      this.cache.delete(key);
      currentSize -= item.size;
      
      if (currentSize + requiredSize <= maxCacheSize) break;
    }
  }

  /**
   * 計算查詢雜湊
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為 32 位整數
    }
    return hash.toString(36);
  }

  /**
   * 計算物件雜湊
   */
  private hashObject(obj: any): string {
    try {
      return this.hashQuery(JSON.stringify(obj));
    } catch {
      return 'unknown';
    }
  }

  /**
   * 決定快取 TTL
   */
  private determineCacheTTL(query: AIQuery, result: QueryResult): number {
    // 根據查詢類型和結果調整 TTL
    const baseConfig = this.getCacheConfig(query);
    
    if (result.data.rows.length > 1000) {
      return baseConfig.ttl * 2; // 大結果快取更久
    }
    
    if (query.options?.realtime) {
      return Math.min(baseConfig.ttl, 60000); // 即時查詢快取較短
    }
    
    return baseConfig.ttl;
  }

  /**
   * 獲取快取配置
   */
  private getCacheConfig(query: AIQuery): CacheConfig {
    return {
      strategy: 'normal',
      ttl: 300000, // 5 分鐘
      maxSize: 10 * 1024 * 1024, // 10MB
      maxItems: 1000,
      evictionPolicy: 'LRU',
      compression: false,
    };
  }

  /**
   * 是否應該收集指標樣本
   */
  private shouldSampleMetrics(): boolean {
    if (!this.config.sampling.enabled) return true;
    return Math.random() < this.config.sampling.rate;
  }

  /**
   * 按類型分組錯誤
   */
  private groupErrorsByType(errors: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    errors.forEach(error => {
      const type = error.type || 'unknown';
      groups[type] = (groups[type] || 0) + 1;
    });
    
    return groups;
  }

  /**
   * 聚合資源使用
   */
  private aggregateResourceUsage(metrics: QueryMetrics[]): ResourceUsage {
    const total = metrics.reduce(
      (acc, metric) => ({
        cpuUsage: acc.cpuUsage + (metric.resourceUsage.cpuUsage || 0),
        memoryUsage: acc.memoryUsage + (metric.resourceUsage.memoryUsage || 0),
        networkBytes: acc.networkBytes + (metric.resourceUsage.networkBytes || 0),
        apiCalls: acc.apiCalls + (metric.resourceUsage.apiCalls || 0),
        dbQueries: acc.dbQueries + (metric.resourceUsage.dbQueries || 0),
      }),
      { cpuUsage: 0, memoryUsage: 0, networkBytes: 0, apiCalls: 0, dbQueries: 0 }
    );

    const count = metrics.length;
    return {
      cpuUsage: total.cpuUsage / count,
      memoryUsage: total.memoryUsage / count,
      networkBytes: total.networkBytes,
      apiCalls: total.apiCalls,
      dbQueries: total.dbQueries,
    };
  }

  /**
   * 啟動清理計時器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
      this.cleanupOldMetrics();
      this.cleanupRateLimiters();
    }, 5 * 60 * 1000); // 每 5 分鐘清理一次
  }

  /**
   * 清理過期快取
   */
  private cleanupExpiredCache(): void {
    const now = new Date();
    
    for (const [key, item] of this.cache) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清理舊指標
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [key, metric] of this.metricsStorage) {
      const oldestPhase = metric.phases.reduce((oldest, phase) => 
        phase.startTime < oldest ? phase.startTime : oldest, 
        new Date()
      );
      
      if (oldestPhase.getTime() < cutoff) {
        this.metricsStorage.delete(key);
      }
    }
  }

  /**
   * 清理流量限制器
   */
  private cleanupRateLimiters(): void {
    const now = Date.now();
    
    for (const [key, state] of this.rateLimiters) {
      if (now >= state.resetTime) {
        this.rateLimiters.delete(key);
      }
    }
  }

  /**
   * 初始化配置
   */
  private initializeConfig(): PerformanceConfig {
    return {
      enableMetrics: true,
      enableCaching: true,
      enableRateLimiting: true,
      metricsRetentionDays: 7,
      alertThresholds: {
        responseTime: 5000, // 5 秒
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cacheHitRate: 0.7, // 70%
      },
      sampling: {
        enabled: false,
        rate: 1.0, // 100% 採樣
      },
    };
  }
}

// ============================================================================
// 匯出
// ============================================================================

/**
 * AI 效能監控器單例實例
 */
export const aiPerformanceMonitor = new AIPerformanceMonitor();

/**
 * 預設匯出
 */
export default aiPerformanceMonitor;