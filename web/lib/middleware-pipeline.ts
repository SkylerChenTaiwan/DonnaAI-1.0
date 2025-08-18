/**
 * 改進的中間件 Pipeline 系統
 * 提供更優雅的中間件組合和錯誤處理
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ApiErrorCode } from '@/types/api.types';
import { User } from '@/types/user.types';

// 中間件上下文介面
export interface MiddlewareContext {
  request: NextRequest;
  user?: User;
  params?: Record<string, any>;
  metadata?: Record<string, any>;
}

// 中間件函數型別
export type MiddlewareFunction<T = any> = (
  context: MiddlewareContext,
  next: () => Promise<NextResponse<ApiResponse<T>>>
) => Promise<NextResponse<ApiResponse<T>>>;

// 路由處理函數型別
export type RouteHandler<T = any> = (
  context: MiddlewareContext
) => Promise<NextResponse<ApiResponse<T>>>;

// 中間件 Pipeline 類別
export class MiddlewarePipeline<T = any> {
  private middlewares: MiddlewareFunction<T>[] = [];

  // 添加中間件
  use(middleware: MiddlewareFunction<T>): this {
    this.middlewares.push(middleware);
    return this;
  }

  // 條件式添加中間件
  useIf(condition: boolean, middleware: MiddlewareFunction<T>): this {
    if (condition) {
      this.middlewares.push(middleware);
    }
    return this;
  }

  // 添加多個中間件
  useMany(...middlewares: MiddlewareFunction<T>[]): this {
    this.middlewares.push(...middlewares);
    return this;
  }

  // 執行 Pipeline
  async execute(
    handler: RouteHandler<T>,
    initialContext: Partial<MiddlewareContext>
  ): Promise<NextResponse<ApiResponse<T>>> {
    // 建立完整的上下文
    const context: MiddlewareContext = {
      request: initialContext.request!,
      user: initialContext.user,
      params: initialContext.params || {},
      metadata: initialContext.metadata || {},
    };

    // 建立中間件鏈
    const chain = this.createChain(handler, context);

    // 執行第一個中間件
    return chain();
  }

  // 建立中間件鏈
  private createChain(
    handler: RouteHandler<T>,
    context: MiddlewareContext
  ): () => Promise<NextResponse<ApiResponse<T>>> {
    // 反轉中間件順序來建立正確的執行順序
    const reversedMiddlewares = [...this.middlewares].reverse();

    // 從路由處理器開始建立鏈
    let chain = () => handler(context);

    // 包裝每個中間件
    for (const middleware of reversedMiddlewares) {
      const next = chain;
      chain = () => middleware(context, next);
    }

    return chain;
  }

  // 建立新的 Pipeline（複製）
  clone(): MiddlewarePipeline<T> {
    const newPipeline = new MiddlewarePipeline<T>();
    newPipeline.middlewares = [...this.middlewares];
    return newPipeline;
  }

  // 合併另一個 Pipeline
  merge(other: MiddlewarePipeline<T>): this {
    this.middlewares.push(...other.middlewares);
    return this;
  }

  // 取得中間件數量
  get length(): number {
    return this.middlewares.length;
  }

  // 清空中間件
  clear(): this {
    this.middlewares = [];
    return this;
  }
}

// 建立 Pipeline 的便利函數
export function createPipeline<T = any>(): MiddlewarePipeline<T> {
  return new MiddlewarePipeline<T>();
}

// 預定義的中間件工廠函數

/**
 * 錯誤處理中間件
 */
export function errorHandler<T>(): MiddlewareFunction<T> {
  return async (context, next) => {
    try {
      return await next();
    } catch (error) {
      console.error('[ErrorHandler] Unhandled error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const errorCode = error instanceof Error && 'code' in error 
        ? (error as any).code 
        : ApiErrorCode.INTERNAL_ERROR;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: errorCode,
          timestamp: new Date().toISOString(),
          path: context.request.url,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 請求記錄中間件
 */
export function logger<T>(options?: {
  logBody?: boolean;
  logHeaders?: boolean;
}): MiddlewareFunction<T> {
  return async (context, next) => {
    const start = Date.now();
    const method = context.request.method;
    const url = context.request.url;

    console.log(`[${new Date().toISOString()}] ${method} ${url} - Start`);

    if (options?.logHeaders) {
      console.log('Headers:', Object.fromEntries(context.request.headers.entries()));
    }

    if (options?.logBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await context.request.clone().text();
        console.log('Body:', body);
      } catch {
        // Ignore body parsing errors
      }
    }

    const response = await next();
    const duration = Date.now() - start;
    const status = response.status;

    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${status} (${duration}ms)`
    );

    return response;
  };
}

/**
 * CORS 中間件
 */
export function cors<T>(options?: {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}): MiddlewareFunction<T> {
  const defaults = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
  };

  const config = { ...defaults, ...options };

  return async (context, next) => {
    // 處理 preflight 請求
    if (context.request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders(context.request, config),
      });
    }

    const response = await next();

    // 添加 CORS headers
    const corsHeaders = getCorsHeaders(context.request, config);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// CORS headers 生成輔助函數
function getCorsHeaders(
  request: NextRequest,
  config: any
): Record<string, string> {
  const headers: Record<string, string> = {};
  const origin = request.headers.get('origin') || '';

  // 處理 origin
  if (typeof config.origin === 'function') {
    if (config.origin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } else if (Array.isArray(config.origin)) {
    if (config.origin.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } else {
    headers['Access-Control-Allow-Origin'] = config.origin;
  }

  // 其他 headers
  headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  
  if (config.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  }
  
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = String(config.maxAge);
  }

  return headers;
}

/**
 * 請求驗證中間件
 */
export function validateRequest<T>(
  schema: {
    body?: (data: any) => boolean | Promise<boolean>;
    query?: (params: URLSearchParams) => boolean | Promise<boolean>;
    headers?: (headers: Headers) => boolean | Promise<boolean>;
  }
): MiddlewareFunction<T> {
  return async (context, next) => {
    const { request } = context;

    // 驗證 headers
    if (schema.headers) {
      const isValid = await schema.headers(request.headers);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request headers',
            code: ApiErrorCode.VALIDATION_ERROR,
          },
          { status: 400 }
        );
      }
    }

    // 驗證 query parameters
    if (schema.query) {
      const url = new URL(request.url);
      const isValid = await schema.query(url.searchParams);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid query parameters',
            code: ApiErrorCode.VALIDATION_ERROR,
          },
          { status: 400 }
        );
      }
    }

    // 驗證 body
    if (schema.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.clone().json();
        const isValid = await schema.body(body);
        if (!isValid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid request body',
              code: ApiErrorCode.VALIDATION_ERROR,
            },
            { status: 400 }
          );
        }
        
        // 將解析的 body 存入 context
        context.params = { ...context.params, body };
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in request body',
            code: ApiErrorCode.INVALID_FORMAT,
          },
          { status: 400 }
        );
      }
    }

    return next();
  };
}

/**
 * 快取中間件
 */
export function cache<T>(options?: {
  ttl?: number; // Time to live in seconds
  key?: (context: MiddlewareContext) => string;
  condition?: (context: MiddlewareContext) => boolean;
}): MiddlewareFunction<T> {
  const cacheStore = new Map<string, { data: any; expires: number }>();
  
  const defaults = {
    ttl: 60, // 1 minute
    key: (ctx: MiddlewareContext) => `${ctx.request.method}:${ctx.request.url}`,
    condition: (ctx: MiddlewareContext) => ctx.request.method === 'GET',
  };

  const config = { ...defaults, ...options };

  return async (context, next) => {
    // 檢查是否應該使用快取
    if (!config.condition(context)) {
      return next();
    }

    const cacheKey = config.key(context);
    const now = Date.now();

    // 檢查快取
    const cached = cacheStore.get(cacheKey);
    if (cached && cached.expires > now) {
      console.log(`[Cache] Hit: ${cacheKey}`);
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Expires': new Date(cached.expires).toISOString(),
        },
      });
    }

    // 執行請求
    const response = await next();

    // 只快取成功的回應
    if (response.status === 200) {
      try {
        const data = await response.clone().json();
        cacheStore.set(cacheKey, {
          data,
          expires: now + config.ttl * 1000,
        });
        console.log(`[Cache] Stored: ${cacheKey}`);
      } catch {
        // Ignore caching errors
      }
    }

    return response;
  };
}

/**
 * 重試中間件
 */
export function retry<T>(options?: {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: any, attempt: number) => boolean;
}): MiddlewareFunction<T> {
  const defaults = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential' as const,
    shouldRetry: () => true,
  };

  const config = { ...defaults, ...options };

  return async (context, next) => {
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;

        if (attempt === config.maxAttempts || !config.shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = config.backoff === 'exponential'
          ? config.delay * Math.pow(2, attempt - 1)
          : config.delay * attempt;

        console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}

/**
 * 超時中間件
 */
export function timeout<T>(ms: number): MiddlewareFunction<T> {
  return async (context, next) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${ms}ms`));
      }, ms);
    });

    try {
      return await Promise.race([next(), timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: ApiErrorCode.TIMEOUT,
          },
          { status: 408 }
        );
      }
      throw error;
    }
  };
}