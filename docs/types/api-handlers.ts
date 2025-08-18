/**
 * Next.js API Routes 處理器型別定義
 * 用於 App Router 和 Pages Router 的 API 端點
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { User, Organization } from './web-platform-base-types';

/**
 * API 路由處理器基礎型別
 */
export type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

/**
 * 路由上下文
 */
export interface RouteContext {
  params?: Record<string, string | string[]>;
}

/**
 * 認證後的請求
 */
export interface AuthenticatedRequest extends NextRequest {
  user: User;
  organization: Organization;
  token: string;
}

/* ============================================
   RESTful API 處理器
   ============================================ */

/**
 * GET 處理器
 */
export type GetHandler<T = any> = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponseData<T>>>;

/**
 * POST 處理器
 */
export type PostHandler<TBody = any, TResponse = any> = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponseData<TResponse>>>;

/**
 * PUT 處理器
 */
export type PutHandler<TBody = any, TResponse = any> = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponseData<TResponse>>>;

/**
 * PATCH 處理器
 */
export type PatchHandler<TBody = any, TResponse = any> = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponseData<TResponse>>>;

/**
 * DELETE 處理器
 */
export type DeleteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponseData<{ success: boolean }>>>;

/* ============================================
   API 回應型別
   ============================================ */

/**
 * API 回應資料結構
 */
export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

/**
 * 分頁 API 回應
 */
export interface PaginatedApiResponse<T> extends ApiResponseData<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 批次操作回應
 */
export interface BatchApiResponse<T = any> {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/* ============================================
   API 路由中間件
   ============================================ */

/**
 * 中間件函數型別
 */
export type MiddlewareFunction = (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * 認證中間件選項
 */
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requireRoles?: string[];
  requirePermissions?: string[];
  allowAnonymous?: boolean;
}

/**
 * 速率限制選項
 */
export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * CORS 選項
 */
export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * 驗證選項
 */
export interface ValidationOptions {
  body?: Record<string, any>;
  query?: Record<string, any>;
  params?: Record<string, any>;
  headers?: Record<string, any>;
}

/* ============================================
   API 路由建構器
   ============================================ */

/**
 * API 路由建構器類別
 */
export class ApiRouteBuilder {
  private middlewares: MiddlewareFunction[] = [];
  private handlers: Map<string, RouteHandler> = new Map();

  /**
   * 添加中間件
   */
  use(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 設定 GET 處理器
   */
  get<T>(handler: GetHandler<T>): this {
    this.handlers.set('GET', handler as RouteHandler);
    return this;
  }

  /**
   * 設定 POST 處理器
   */
  post<TBody, TResponse>(handler: PostHandler<TBody, TResponse>): this {
    this.handlers.set('POST', handler as RouteHandler);
    return this;
  }

  /**
   * 設定 PUT 處理器
   */
  put<TBody, TResponse>(handler: PutHandler<TBody, TResponse>): this {
    this.handlers.set('PUT', handler as RouteHandler);
    return this;
  }

  /**
   * 設定 PATCH 處理器
   */
  patch<TBody, TResponse>(handler: PatchHandler<TBody, TResponse>): this {
    this.handlers.set('PATCH', handler as RouteHandler);
    return this;
  }

  /**
   * 設定 DELETE 處理器
   */
  delete(handler: DeleteHandler): this {
    this.handlers.set('DELETE', handler as RouteHandler);
    return this;
  }

  /**
   * 建構最終處理器
   */
  build(): RouteHandler {
    return async (req: NextRequest, context: RouteContext) => {
      const method = req.method;
      const handler = this.handlers.get(method);

      if (!handler) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `Method ${method} not allowed`,
            },
          },
          { status: 405 }
        );
      }

      // 執行中間件鏈
      let index = 0;
      const next = async (): Promise<NextResponse> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++];
          return middleware(req, next);
        }
        return handler(req, context);
      };

      return next();
    };
  }
}

/* ============================================
   輔助函數
   ============================================ */

/**
 * 建立成功回應
 */
export function successResponse<T>(
  data: T,
  metadata?: Partial<ApiResponseData['metadata']>
): NextResponse<ApiResponseData<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...metadata,
    },
  });
}

/**
 * 建立錯誤回應
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, any>
): NextResponse<ApiResponseData> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    },
    { status: statusCode }
  );
}

/**
 * 建立分頁回應
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedApiResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      requestId: crypto.randomUUID(),
    },
  });
}

/**
 * 解析請求 body
 */
export async function parseRequestBody<T>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * 取得查詢參數
 */
export function getQueryParams(req: NextRequest): URLSearchParams {
  const { searchParams } = new URL(req.url);
  return searchParams;
}

/**
 * 取得請求 headers
 */
export function getHeaders(req: NextRequest): Headers {
  return req.headers;
}

/* ============================================
   中間件實作範例
   ============================================ */

/**
 * 認證中間件
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}): MiddlewareFunction {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    if (options.allowAnonymous) {
      return next();
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('UNAUTHORIZED', 'No token provided', 401);
    }

    try {
      // 驗證 token 並取得使用者資訊
      // const user = await verifyToken(token);
      
      // 檢查角色權限
      // if (options.requireRoles && !options.requireRoles.includes(user.role)) {
      //   return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
      // }

      // 將使用者資訊附加到請求
      // (req as any).user = user;
      
      return next();
    } catch (error) {
      return errorResponse('UNAUTHORIZED', 'Invalid token', 401);
    }
  };
}

/**
 * 速率限制中間件
 */
export function rateLimitMiddleware(options: RateLimitOptions = {}): MiddlewareFunction {
  const {
    windowMs = 60000,
    max = 100,
    message = 'Too many requests',
    statusCode = 429,
  } = options;

  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'anonymous';
    const now = Date.now();
    
    let requestData = requestCounts.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    requestData.count++;
    requestCounts.set(key, requestData);
    
    if (requestData.count > max) {
      return errorResponse('RATE_LIMIT_EXCEEDED', message, statusCode);
    }
    
    const response = await next();
    
    // 添加速率限制 headers
    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', (max - requestData.count).toString());
    response.headers.set('X-RateLimit-Reset', requestData.resetTime.toString());
    
    return response;
  };
}

/**
 * CORS 中間件
 */
export function corsMiddleware(options: CorsOptions = {}): MiddlewareFunction {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    const origin = req.headers.get('origin') || '';
    const response = await next();

    // 設定 CORS headers
    if (options.origin) {
      if (typeof options.origin === 'string') {
        response.headers.set('Access-Control-Allow-Origin', options.origin);
      } else if (Array.isArray(options.origin)) {
        if (options.origin.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
      } else if (typeof options.origin === 'function') {
        if (options.origin(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
      }
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    if (options.methods) {
      response.headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
    }

    if (options.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
    }

    if (options.exposedHeaders) {
      response.headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
    }

    if (options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (options.maxAge) {
      response.headers.set('Access-Control-Max-Age', options.maxAge.toString());
    }

    return response;
  };
}

/**
 * 日誌中間件
 */
export function loggingMiddleware(): MiddlewareFunction {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    console.log(`[${requestId}] ${req.method} ${req.url} - Started`);
    
    const response = await next();
    
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.url} - Completed in ${duration}ms`);
    
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Response-Time', `${duration}ms`);
    
    return response;
  };
}

/**
 * 錯誤處理中間件
 */
export function errorHandlingMiddleware(): MiddlewareFunction {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    try {
      return await next();
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return errorResponse(
          'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          500,
          process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
        );
      }
      
      return errorResponse('INTERNAL_ERROR', 'Internal server error', 500);
    }
  };
}