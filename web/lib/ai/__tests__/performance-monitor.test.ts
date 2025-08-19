/**
 * PRP-124: 效能監控器單元測試
 * 
 * @description 測試效能監控、快取管理和流量限制功能
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { AIPerformanceMonitor } from '../performance-monitor';
import type { AIQuery, QueryResult } from '../../../docs/types/ai-query-data-models';

// Mock memory cache manager
jest.mock('@/lib/cache/memory-cache', () => ({
  memoryCacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
}));

describe('AIPerformanceMonitor', () => {
  let performanceMonitor: AIPerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new AIPerformanceMonitor();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('monitoring lifecycle', () => {
    // 1. 預期使用測試
    it('should start and end monitoring correctly', () => {
      const queryId = 'test-query-1';
      
      const collectorId = performanceMonitor.startMonitoring(queryId);
      expect(collectorId).toBe(queryId);

      // Simulate some work
      performanceMonitor.startPhase(queryId, 'parsing');
      jest.advanceTimersByTime(100);
      performanceMonitor.endPhase(queryId, 'parsing');

      performanceMonitor.startPhase(queryId, 'execution');
      jest.advanceTimersByTime(200);
      performanceMonitor.endPhase(queryId, 'execution');

      const metrics = performanceMonitor.endMonitoring(queryId);

      expect(metrics).toBeDefined();
      expect(metrics!.queryId).toBe(queryId);
      expect(metrics!.totalTime).toBeGreaterThan(0);
      expect(metrics!.phases).toHaveLength(2);
      expect(metrics!.phases[0].name).toBe('parsing');
      expect(metrics!.phases[1].name).toBe('execution');
    });

    it('should record resource usage', () => {
      const queryId = 'test-query-2';
      
      performanceMonitor.startMonitoring(queryId);
      
      performanceMonitor.recordResourceUsage(queryId, {
        cpuUsage: 0.5,
        memoryUsage: 1024,
        networkBytes: 2048,
        apiCalls: 3,
        dbQueries: 2
      });

      const metrics = performanceMonitor.endMonitoring(queryId);

      expect(metrics!.resourceUsage).toEqual({
        cpuUsage: 0.5,
        memoryUsage: 1024,
        networkBytes: 2048,
        apiCalls: 3,
        dbQueries: 2
      });
    });

    it('should record errors during monitoring', () => {
      const queryId = 'test-query-3';
      
      performanceMonitor.startMonitoring(queryId);
      
      const error = { 
        type: 'network_error',
        message: 'Connection failed',
        timestamp: new Date()
      };
      
      performanceMonitor.recordError(queryId, error);

      const metrics = performanceMonitor.endMonitoring(queryId);

      expect(metrics!.errorStats).toBeDefined();
      expect(metrics!.errorStats!.totalErrors).toBe(1);
      expect(metrics!.errorStats!.recentErrors).toContain(error);
    });

    // 2. 邊界條件測試
    it('should handle monitoring disabled', () => {
      // Mock config to disable metrics
      (performanceMonitor as any).config.enableMetrics = false;

      const queryId = 'disabled-test';
      const collectorId = performanceMonitor.startMonitoring(queryId);
      
      expect(collectorId).toBe(queryId);
      
      const metrics = performanceMonitor.endMonitoring(queryId);
      expect(metrics).toBeNull();
    });

    it('should handle non-existent query IDs gracefully', () => {
      const queryId = 'non-existent';
      
      // Should not throw errors
      performanceMonitor.startPhase(queryId, 'test');
      performanceMonitor.endPhase(queryId, 'test');
      performanceMonitor.recordResourceUsage(queryId, { cpuUsage: 0.1 });
      performanceMonitor.recordError(queryId, new Error('test'));
      
      const metrics = performanceMonitor.endMonitoring(queryId);
      expect(metrics).toBeNull();
    });

    // 3. 失敗情況測試
    it('should handle incomplete phases', () => {
      const queryId = 'incomplete-test';
      
      performanceMonitor.startMonitoring(queryId);
      performanceMonitor.startPhase(queryId, 'parsing');
      // Don't end the phase

      const metrics = performanceMonitor.endMonitoring(queryId);

      expect(metrics!.phases[0].status).toBe('failed');
      expect(metrics!.phases[0].endTime).toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should cache and retrieve data correctly', async () => {
      const key = 'test-cache-key';
      const value = { data: 'test data' };

      await performanceMonitor.setCache(key, value);
      const retrieved = await performanceMonitor.getFromCache(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle cache expiration', async () => {
      const key = 'expiring-key';
      const value = { data: 'expiring data' };

      await performanceMonitor.setCache(key, value, { ttl: 1000 }); // 1 second

      // Advance time beyond TTL
      jest.advanceTimersByTime(2000);

      const retrieved = await performanceMonitor.getFromCache(key);
      expect(retrieved).toBeNull();
    });

    it('should update access statistics', async () => {
      const key = 'stats-key';
      const value = { data: 'stats data' };

      await performanceMonitor.setCache(key, value);
      
      // Access multiple times
      await performanceMonitor.getFromCache(key);
      await performanceMonitor.getFromCache(key);
      await performanceMonitor.getFromCache(key);

      const cacheStats = performanceMonitor.getCacheStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
    });

    it('should clear cache by pattern', async () => {
      await performanceMonitor.setCache('user:123:data', { user: 123 });
      await performanceMonitor.setCache('user:456:data', { user: 456 });
      await performanceMonitor.setCache('config:global', { config: 'global' });

      await performanceMonitor.clearCache('user:*');

      const user123 = await performanceMonitor.getFromCache('user:123:data');
      const config = await performanceMonitor.getFromCache('config:global');

      expect(user123).toBeNull();
      expect(config).toEqual({ config: 'global' });
    });

    it('should clear cache by tags', async () => {
      await performanceMonitor.setCache('data1', { id: 1 }, { tags: ['user', 'temp'] });
      await performanceMonitor.setCache('data2', { id: 2 }, { tags: ['system'] });
      await performanceMonitor.setCache('data3', { id: 3 }, { tags: ['user'] });

      await performanceMonitor.clearCache(['user']);

      const data1 = await performanceMonitor.getFromCache('data1');
      const data2 = await performanceMonitor.getFromCache('data2');
      const data3 = await performanceMonitor.getFromCache('data3');

      expect(data1).toBeNull();
      expect(data2).toEqual({ id: 2 });
      expect(data3).toBeNull();
    });

    it('should handle cache disabled', async () => {
      (performanceMonitor as any).config.enableCaching = false;

      const key = 'disabled-cache-key';
      const value = { data: 'test' };

      await performanceMonitor.setCache(key, value);
      const retrieved = await performanceMonitor.getFromCache(key);

      expect(retrieved).toBeNull();
    });
  });

  describe('query result caching', () => {
    it('should cache and retrieve query results', async () => {
      const query: AIQuery = {
        query: '這個月的營收',
        userId: 'user123',
        organizationId: 'org456',
        sessionId: 'session789'
      };

      const result: QueryResult = {
        queryId: 'result123',
        status: 'success',
        data: {
          columns: [],
          rows: [],
          aggregations: [],
          summary: {
            totalRows: 0,
            timeRange: undefined,
            keyMetrics: {},
            qualityScore: 1.0
          },
          sources: []
        },
        metadata: {
          executionTime: 100,
          rowCount: 0,
          dataSources: [],
          lastUpdated: new Date(),
          traceId: 'trace123'
        }
      };

      await performanceMonitor.cacheQueryResult(query, result);
      const cached = await performanceMonitor.getCachedQueryResult(query);

      expect(cached).toBeDefined();
      expect(cached!.result).toEqual(result);
      expect(cached!.cacheInfo.cached).toBe(true);
      expect(cached!.cacheInfo.cacheSource).toBe('memory');
    });

    it('should generate consistent cache keys', () => {
      const query1: AIQuery = {
        query: '營收統計',
        userId: 'user1',
        organizationId: 'org1',
        sessionId: 'session1'
      };

      const query2: AIQuery = {
        query: '營收統計',
        userId: 'user1',
        organizationId: 'org1',
        sessionId: 'session2' // Different session
      };

      const key1 = performanceMonitor.generateCacheKey(query1);
      const key2 = performanceMonitor.generateCacheKey(query2);

      expect(key1).toBe(key2); // Session ID should not affect cache key
    });

    it('should determine appropriate TTL based on query type', () => {
      const realtimeQuery: AIQuery = {
        query: '即時數據',
        userId: 'user1',
        organizationId: 'org1',
        sessionId: 'session1',
        options: { realtime: true }
      };

      const normalQuery: AIQuery = {
        query: '月度統計',
        userId: 'user1',
        organizationId: 'org1',
        sessionId: 'session1'
      };

      const mockResult: QueryResult = {
        queryId: 'test',
        status: 'success',
        data: {
          columns: [],
          rows: new Array(100).fill({}), // Small result
          aggregations: [],
          summary: {
            totalRows: 100,
            timeRange: undefined,
            keyMetrics: {},
            qualityScore: 1.0
          },
          sources: []
        },
        metadata: {
          executionTime: 100,
          rowCount: 100,
          dataSources: [],
          lastUpdated: new Date(),
          traceId: 'trace123'
        }
      };

      const realtimeTTL = (performanceMonitor as any).determineCacheTTL(realtimeQuery, mockResult);
      const normalTTL = (performanceMonitor as any).determineCacheTTL(normalQuery, mockResult);

      expect(realtimeTTL).toBeLessThan(normalTTL);
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limits', () => {
      const userId = 'user123';
      const limitConfig = {
        type: 'query',
        limit: 10,
        window: 60 // 60 seconds
      };

      const result = performanceMonitor.checkRateLimit(userId, limitConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should block requests exceeding limits', () => {
      const userId = 'user456';
      const limitConfig = {
        type: 'query',
        limit: 2,
        window: 60
      };

      // Make requests up to limit
      performanceMonitor.checkRateLimit(userId, limitConfig);
      performanceMonitor.checkRateLimit(userId, limitConfig);
      
      // Third request should be blocked
      const result = performanceMonitor.checkRateLimit(userId, limitConfig);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset limits after window expires', () => {
      const userId = 'user789';
      const limitConfig = {
        type: 'query',
        limit: 1,
        window: 1 // 1 second
      };

      // Use up the limit
      performanceMonitor.checkRateLimit(userId, limitConfig);
      const blocked = performanceMonitor.checkRateLimit(userId, limitConfig);
      expect(blocked.allowed).toBe(false);

      // Advance time beyond window
      jest.advanceTimersByTime(2000);

      // Should be allowed again
      const allowed = performanceMonitor.checkRateLimit(userId, limitConfig);
      expect(allowed.allowed).toBe(true);
    });

    it('should handle rate limiting disabled', () => {
      (performanceMonitor as any).config.enableRateLimiting = false;

      const userId = 'unlimited-user';
      const limitConfig = {
        type: 'query',
        limit: 1,
        window: 60
      };

      // Should allow unlimited requests
      const result1 = performanceMonitor.checkRateLimit(userId, limitConfig);
      const result2 = performanceMonitor.checkRateLimit(userId, limitConfig);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(Infinity);
    });

    it('should reset rate limits manually', () => {
      const userId = 'reset-user';
      const limitConfig = {
        type: 'query',
        limit: 1,
        window: 60
      };

      // Use up the limit
      performanceMonitor.checkRateLimit(userId, limitConfig);
      const blocked = performanceMonitor.checkRateLimit(userId, limitConfig);
      expect(blocked.allowed).toBe(false);

      // Reset limits
      performanceMonitor.resetRateLimit(userId, 'query');

      // Should be allowed again
      const allowed = performanceMonitor.checkRateLimit(userId, limitConfig);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('performance statistics', () => {
    it('should calculate performance statistics', () => {
      // Set up some test data
      const queryIds = ['q1', 'q2', 'q3'];
      
      queryIds.forEach((queryId, index) => {
        performanceMonitor.startMonitoring(queryId);
        jest.advanceTimersByTime(100 * (index + 1)); // Different execution times
        
        if (index === 2) {
          // Add an error to the last query
          performanceMonitor.recordError(queryId, { 
            type: 'network_error',
            message: 'Test error'
          });
        }
        
        performanceMonitor.endMonitoring(queryId);
      });

      const stats = performanceMonitor.getPerformanceStats();

      expect(stats.totalQueries).toBe(3);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(stats.errorRate).toBeGreaterThan(0);
      expect(stats.topSlowQueries).toBeDefined();
      expect(stats.resourceUtilization).toBeDefined();
    });

    it('should generate performance report with recommendations', () => {
      // Set up test data with high error rate
      for (let i = 0; i < 5; i++) {
        const queryId = `error-query-${i}`;
        performanceMonitor.startMonitoring(queryId);
        performanceMonitor.recordError(queryId, {
          type: 'ai_service_error',
          message: 'Service error'
        });
        performanceMonitor.endMonitoring(queryId);
      }

      const report = performanceMonitor.generatePerformanceReport();

      expect(report.summary).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.alerts.length).toBeGreaterThan(0);
      expect(report.alerts[0]).toContain('錯誤率過高');
    });

    it('should provide cache statistics', () => {
      // Add some cache data
      performanceMonitor.setCache('key1', { data: 'value1' });
      performanceMonitor.setCache('key2', { data: 'value2' });
      
      // Access cache to generate hits
      performanceMonitor.getFromCache('key1');
      performanceMonitor.getFromCache('key1');

      const cacheStats = performanceMonitor.getCacheStats();

      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
      expect(cacheStats.cacheSize).toBeGreaterThan(0);
    });
  });

  describe('cleanup and maintenance', () => {
    it('should cleanup expired cache entries', () => {
      // Add expired entries
      const expiredItem = {
        key: 'expired',
        value: { data: 'expired' },
        createdAt: new Date(Date.now() - 2000),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        accessCount: 0,
        lastAccessed: new Date(),
        size: 100
      };

      const validItem = {
        key: 'valid',
        value: { data: 'valid' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10000), // Expires in 10 seconds
        accessCount: 0,
        lastAccessed: new Date(),
        size: 100
      };

      (performanceMonitor as any).cache.set('expired', expiredItem);
      (performanceMonitor as any).cache.set('valid', validItem);

      // Trigger cleanup
      (performanceMonitor as any).cleanupExpiredCache();

      expect((performanceMonitor as any).cache.has('expired')).toBe(false);
      expect((performanceMonitor as any).cache.has('valid')).toBe(true);
    });

    it('should cleanup old metrics', () => {
      const oldMetric = {
        queryId: 'old-query',
        totalTime: 1000,
        phases: [
          {
            name: 'test',
            startTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
            endTime: new Date(),
            duration: 1000,
            status: 'success'
          }
        ],
        resourceUsage: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkBytes: 0,
          apiCalls: 0,
          dbQueries: 0
        },
        cacheStats: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          cacheSize: 0,
          expiredItems: 0
        }
      };

      const recentMetric = {
        ...oldMetric,
        queryId: 'recent-query',
        phases: [
          {
            ...oldMetric.phases[0],
            startTime: new Date(), // Recent
          }
        ]
      };

      (performanceMonitor as any).metricsStorage.set('old-query', oldMetric);
      (performanceMonitor as any).metricsStorage.set('recent-query', recentMetric);

      // Trigger cleanup (retention: 7 days)
      (performanceMonitor as any).cleanupOldMetrics();

      expect((performanceMonitor as any).metricsStorage.has('old-query')).toBe(false);
      expect((performanceMonitor as any).metricsStorage.has('recent-query')).toBe(true);
    });

    it('should cleanup expired rate limiters', () => {
      const expiredLimiter = {
        requests: 5,
        resetTime: Date.now() - 1000, // Expired
        blocked: false
      };

      const activeLimiter = {
        requests: 3,
        resetTime: Date.now() + 10000, // Active
        blocked: false
      };

      (performanceMonitor as any).rateLimiters.set('expired:user1', expiredLimiter);
      (performanceMonitor as any).rateLimiters.set('active:user2', activeLimiter);

      // Trigger cleanup
      (performanceMonitor as any).cleanupRateLimiters();

      expect((performanceMonitor as any).rateLimiters.has('expired:user1')).toBe(false);
      expect((performanceMonitor as any).rateLimiters.has('active:user2')).toBe(true);
    });
  });

  describe('performance and scalability', () => {
    it('should handle high-frequency monitoring', () => {
      const queryCount = 100;
      const startTime = Date.now();

      for (let i = 0; i < queryCount; i++) {
        const queryId = `perf-test-${i}`;
        performanceMonitor.startMonitoring(queryId);
        performanceMonitor.startPhase(queryId, 'test-phase');
        performanceMonitor.endPhase(queryId, 'test-phase');
        performanceMonitor.endMonitoring(queryId);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should manage memory usage efficiently', async () => {
      // Add many cache entries
      for (let i = 0; i < 1000; i++) {
        await performanceMonitor.setCache(`key-${i}`, { 
          data: 'x'.repeat(1000) // 1KB per entry
        });
      }

      const cacheStats = performanceMonitor.getCacheStats();
      
      // Cache should automatically evict items to stay within limits
      expect(cacheStats.cacheSize).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });
});