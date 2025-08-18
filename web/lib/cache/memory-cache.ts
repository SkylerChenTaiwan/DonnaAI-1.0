/**
 * 記憶體快取實作
 * 用於開發環境或作為 Redis 的備用方案
 */

import NodeCache from 'node-cache';
import { CacheInterface, CacheStats, CacheConfig } from './cache-interface';

export class MemoryCache implements CacheInterface {
  private cache: NodeCache;
  private keyPrefix: string;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    dels: 0
  };

  constructor(config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || 'dashboard:';
    
    const memoryConfig = config.memory || {
      maxKeys: 1000,
      stdTTL: config.defaultTTL || 3600,
      checkPeriod: 600
    };

    // 初始化 NodeCache
    this.cache = new NodeCache({
      stdTTL: memoryConfig.stdTTL,
      checkperiod: memoryConfig.checkPeriod,
      maxKeys: memoryConfig.maxKeys,
      useClones: false, // 提升效能
      deleteOnExpire: true,
      enableLegacyCallbacks: false
    });

    // 事件監聽
    this.cache.on('set', (key, value) => {
      console.log(`Memory cache set: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      console.log(`Memory cache deleted: ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      console.log(`Memory cache expired: ${key}`);
    });

    this.cache.on('flush', () => {
      console.log('Memory cache flushed');
    });

    console.log('Memory cache initialized with config:', memoryConfig);
  }

  /**
   * 格式化快取鍵名
   */
  private formatKey(key: string): string {
    return this.keyPrefix + key;
  }

  /**
   * 序列化資料（記憶體快取可以直接存儲物件）
   */
  private serialize(value: any): any {
    return {
      data: value,
      timestamp: Date.now(),
      type: typeof value
    };
  }

  /**
   * 反序列化資料
   */
  private deserialize<T>(value: any): T | null {
    if (!value || typeof value !== 'object') {
      return value as T;
    }
    
    return value.data as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      const serializedValue = this.serialize(value);
      
      const success = this.cache.set(formattedKey, serializedValue, ttl);
      
      if (success) {
        this.stats.sets++;
        console.log(`Memory cache set: ${formattedKey} (TTL: ${ttl || 'default'}s)`);
      } else {
        throw new Error('Failed to set memory cache');
      }
    } catch (error) {
      console.error('Memory cache set error:', error);
      throw new Error(`Failed to set cache for key: ${key}`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const formattedKey = this.formatKey(key);
      const value = this.cache.get(formattedKey);

      if (value === undefined) {
        this.stats.misses++;
        console.log(`Memory cache miss: ${formattedKey}`);
        return null;
      }

      this.stats.hits++;
      console.log(`Memory cache hit: ${formattedKey}`);
      
      return this.deserialize<T>(value);
    } catch (error) {
      console.error('Memory cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      const deleted = this.cache.del(formattedKey);
      
      if (deleted > 0) {
        this.stats.dels++;
        console.log(`Memory cache deleted: ${formattedKey}`);
      }
    } catch (error) {
      console.error('Memory cache del error:', error);
      throw new Error(`Failed to delete cache for key: ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const formattedPattern = this.formatKey(pattern);
      
      // 取得所有符合模式的鍵
      const keys = this.cache.keys().filter(key => {
        // 簡單的萬用字元匹配
        const regex = new RegExp(formattedPattern.replace(/\*/g, '.*'));
        return regex.test(key);
      });

      if (keys.length > 0) {
        const deleted = this.cache.del(keys);
        this.stats.dels += deleted;
        console.log(`Memory cache pattern deleted: ${formattedPattern} (${deleted} keys)`);
      }
    } catch (error) {
      console.error('Memory cache delPattern error:', error);
      throw new Error(`Failed to delete cache pattern: ${pattern}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key);
      return this.cache.has(formattedKey);
    } catch (error) {
      console.error('Memory cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      const success = this.cache.ttl(formattedKey, ttl);
      
      if (success) {
        console.log(`Memory cache expiration set: ${formattedKey} (TTL: ${ttl}s)`);
      } else {
        throw new Error('Key not found or failed to set TTL');
      }
    } catch (error) {
      console.error('Memory cache expire error:', error);
      throw new Error(`Failed to set expiration for key: ${key}`);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const formattedKey = this.formatKey(key);
      return this.cache.getTtl(formattedKey) || -1;
    } catch (error) {
      console.error('Memory cache TTL error:', error);
      return -1;
    }
  }

  async flushAll(): Promise<void> {
    try {
      // 只刪除帶有指定前綴的鍵
      const keys = this.cache.keys().filter(key => key.startsWith(this.keyPrefix));
      
      if (keys.length > 0) {
        const deleted = this.cache.del(keys);
        console.log(`Memory cache flushed: ${deleted} keys deleted`);
      }
    } catch (error) {
      console.error('Memory cache flushAll error:', error);
      throw new Error('Failed to flush cache');
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const keys = this.cache.keys();
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      // 估算記憶體使用量（簡化版本）
      const memoryUsage = keys.length * 1024; // 假設每個鍵平均 1KB

      return {
        totalKeys: keys.length,
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage
      };
    } catch (error) {
      console.error('Memory cache getStats error:', error);
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * 清理過期的快取項目
   */
  pruneExpired(): void {
    try {
      this.cache.flushStats();
      console.log('Memory cache expired items pruned');
    } catch (error) {
      console.error('Memory cache prune error:', error);
    }
  }

  /**
   * 獲取詳細統計資訊
   */
  getDetailedStats() {
    return {
      ...this.stats,
      nodeCache: this.cache.getStats()
    };
  }

  /**
   * 關閉快取（清理資源）
   */
  close(): void {
    try {
      this.cache.close();
      console.log('Memory cache closed');
    } catch (error) {
      console.error('Memory cache close error:', error);
    }
  }
}