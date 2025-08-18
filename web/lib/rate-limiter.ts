/**
 * 優化的速率限制器實作
 * 使用 LRU Cache 避免記憶體洩漏
 */

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, ApiResponse } from './middleware';

// LRU Cache 實作
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // 移到最後（最近使用）
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    // 如果已存在，先刪除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果達到上限，刪除最舊的（第一個）
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Rate Limit 配置介面
interface RateLimitConfig {
  maxRequests?: number;
  windowMs?: number;
  maxCacheSize?: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Rate Limit 項目介面
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 速率限制器類別
export class RateLimiter {
  private store: LRUCache<string, RateLimitEntry>;
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      maxRequests: config.maxRequests ?? 100,
      windowMs: config.windowMs ?? 15 * 60 * 1000, // 15 分鐘
      maxCacheSize: config.maxCacheSize ?? 10000,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
    };

    this.store = new LRUCache<string, RateLimitEntry>(this.config.maxCacheSize);

    // 設定定期清理過期項目
    this.startCleanup();
  }

  // 預設的 key 產生器
  private defaultKeyGenerator(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'
    );
  }

  // 開始定期清理
  private startCleanup(): void {
    // 每分鐘清理一次過期項目
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  // 清理過期項目
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // 找出過期的 keys
    for (const [key, entry] of this.store['cache'].entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    // 刪除過期項目
    keysToDelete.forEach(key => {
      this.store['cache'].delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  // 檢查是否應該限制請求
  public shouldLimit(request: NextRequest): boolean {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // 新的或過期的項目
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return false;
    }

    // 增加計數
    entry.count++;
    
    // 檢查是否超過限制
    return entry.count > this.config.maxRequests;
  }

  // 記錄請求結果
  public recordResult(request: NextRequest, success: boolean): void {
    if (
      (success && this.config.skipSuccessfulRequests) ||
      (!success && this.config.skipFailedRequests)
    ) {
      // 根據配置跳過記錄
      const key = this.config.keyGenerator(request);
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  // 重置特定 key 的限制
  public reset(key: string): void {
    this.store['cache'].delete(key);
  }

  // 重置所有限制
  public resetAll(): void {
    this.store.clear();
  }

  // 取得統計資訊
  public getStats(): {
    cacheSize: number;
    maxCacheSize: number;
    config: RateLimitConfig;
  } {
    return {
      cacheSize: this.store.size,
      maxCacheSize: this.config.maxCacheSize,
      config: this.config,
    };
  }

  // 停止清理（用於關閉時）
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// 單例 Rate Limiters 管理
const rateLimiters = new Map<string, RateLimiter>();

// 取得或建立 Rate Limiter
export function getRateLimiter(name: string = 'default', config?: RateLimitConfig): RateLimiter {
  if (!rateLimiters.has(name)) {
    rateLimiters.set(name, new RateLimiter(config));
  }
  return rateLimiters.get(name)!;
}

// 改進的 Rate Limit 中間件
export function withRateLimit(config?: RateLimitConfig & { name?: string }) {
  const limiterName = config?.name ?? 'default';
  const limiter = getRateLimiter(limiterName, config);

  return function <T>(
    handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
      // 檢查是否應該限制
      if (limiter.shouldLimit(request)) {
        return createErrorResponse(
          'Too many requests, please try again later',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      try {
        const response = await handler(request);
        
        // 記錄成功的請求
        limiter.recordResult(request, response.status < 400);
        
        return response;
      } catch (error) {
        // 記錄失敗的請求
        limiter.recordResult(request, false);
        throw error;
      }
    };
  };
}

// 清理所有 Rate Limiters（用於應用程式關閉時）
export function cleanupRateLimiters(): void {
  rateLimiters.forEach(limiter => limiter.destroy());
  rateLimiters.clear();
}

// 匯出統計資訊（用於監控）
export function getRateLimiterStats(): Record<string, any> {
  const stats: Record<string, any> = {};
  rateLimiters.forEach((limiter, name) => {
    stats[name] = limiter.getStats();
  });
  return stats;
}