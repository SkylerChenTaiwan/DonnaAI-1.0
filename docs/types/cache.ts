/**
 * 快取系統型別定義
 * 支援多種快取策略和儲存後端
 */

/**
 * 快取鍵值型別
 */
export type CacheKey = string | number | symbol;

/**
 * 快取值型別
 */
export type CacheValue = any;

/**
 * 快取項目
 */
export interface CacheEntry<T = any> {
  key: CacheKey;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

/* ============================================
   快取策略
   ============================================ */

/**
 * 快取策略型別
 */
export type CacheStrategy =
  | 'lru' // Least Recently Used
  | 'lfu' // Least Frequently Used
  | 'fifo' // First In First Out
  | 'lifo' // Last In First Out
  | 'ttl' // Time To Live
  | 'mru' // Most Recently Used
  | 'rr' // Random Replacement
  | 'arc'; // Adaptive Replacement Cache

/**
 * 快取策略配置
 */
export interface CacheStrategyConfig {
  type: CacheStrategy;
  maxSize?: number;
  maxAge?: number;
  updateAgeOnGet?: boolean;
  updateAgeOnHas?: boolean;
  resetAgeOnUpdate?: boolean;
}

/* ============================================
   快取儲存介面
   ============================================ */

/**
 * 快取儲存介面
 */
export interface CacheStore<T = any> {
  get(key: CacheKey): Promise<T | undefined>;
  set(key: CacheKey, value: T, ttl?: number): Promise<void>;
  has(key: CacheKey): Promise<boolean>;
  delete(key: CacheKey): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<CacheKey[]>;
  values(): Promise<T[]>;
  entries(): Promise<Array<[CacheKey, T]>>;
}

/**
 * 記憶體快取儲存
 */
export class MemoryCacheStore<T = any> implements CacheStore<T> {
  private cache: Map<CacheKey, CacheEntry<T>> = new Map();

  async get(key: CacheKey): Promise<T | undefined> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  async set(key: CacheKey, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: new Date(),
      expiresAt: ttl ? new Date(Date.now() + ttl * 1000) : undefined,
    };
    
    this.cache.set(key, entry);
  }

  async has(key: CacheKey): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async delete(key: CacheKey): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async keys(): Promise<CacheKey[]> {
    return Array.from(this.cache.keys());
  }

  async values(): Promise<T[]> {
    const values: T[] = [];
    for (const entry of this.cache.values()) {
      if (!entry.expiresAt || entry.expiresAt >= new Date()) {
        values.push(entry.value);
      }
    }
    return values;
  }

  async entries(): Promise<Array<[CacheKey, T]>> {
    const entries: Array<[CacheKey, T]> = [];
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.expiresAt || entry.expiresAt >= new Date()) {
        entries.push([key, entry.value]);
      }
    }
    return entries;
  }
}

/* ============================================
   Redis 快取
   ============================================ */

/**
 * Redis 快取配置
 */
export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
}

/**
 * Redis 快取操作
 */
export interface RedisCache extends CacheStore {
  // 字串操作
  increment(key: CacheKey, value?: number): Promise<number>;
  decrement(key: CacheKey, value?: number): Promise<number>;
  append(key: CacheKey, value: string): Promise<number>;
  
  // 列表操作
  lpush(key: CacheKey, ...values: any[]): Promise<number>;
  rpush(key: CacheKey, ...values: any[]): Promise<number>;
  lpop(key: CacheKey): Promise<any>;
  rpop(key: CacheKey): Promise<any>;
  lrange(key: CacheKey, start: number, stop: number): Promise<any[]>;
  
  // 集合操作
  sadd(key: CacheKey, ...members: any[]): Promise<number>;
  srem(key: CacheKey, ...members: any[]): Promise<number>;
  smembers(key: CacheKey): Promise<any[]>;
  sismember(key: CacheKey, member: any): Promise<boolean>;
  
  // 雜湊操作
  hset(key: CacheKey, field: string, value: any): Promise<number>;
  hget(key: CacheKey, field: string): Promise<any>;
  hgetall(key: CacheKey): Promise<Record<string, any>>;
  hdel(key: CacheKey, ...fields: string[]): Promise<number>;
  
  // 過期時間
  expire(key: CacheKey, seconds: number): Promise<boolean>;
  ttl(key: CacheKey): Promise<number>;
  persist(key: CacheKey): Promise<boolean>;
}

/* ============================================
   快取管理器
   ============================================ */

/**
 * 快取管理器配置
 */
export interface CacheManagerConfig {
  stores: Record<string, CacheStore>;
  defaultStore?: string;
  ttl?: number;
  refreshAhead?: number;
  isCacheable?: (value: any) => boolean;
  onError?: (error: Error) => void;
}

/**
 * 快取管理器
 */
export class CacheManager {
  private stores: Record<string, CacheStore>;
  private defaultStore: string;
  private config: CacheManagerConfig;

  constructor(config: CacheManagerConfig) {
    this.stores = config.stores;
    this.defaultStore = config.defaultStore || Object.keys(config.stores)[0];
    this.config = config;
  }

  /**
   * 取得快取值
   */
  async get<T>(key: CacheKey, store?: string): Promise<T | undefined> {
    const targetStore = this.getStore(store);
    return targetStore.get(key);
  }

  /**
   * 設定快取值
   */
  async set<T>(key: CacheKey, value: T, ttl?: number, store?: string): Promise<void> {
    if (this.config.isCacheable && !this.config.isCacheable(value)) {
      return;
    }
    
    const targetStore = this.getStore(store);
    return targetStore.set(key, value, ttl || this.config.ttl);
  }

  /**
   * 取得或設定快取
   */
  async getOrSet<T>(
    key: CacheKey,
    factory: () => Promise<T> | T,
    ttl?: number,
    store?: string
  ): Promise<T> {
    let value = await this.get<T>(key, store);
    
    if (value === undefined) {
      value = await factory();
      await this.set(key, value, ttl, store);
    }
    
    return value;
  }

  /**
   * 刪除快取
   */
  async delete(key: CacheKey, store?: string): Promise<boolean> {
    const targetStore = this.getStore(store);
    return targetStore.delete(key);
  }

  /**
   * 清空快取
   */
  async clear(store?: string): Promise<void> {
    if (store) {
      const targetStore = this.getStore(store);
      return targetStore.clear();
    }
    
    // 清空所有儲存
    await Promise.all(
      Object.values(this.stores).map(s => s.clear())
    );
  }

  /**
   * 取得儲存實例
   */
  private getStore(store?: string): CacheStore {
    const storeName = store || this.defaultStore;
    const targetStore = this.stores[storeName];
    
    if (!targetStore) {
      throw new Error(`Cache store "${storeName}" not found`);
    }
    
    return targetStore;
  }
}

/* ============================================
   快取裝飾器
   ============================================ */

/**
 * 快取裝飾器選項
 */
export interface CacheDecoratorOptions {
  key?: string | ((...args: any[]) => string);
  ttl?: number;
  store?: string;
  condition?: (...args: any[]) => boolean;
  invalidate?: string[];
}

/**
 * 方法快取裝飾器
 */
export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // 檢查條件
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }
      
      // 生成快取鍵
      const cacheKey = typeof options.key === 'function'
        ? options.key(...args)
        : options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // 嘗試從快取取得
      const cacheManager = (this as any).cacheManager;
      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }
      
      return cacheManager.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        options.ttl,
        options.store
      );
    };
    
    return descriptor;
  };
}

/**
 * 快取清除裝飾器
 */
export function CacheEvict(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // 清除快取
      const cacheManager = (this as any).cacheManager;
      if (cacheManager && options.invalidate) {
        await Promise.all(
          options.invalidate.map(key => cacheManager.delete(key))
        );
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/* ============================================
   快取標籤系統
   ============================================ */

/**
 * 標籤快取介面
 */
export interface TaggedCache extends CacheStore {
  tag(tags: string | string[]): TaggedCache;
  flush(): Promise<void>;
  getTags(): string[];
}

/**
 * 標籤快取實作
 */
export class TaggedCacheStore implements TaggedCache {
  private store: CacheStore;
  private currentTags: string[] = [];
  private tagIndex: Map<string, Set<CacheKey>> = new Map();

  constructor(store: CacheStore) {
    this.store = store;
  }

  tag(tags: string | string[]): TaggedCache {
    this.currentTags = Array.isArray(tags) ? tags : [tags];
    return this;
  }

  async get(key: CacheKey): Promise<any> {
    return this.store.get(key);
  }

  async set(key: CacheKey, value: any, ttl?: number): Promise<void> {
    await this.store.set(key, value, ttl);
    
    // 更新標籤索引
    for (const tag of this.currentTags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
    
    // 重置當前標籤
    this.currentTags = [];
  }

  async has(key: CacheKey): Promise<boolean> {
    return this.store.has(key);
  }

  async delete(key: CacheKey): Promise<boolean> {
    // 從標籤索引中移除
    for (const keys of this.tagIndex.values()) {
      keys.delete(key);
    }
    
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.tagIndex.clear();
    return this.store.clear();
  }

  async flush(): Promise<void> {
    // 刪除所有標記的鍵
    const keysToDelete = new Set<CacheKey>();
    
    for (const tag of this.currentTags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach(key => keysToDelete.add(key));
        this.tagIndex.delete(tag);
      }
    }
    
    await Promise.all(
      Array.from(keysToDelete).map(key => this.store.delete(key))
    );
    
    this.currentTags = [];
  }

  getTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  async size(): Promise<number> {
    return this.store.size();
  }

  async keys(): Promise<CacheKey[]> {
    return this.store.keys();
  }

  async values(): Promise<any[]> {
    return this.store.values();
  }

  async entries(): Promise<Array<[CacheKey, any]>> {
    return this.store.entries();
  }
}

/* ============================================
   快取預熱
   ============================================ */

/**
 * 快取預熱配置
 */
export interface CacheWarmupConfig {
  keys: Array<{
    key: CacheKey;
    factory: () => Promise<any> | any;
    ttl?: number;
    store?: string;
  }>;
  parallel?: boolean;
  onError?: (key: CacheKey, error: Error) => void;
  onSuccess?: (key: CacheKey, value: any) => void;
}

/**
 * 快取預熱器
 */
export class CacheWarmer {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * 執行快取預熱
   */
  async warmup(config: CacheWarmupConfig): Promise<void> {
    const tasks = config.keys.map(async ({ key, factory, ttl, store }) => {
      try {
        const value = await factory();
        await this.cacheManager.set(key, value, ttl, store);
        
        if (config.onSuccess) {
          config.onSuccess(key, value);
        }
      } catch (error) {
        if (config.onError) {
          config.onError(key, error as Error);
        } else {
          throw error;
        }
      }
    });
    
    if (config.parallel) {
      await Promise.all(tasks);
    } else {
      for (const task of tasks) {
        await task;
      }
    }
  }
}