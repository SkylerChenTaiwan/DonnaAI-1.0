/**
 * 權限控制元件
 * 根據用戶權限決定是否顯示子元件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '@/hooks/usePermissions';
import { Role } from '@/constants/permissions';

// 權限檢查類型
type PermissionCheck = 
  | string // 單一權限字串
  | string[] // 多個權限（OR 邏輯）
  | { all: string[] } // 需要所有權限（AND 邏輯）
  | { any: string[] } // 需要任一權限（OR 邏輯）
  | { role: Role } // 需要特定角色
  | { minRole: Role } // 需要最低角色層級
  | { custom: (permissions: string[], role: Role | null) => boolean }; // 自定義檢查

export interface PermissionGateProps {
  // 權限要求
  require?: PermissionCheck;
  
  // 角色要求（簡化寫法）
  requireSuperAdmin?: boolean;
  requireOrgAdmin?: boolean;
  requireTeamManager?: boolean;
  requireAuthenticated?: boolean;
  
  // 子元件
  children: React.ReactNode;
  
  // 無權限時的顯示
  fallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
  
  // 行為選項
  hideOnUnauthorized?: boolean; // 無權限時完全隱藏（預設）
  disableOnUnauthorized?: boolean; // 無權限時禁用而非隱藏
}

/**
 * 無權限提示元件
 */
const UnauthorizedMessage: React.FC<{ message?: string }> = ({ message }) => (
  <View style={styles.unauthorizedContainer}>
    <Text style={styles.unauthorizedText}>
      {message || '您沒有權限查看此內容'}
    </Text>
  </View>
);

/**
 * 權限控制元件
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  require,
  requireSuperAdmin,
  requireOrgAdmin,
  requireTeamManager,
  requireAuthenticated,
  children,
  fallback,
  showError = false,
  errorMessage,
  hideOnUnauthorized = true,
  disableOnUnauthorized = false
}) => {
  const {
    permissions,
    role,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isSuperAdmin,
    isOrgAdmin,
    isTeamManager,
    isTeamMember,
    loading
  } = usePermissions();

  // 載入中顯示
  if (loading) {
    return null; // 或者顯示載入指示器
  }

  // 檢查權限
  let isAuthorized = true;

  // 簡化的角色檢查
  if (requireSuperAdmin && !isSuperAdmin) {
    isAuthorized = false;
  }
  if (requireOrgAdmin && !isOrgAdmin) {
    isAuthorized = false;
  }
  if (requireTeamManager && !isTeamManager) {
    isAuthorized = false;
  }
  if (requireAuthenticated && !isTeamMember) {
    isAuthorized = false;
  }

  // 複雜的權限檢查
  if (require && isAuthorized) {
    if (typeof require === 'string') {
      // 單一權限
      isAuthorized = hasPermission(require);
    } else if (Array.isArray(require)) {
      // 多個權限（OR 邏輯）
      isAuthorized = hasAnyPermission(...require);
    } else if ('all' in require) {
      // 需要所有權限
      isAuthorized = hasAllPermissions(...require.all);
    } else if ('any' in require) {
      // 需要任一權限
      isAuthorized = hasAnyPermission(...require.any);
    } else if ('role' in require) {
      // 需要特定角色
      isAuthorized = role === require.role;
    } else if ('minRole' in require) {
      // 需要最低角色層級
      isAuthorized = isRoleHigherOrEqual(role, require.minRole);
    } else if ('custom' in require) {
      // 自定義檢查
      isAuthorized = require.custom(permissions, role);
    }
  }

  // 根據授權狀態決定顯示內容
  if (!isAuthorized) {
    if (hideOnUnauthorized && !fallback) {
      return null;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return <UnauthorizedMessage message={errorMessage} />;
    }
    
    if (disableOnUnauthorized) {
      // 禁用子元件（需要子元件支援 disabled prop）
      return (
        <View style={styles.disabledContainer}>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as any, { disabled: true });
            }
            return child;
          })}
        </View>
      );
    }
    
    return null;
  }

  // 有權限，顯示子元件
  return <>{children}</>;
};

/**
 * 角色層級比較輔助函數
 */
function isRoleHigherOrEqual(userRole: Role | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  
  const roleHierarchy: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 4,
    [Role.ORG_ADMIN]: 3,
    [Role.TEAM_MANAGER]: 2,
    [Role.TEAM_MEMBER]: 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * 便利元件：只對 Super Admin 顯示
 */
export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = 
  ({ children, fallback }) => (
    <PermissionGate requireSuperAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  );

/**
 * 便利元件：只對組織管理員及以上顯示
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = 
  ({ children, fallback }) => (
    <PermissionGate requireOrgAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  );

/**
 * 便利元件：只對團隊主管及以上顯示
 */
export const ManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = 
  ({ children, fallback }) => (
    <PermissionGate requireTeamManager fallback={fallback}>
      {children}
    </PermissionGate>
  );

/**
 * 便利元件：只對已登入用戶顯示
 */
export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = 
  ({ children, fallback }) => (
    <PermissionGate requireAuthenticated fallback={fallback}>
      {children}
    </PermissionGate>
  );

const styles = StyleSheet.create({
  unauthorizedContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  disabledContainer: {
    opacity: 0.5
  }
});

export default PermissionGate;