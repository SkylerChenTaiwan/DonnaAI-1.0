/**
 * 快取介面定義
 * 提供統一的快取操作抽象層
 */

export interface CacheInterface {
  /**
   * 設置快取
   */
  set(key: string, value: any, ttl?: number): Promise<void>;
  
  /**
   * 獲取快取
   */
  get<T = any>(key: string): Promise<T | null>;
  
  /**
   * 刪除快取
   */
  del(key: string): Promise<void>;
  
  /**
   * 批次刪除快取
   */
  delPattern(pattern: string): Promise<void>;
  
  /**
   * 檢查快取是否存在
   */
  exists(key: string): Promise<boolean>;
  
  /**
   * 設置快取過期時間
   */
  expire(key: string, ttl: number): Promise<void>;
  
  /**
   * 獲取剩餘過期時間
   */
  ttl(key: string): Promise<number>;
  
  /**
   * 清空所有快取
   */
  flushAll(): Promise<void>;
  
  /**
   * 獲取快取統計資訊
   */
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  memoryUsage: number;
  connections?: number;
}

export type CacheType = 'redis' | 'memory' | 'firestore';

export interface CacheConfig {
  type: CacheType;
  redis?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix?: string;
  };
  memory?: {
    maxKeys: number;
    stdTTL: number;
    checkPeriod: number;
  };
  defaultTTL: number;
  keyPrefix: string;
}