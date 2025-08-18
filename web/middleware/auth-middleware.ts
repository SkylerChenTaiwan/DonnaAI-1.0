/**
 * 認證中間件
 * 用於 Next.js API Routes 的認證檢查
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/firebase/auth.service';

// 認證結果介面
export interface AuthMiddlewareResult {
  success: boolean;
  user?: any;
  error?: string;
  response?: NextResponse;
}

// 認證中間件選項
export interface AuthMiddlewareOptions {
  requiredRole?: string | string[];
  skipAuth?: boolean;
  customPermissionCheck?: (user: any) => boolean | Promise<boolean>;
}

// 從請求中提取 Token
export function extractTokenFromRequest(request: NextRequest): string | null {
  // 優先從 Authorization header 獲取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 從 Cookie 獲取
  const tokenCookie = request.cookies.get('authToken');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

// 檢查用戶角色
export function checkUserRole(user: any, requiredRole: string | string[]): boolean {
  if (!user || !requiredRole) return true;

  const userRole = user.role || user.customClaims?.role || 'user';
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}

// 主要認證中間件函數
export async function authenticateRequest(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const { requiredRole, skipAuth = false, customPermissionCheck } = options;

  // 跳過認證檢查
  if (skipAuth) {
    return { success: true };
  }

  // 提取 Token
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return {
      success: false,
      error: 'Missing authentication token',
      response: NextResponse.json(
        { error: 'Unauthorized', message: '需要認證' },
        { status: 401 }
      ),
    };
  }

  try {
    // 驗證 Token
    const authResult = await AuthService.verifyIdToken(token);
    
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.error || 'Token verification failed',
        response: NextResponse.json(
          { error: 'Unauthorized', message: '認證失敗' },
          { status: 401 }
        ),
      };
    }

    const user = authResult.data;

    // 檢查角色權限
    if (requiredRole && !checkUserRole(user, requiredRole)) {
      return {
        success: false,
        error: 'Insufficient role permissions',
        response: NextResponse.json(
          { error: 'Forbidden', message: '權限不足' },
          { status: 403 }
        ),
      };
    }

    // 自訂權限檢查
    if (customPermissionCheck) {
      try {
        const hasPermission = await Promise.resolve(customPermissionCheck(user));
        if (!hasPermission) {
          return {
            success: false,
            error: 'Custom permission check failed',
            response: NextResponse.json(
              { error: 'Forbidden', message: '權限不足' },
              { status: 403 }
            ),
          };
        }
      } catch (error) {
        console.error('Custom permission check error:', error);
        return {
          success: false,
          error: 'Permission check failed',
          response: NextResponse.json(
            { error: 'Internal Server Error', message: '權限檢查失敗' },
            { status: 500 }
          ),
        };
      }
    }

    return {
      success: true,
      user,
    };

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: NextResponse.json(
        { error: 'Internal Server Error', message: '認證系統錯誤' },
        { status: 500 }
      ),
    };
  }
}

// 為 API Route 建立認證裝飾器
export function withAuth(
  handler: (request: NextRequest, context: { params?: any; user: any }) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, context: { params?: any }) => {
    // 執行認證檢查
    const authResult = await authenticateRequest(request, options);
    
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // 將認證的用戶資訊加入到 context
    const enhancedContext = {
      ...context,
      user: authResult.user,
    };

    // 執行原始的處理函數
    return handler(request, enhancedContext);
  };
}

// 組織權限檢查
export async function checkOrganizationAccess(
  user: any,
  organizationId: string
): Promise<boolean> {
  if (!user || !organizationId) return false;

  // Super Admin 可以存取所有組織
  if (user.role === 'superAdmin' || user.customClaims?.role === 'superAdmin') {
    return true;
  }

  // 檢查用戶是否屬於該組織
  const userOrgId = user.organizationId || user.customClaims?.organizationId;
  return userOrgId === organizationId;
}

// 管理員權限檢查
export function isAdmin(user: any): boolean {
  if (!user) return false;
  
  const role = user.role || user.customClaims?.role;
  return ['superAdmin', 'orgAdmin', 'manager'].includes(role);
}

// Super Admin 權限檢查
export function isSuperAdmin(user: any): boolean {
  if (!user) return false;
  
  const role = user.role || user.customClaims?.role;
  return role === 'superAdmin';
}