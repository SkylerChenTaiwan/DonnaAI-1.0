/**
 * API 中間件函數
 * 提供認證、權限檢查、錯誤處理等功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, PermissionService } from './firebase-admin';

// API 錯誤響應類型
interface ApiError {
  success: false;
  error: string;
  code: string | undefined;
}

// API 成功響應類型
interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message: string | undefined;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// 用戶上下文類型
export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  role: string | undefined;
  organizationId: string | undefined;
  teamIds: string[] | undefined;
}

// 創建錯誤響應
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code },
    { status }
  );
}

// 創建成功響應
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

// 從請求中提取 Authorization token
export function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  // 支援 "Bearer token" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

// 認證中間件
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; error: string }> {
  try {
    const token = extractAuthToken(request);
    if (!token) {
      return { success: false, error: 'Missing authentication token' };
    }

    const tokenResult = await verifyIdToken(token);
    if (!tokenResult.success || !tokenResult.user) {
      return { success: false, error: tokenResult.error || 'Invalid token' };
    }

    const user: AuthenticatedUser = {
      uid: tokenResult.user.uid,
      email: tokenResult.user.email,
      // 這些字段需要從 Firestore 中獲取
      role: tokenResult.user['role'] as string | undefined,
      organizationId: tokenResult.user['organization_id'] as string | undefined,
      teamIds: tokenResult.user['team_ids'] as string[] | undefined,
    };

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

// API 路由包裝器 - 自動處理錯誤和認證
export function withAuth<T = unknown>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return createErrorResponse(authResult.error, 401, 'UNAUTHORIZED');
      }

      return await handler(request, authResult.user);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  };
}

// Super Admin 專用路由包裝器
export function withSuperAdmin<T = unknown>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.uid);
    if (!isSuperAdmin) {
      return createErrorResponse(
        'Super Admin access required',
        403,
        'FORBIDDEN'
      );
    }

    return await handler(request, user);
  });
}

// 組織管理員專用路由包裝器
export function withOrganizationAdmin<T = unknown>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<ApiResponse<T>>>,
  getOrganizationId?: (request: NextRequest) => string | Promise<string>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
    let organizationId = user.organizationId;

    // 如果提供了自定義的組織 ID 提取函數
    if (getOrganizationId) {
      organizationId = await getOrganizationId(request);
    }

    if (!organizationId) {
      return createErrorResponse(
        'Organization ID not found',
        400,
        'BAD_REQUEST'
      );
    }

    const canAccess = await PermissionService.canAccessOrganization(user.uid, organizationId);
    if (!canAccess) {
      return createErrorResponse(
        'Organization access denied',
        403,
        'FORBIDDEN'
      );
    }

    return await handler(request, user);
  });
}

// CORS 中間件
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 處理 preflight 請求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const response = await handler(request);

    // 添加 CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

// 速率限制中間件（簡單實現）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 分鐘
  keyGenerator?: (request: NextRequest) => string
) {
  return function <T>(
    handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
      const key = keyGenerator 
        ? keyGenerator(request)
        : request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

      const now = Date.now();
      const current = rateLimitStore.get(key);

      if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return await handler(request);
      }

      if (current.count >= maxRequests) {
        return createErrorResponse(
          'Too many requests',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      current.count++;
      return await handler(request);
    };
  };
}

// 請求日誌中間件
export function withLogging<T>(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    console.log(`[${new Date().toISOString()}] ${method} ${url} - Start`);

    try {
      const response = await handler(request);
      const duration = Date.now() - start;
      const status = response.status;

      console.log(
        `[${new Date().toISOString()}] ${method} ${url} - ${status} (${duration}ms)`
      );

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `[${new Date().toISOString()}] ${method} ${url} - ERROR (${duration}ms):`,
        error
      );
      throw error;
    }
  };
}

// 輸入驗證中間件
export function withValidation<T>(
  schema: {
    body?: (data: unknown) => boolean;
    query?: (params: URLSearchParams) => boolean;
  }
) {
  return function (
    handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
  ) {
    return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
      try {
        // 驗證 body
        if (schema.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const body = await request.json();
          if (!schema.body(body)) {
            return createErrorResponse(
              'Invalid request body',
              400,
              'VALIDATION_ERROR'
            );
          }
        }

        // 驗證 query parameters
        if (schema.query) {
          const url = new URL(request.url);
          if (!schema.query(url.searchParams)) {
            return createErrorResponse(
              'Invalid query parameters',
              400,
              'VALIDATION_ERROR'
            );
          }
        }

        return await handler(request);
      } catch (error) {
        return createErrorResponse(
          'Invalid request format',
          400,
          'INVALID_JSON'
        );
      }
    };
  };
}

// 組合中間件的輔助函數
export function composeMiddleware<T>(
  ...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>) => (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>>
) {
  return (handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}