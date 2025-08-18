/**
 * Redis 快取實作
 * 用於生產環境的高效能快取
 */

import Redis from 'ioredis';
import { CacheInterface, CacheStats, CacheConfig } from './cache-interface';

export class RedisCache implements CacheInterface {
  private client: Redis;
  private keyPrefix: string;
  private defaultTTL: number;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    dels: 0
  };

  constructor(config: CacheConfig) {
    if (!config.redis) {
      throw new Error('Redis configuration is required');
    }

    this.keyPrefix = config.keyPrefix || 'dashboard:';
    this.defaultTTL = config.defaultTTL || 3600; // 預設 1 小時

    // 初始化 Redis 客戶端
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.database || 0,
      keyPrefix: this.keyPrefix,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // 連接池設定
      maxConnections: 10,
      minConnections: 2,
      // 錯誤處理
      enableOfflineQueue: false
    });

    // 事件監聽
    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }

  /**
   * 格式化快取鍵名
   */
  private formatKey(key: string): string {
    return key.startsWith(this.keyPrefix) ? key.slice(this.keyPrefix.length) : key;
  }

  /**
   * 序列化資料
   */
  private serialize(value: any): string {
    try {
      return JSON.stringify({
        data: value,
        timestamp: Date.now(),
        type: typeof value
      });
    } catch (error) {
      console.error('Serialization error:', error);
      throw new Error('Failed to serialize cache value');
    }
  }

  /**
   * 反序列化資料
   */
  private deserialize<T>(value: string): T | null {
    try {
      const parsed = JSON.parse(value);
      return parsed.data as T;
    } catch (error) {
      console.error('Deserialization error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      const serializedValue = this.serialize(value);
      const expiration = ttl || this.defaultTTL;

      await this.client.setex(formattedKey, expiration, serializedValue);
      this.stats.sets++;
      
      console.log(`Cache set: ${formattedKey} (TTL: ${expiration}s)`);
    } catch (error) {
      console.error('Cache set error:', error);
      throw new Error(`Failed to set cache for key: ${key}`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const formattedKey = this.formatKey(key);
      const value = await this.client.get(formattedKey);

      if (value === null) {
        this.stats.misses++;
        console.log(`Cache miss: ${formattedKey}`);
        return null;
      }

      this.stats.hits++;
      console.log(`Cache hit: ${formattedKey}`);
      
      return this.deserialize<T>(value);
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      await this.client.del(formattedKey);
      this.stats.dels++;
      
      console.log(`Cache deleted: ${formattedKey}`);
    } catch (error) {
      console.error('Cache del error:', error);
      throw new Error(`Failed to delete cache for key: ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const formattedPattern = this.formatKey(pattern);
      const keys = await this.client.keys(formattedPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.stats.dels += keys.length;
        console.log(`Cache pattern deleted: ${formattedPattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error('Cache delPattern error:', error);
      throw new Error(`Failed to delete cache pattern: ${pattern}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key);
      const result = await this.client.exists(formattedKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      await this.client.expire(formattedKey, ttl);
      console.log(`Cache expiration set: ${formattedKey} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Cache expire error:', error);
      throw new Error(`Failed to set expiration for key: ${key}`);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const formattedKey = this.formatKey(key);
      return await this.client.ttl(formattedKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  async flushAll(): Promise<void> {
    try {
      // 只刪除帶有指定前綴的鍵
      const keys = await this.client.keys('*');
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`Cache flushed: ${keys.length} keys deleted`);
      }
    } catch (error) {
      console.error('Cache flushAll error:', error);
      throw new Error('Failed to flush cache');
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.client.info('memory');
      const dbSize = await this.client.dbsize();
      
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      return {
        totalKeys: dbSize,
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage,
        connections: 1 // 簡化版本
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        connections: 0
      };
    }
  }

  /**
   * 關閉 Redis 連接
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}