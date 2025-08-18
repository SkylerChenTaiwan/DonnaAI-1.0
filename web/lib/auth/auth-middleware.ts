/**
 * 認證中介軟體
 * 處理 API 路由的認證和權限檢查
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-config';
import { checkApiAccess, createDataFilter } from './data-filter';
import { Permission, PermissionChecker } from './permissions';

// 中介軟體配置
export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  requiredPermissions?: Permission[];
  requiredRole?: string[];
  resource?: string;
  action?: 'read' | 'write' | 'delete' | 'admin';
  allowGuests?: boolean;
  skipEmailVerification?: boolean;
}

// 認證結果
export interface AuthResult {
  success: boolean;
  session?: any;
  dataFilter?: any;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * 主要認證中介軟體
 */
export async function withAuth(
  request: NextRequest,
  config: AuthMiddlewareConfig = {}
): Promise<AuthResult> {
  const {
    requireAuth = true,
    requiredPermissions = [],
    requiredRole = [],
    resource = 'unknown',
    action = 'read',
    allowGuests = false,
    skipEmailVerification = false,
  } = config;

  try {
    // 1. 獲取會話
    const session = await getServerSession(authOptions);

    // 2. 檢查是否需要認證
    if (requireAuth && !session?.user) {
      if (allowGuests) {
        // 允許訪客存取，但功能受限
        return {
          success: true,
          session: null,
          dataFilter: null,
        };
      }

      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登入才能存取此資源',
          status: 401,
        },
      };
    }

    // 3. 檢查帳戶狀態
    if (session?.user) {
      // 檢查帳戶是否被停用
      if (session.user.disabled) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: '您的帳戶已被停用，請聯繫管理員',
            status: 403,
          },
        };
      }

      // 檢查 Email 驗證（可選）
      if (!skipEmailVerification && !session.user.emailVerified) {
        return {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: '請先驗證您的電子郵件地址',
            status: 403,
          },
        };
      }
    }

    // 4. 檢查角色權限
    if (requiredRole.length > 0 && session?.user) {
      if (!requiredRole.includes(session.user.role)) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: `需要以下角色之一：${requiredRole.join(', ')}`,
            status: 403,
          },
        };
      }
    }

    // 5. 檢查特定權限
    if (requiredPermissions.length > 0 && session?.user) {
      const hasPermission = PermissionChecker.hasAnyPermission(
        session.user.permissions,
        requiredPermissions
      );

      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '權限不足，無法執行此操作',
            status: 403,
          },
        };
      }
    }

    // 6. 檢查資源存取權限
    if (session?.user) {
      const accessCheck = checkApiAccess(session, resource, action);

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: accessCheck.reason || '存取被拒絕',
            status: 403,
          },
        };
      }

      return {
        success: true,
        session,
        dataFilter: accessCheck.filter,
      };
    }

    // 7. 訪客模式
    return {
      success: true,
      session: null,
      dataFilter: null,
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '認證過程發生錯誤',
        status: 500,
      },
    };
  }
}

/**
 * API 路由認證裝飾器
 */
export function requireAuth(config: AuthMiddlewareConfig = {}) {
  return function (handler: Function) {
    return async function (request: NextRequest, context?: any) {
      const authResult = await withAuth(request, config);

      if (!authResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: authResult.error,
          },
          { status: authResult.error!.status }
        );
      }

      // 將認證資訊添加到請求上下文
      const enhancedContext = {
        ...context,
        session: authResult.session,
        dataFilter: authResult.dataFilter,
        user: authResult.session?.user,
      };

      return handler(request, enhancedContext);
    };
  };
}

/**
 * 權限檢查裝飾器
 */
export function requirePermissions(permissions: Permission[]) {
  return function (handler: Function) {
    return requireAuth({
      requireAuth: true,
      requiredPermissions: permissions,
    })(handler);
  };
}

/**
 * 角色檢查裝飾器
 */
export function requireRoles(roles: string[]) {
  return function (handler: Function) {
    return requireAuth({
      requireAuth: true,
      requiredRole: roles,
    })(handler);
  };
}

/**
 * 組織存取檢查裝飾器
 */
export function requireOrganizationAccess() {
  return function (handler: Function) {
    return requireAuth({
      requireAuth: true,
      resource: 'organization',
      action: 'read',
    })(handler);
  };
}

/**
 * 管理員權限檢查裝飾器
 */
export function requireAdmin() {
  return function (handler: Function) {
    return requireAuth({
      requireAuth: true,
      requiredRole: ['super_admin', 'org_admin'],
      action: 'admin',
    })(handler);
  };
}

/**
 * 輕量級認證檢查（僅檢查登入狀態）
 */
export async function checkAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: any;
  session?: any;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    return {
      isAuthenticated: !!session?.user && !session.user.disabled,
      user: session?.user,
      session,
    };
  } catch (error) {
    console.error('Check auth error:', error);
    return {
      isAuthenticated: false,
    };
  }
}

/**
 * 獲取當前使用者的資料過濾器
 */
export async function getCurrentUserFilter(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return createDataFilter(session);
  } catch (error) {
    console.error('Get user filter error:', error);
    return null;
  }
}

/**
 * 檢查組織存取權限
 */
export async function checkOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return false;
    }

    // 超級管理員可以存取所有組織
    if (session.user.role === 'super_admin') {
      return true;
    }

    // 檢查使用者是否屬於該組織
    return session.user.organizationId === organizationId;
  } catch (error) {
    console.error('Check organization access error:', error);
    return false;
  }
}

/**
 * 中介軟體錯誤處理器
 */
export function handleAuthError(error: any): NextResponse {
  console.error('Auth middleware error:', error);

  const errorResponse = {
    success: false,
    error: {
      code: 'AUTH_MIDDLEWARE_ERROR',
      message: '認證中介軟體發生錯誤',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
  };

  return NextResponse.json(errorResponse, { status: 500 });
}

/**
 * 建立帶權限的 API 響應
 */
export function createAuthenticatedResponse(
  data: any,
  authResult: AuthResult,
  metadata: any = {}
): NextResponse {
  const response = {
    success: true,
    data,
    auth: {
      user: authResult.session?.user ? {
        uid: authResult.session.user.uid,
        role: authResult.session.user.role,
        permissions: authResult.session.user.permissions,
        dataScope: authResult.dataFilter?.getMetricsAccessLevel(),
      } : null,
    },
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}