/**
 * 受保護路由組件
 * 確保只有已認證的用戶能夠訪問
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

// 權限檢查函數類型
export type PermissionCheck = (user: any) => boolean | Promise<boolean>;

// 組件屬性
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requiredPermission?: PermissionCheck;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/auth',
  requiredPermission,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [permissionChecked, setPermissionChecked] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);

  // 檢查權限
  React.useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        setPermissionChecked(true);
        return;
      }

      let permitted = true;

      // 檢查角色權限
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user.customClaims?.role || 'user';
        permitted = allowedRoles.includes(userRole);
      }

      // 檢查自訂權限
      if (permitted && requiredPermission) {
        try {
          permitted = await Promise.resolve(requiredPermission(user));
        } catch (error) {
          console.error('Permission check failed:', error);
          permitted = false;
        }
      }

      setHasPermission(permitted);
      setPermissionChecked(true);
    };

    if (!loading) {
      checkPermission();
    }
  }, [user, loading, requiredPermission, allowedRoles]);

  // 處理未認證的用戶
  React.useEffect(() => {
    if (permissionChecked && !user) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [user, permissionChecked, router, redirectTo]);

  // 處理權限不足的用戶
  React.useEffect(() => {
    if (permissionChecked && user && !hasPermission) {
      router.push('/unauthorized');
    }
  }, [user, hasPermission, permissionChecked, router]);

  // 載入中狀態
  if (loading || !permissionChecked) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingIndicator size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">驗證權限中...</p>
        </div>
      </div>
    );
  }

  // 未認證或權限不足時不渲染內容
  if (!user || !hasPermission) {
    return null;
  }

  // 渲染受保護的內容
  return <>{children}</>;
}

// 高階組件版本
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  return ProtectedComponent;
}