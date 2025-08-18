/**
 * 快取工廠
 * 根據配置建立適當的快取實例
 */

import { CacheInterface, CacheConfig, CacheType } from './cache-interface';
import { RedisCache } from './redis-cache';
import { MemoryCache } from './memory-cache';

export class CacheFactory {
  private static instances: Map<string, CacheInterface> = new Map();

  /**
   * 建立快取實例
   */
  static createCache(config: CacheConfig, instanceName = 'default'): CacheInterface {
    // 檢查是否已存在實例
    const existingInstance = this.instances.get(instanceName);
    if (existingInstance) {
      console.log(`Returning existing cache instance: ${instanceName}`);
      return existingInstance;
    }

    let cache: CacheInterface;

    try {
      switch (config.type) {
        case 'redis':
          cache = new RedisCache(config);
          break;
        case 'memory':
          cache = new MemoryCache(config);
          break;
        default:
          console.warn(`Unsupported cache type: ${config.type}, falling back to memory cache`);
          cache = new MemoryCache({
            ...config,
            type: 'memory'
          });
      }

      // 快取實例以供重複使用
      this.instances.set(instanceName, cache);
      console.log(`Cache instance created: ${instanceName} (${config.type})`);

      return cache;
    } catch (error) {
      console.error(`Failed to create cache instance: ${instanceName}`, error);
      
      // 如果 Redis 建立失敗，回退到記憶體快取
      if (config.type === 'redis') {
        console.log('Falling back to memory cache');
        cache = new MemoryCache({
          ...config,
          type: 'memory'
        });
        this.instances.set(instanceName, cache);
        return cache;
      }
      
      throw error;
    }
  }

  /**
   * 獲取快取實例
   */
  static getCache(instanceName = 'default'): CacheInterface | null {
    return this.instances.get(instanceName) || null;
  }

  /**
   * 移除快取實例
   */
  static removeCache(instanceName = 'default'): void {
    const instance = this.instances.get(instanceName);
    if (instance) {
      // 清理資源
      if ('disconnect' in instance && typeof instance.disconnect === 'function') {
        instance.disconnect();
      }
      if ('close' in instance && typeof instance.close === 'function') {
        instance.close();
      }
      
      this.instances.delete(instanceName);
      console.log(`Cache instance removed: ${instanceName}`);
    }
  }

  /**
   * 清理所有快取實例
   */
  static clearAllInstances(): void {
    for (const [name, instance] of this.instances) {
      // 清理資源
      if ('disconnect' in instance && typeof instance.disconnect === 'function') {
        instance.disconnect();
      }
      if ('close' in instance && typeof instance.close === 'function') {
        instance.close();
      }
    }
    
    this.instances.clear();
    console.log('All cache instances cleared');
  }

  /**
   * 獲取所有實例狀態
   */
  static async getAllInstancesStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [name, instance] of this.instances) {
      try {
        const stats = await instance.getStats();
        
        // 檢查健康狀態
        let healthy = true;
        if ('healthCheck' in instance && typeof instance.healthCheck === 'function') {
          healthy = await instance.healthCheck();
        }

        status[name] = {
          type: instance.constructor.name,
          healthy,
          stats
        };
      } catch (error) {
        status[name] = {
          type: instance.constructor.name,
          healthy: false,
          error: error.message
        };
      }
    }

    return status;
  }
}

/**
 * 預設配置產生器
 */
export class CacheConfigBuilder {
  private config: Partial<CacheConfig> = {};

  static create(): CacheConfigBuilder {
    return new CacheConfigBuilder();
  }

  type(type: CacheType): this {
    this.config.type = type;
    return this;
  }

  keyPrefix(prefix: string): this {
    this.config.keyPrefix = prefix;
    return this;
  }

  defaultTTL(ttl: number): this {
    this.config.defaultTTL = ttl;
    return this;
  }

  redis(config: {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix?: string;
  }): this {
    this.config.redis = config;
    return this;
  }

  memory(config: {
    maxKeys: number;
    stdTTL: number;
    checkPeriod: number;
  }): this {
    this.config.memory = config;
    return this;
  }

  build(): CacheConfig {
    if (!this.config.type) {
      throw new Error('Cache type is required');
    }

    return {
      type: this.config.type,
      keyPrefix: this.config.keyPrefix || 'dashboard:',
      defaultTTL: this.config.defaultTTL || 3600,
      redis: this.config.redis,
      memory: this.config.memory
    };
  }
}

/**
 * 預設配置
 */
export const defaultCacheConfigs = {
  development: CacheConfigBuilder.create()
    .type('memory')
    .keyPrefix('dev:dashboard:')
    .defaultTTL(1800) // 30 分鐘
    .memory({
      maxKeys: 500,
      stdTTL: 1800,
      checkPeriod: 300
    })
    .build(),

  production: CacheConfigBuilder.create()
    .type('redis')
    .keyPrefix('prod:dashboard:')
    .defaultTTL(3600) // 1 小時
    .redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'prod:dashboard:'
    })
    .build(),

  testing: CacheConfigBuilder.create()
    .type('memory')
    .keyPrefix('test:dashboard:')
    .defaultTTL(300) // 5 分鐘
    .memory({
      maxKeys: 100,
      stdTTL: 300,
      checkPeriod: 60
    })
    .build()
};