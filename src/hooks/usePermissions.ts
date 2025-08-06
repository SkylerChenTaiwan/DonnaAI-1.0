/**
 * 權限管理 Hook
 * 提供權限檢查和管理的便捷介面
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { permissionService } from '@/services/permissions/PermissionService';
import {
  Role,
  PLATFORM_PERMISSIONS,
  ORG_PERMISSIONS,
  TEAM_PERMISSIONS,
  BASIC_PERMISSIONS,
  normalizeRole,
  isRoleHigherOrEqual
} from '@/constants/permissions';

export interface UsePermissionsResult {
  // 權限列表
  permissions: string[];
  
  // 角色資訊
  role: Role | null;
  roleLabel: string;
  
  // 權限檢查函數
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  
  // 角色檢查
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isTeamManager: boolean;
  isTeamMember: boolean;
  
  // 權限管理（需要管理員權限）
  grantPermission: (userId: string, permission: string) => Promise<void>;
  revokePermission: (userId: string, permission: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  repairPermissions: (userId?: string) => Promise<boolean>;
  
  // 權限比較
  canManageUser: (targetUserId: string) => Promise<boolean>;
  isHigherRole: (targetRole: Role) => boolean;
  
  // 載入狀態
  loading: boolean;
  error: string | null;
}

/**
 * 權限管理 Hook
 */
export function usePermissions(): UsePermissionsResult {
  const { user, userProfile } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入權限資料
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user || !userProfile) {
        setPermissions([]);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 如果 userProfile 已經有權限資料，直接使用
        if (userProfile.permissions && userProfile.normalizedRole) {
          setPermissions(userProfile.permissions);
          setRole(userProfile.normalizedRole);
        } else {
          // 否則從權限服務獲取
          const [userPermissions, userRole] = await Promise.all([
            permissionService.getUserPermissions(user.uid),
            permissionService.getUserRole(user.uid)
          ]);
          
          setPermissions(userPermissions);
          setRole(userRole);
        }
      } catch (err) {
        console.error('載入權限時發生錯誤:', err);
        setError(err instanceof Error ? err.message : '載入權限失敗');
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user, userProfile]);

  // 權限檢查函數
  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAllPermissions = useCallback((...checkPermissions: string[]): boolean => {
    return checkPermissions.every(p => permissions.includes(p));
  }, [permissions]);

  const hasAnyPermission = useCallback((...checkPermissions: string[]): boolean => {
    return checkPermissions.some(p => permissions.includes(p));
  }, [permissions]);

  // 角色檢查
  const isSuperAdmin = useMemo(() => {
    return role === Role.SUPER_ADMIN || 
           hasPermission(PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS);
  }, [role, hasPermission]);

  const isOrgAdmin = useMemo(() => {
    return role === Role.ORG_ADMIN || 
           isSuperAdmin ||
           hasPermission(ORG_PERMISSIONS.MANAGE_USERS);
  }, [role, isSuperAdmin, hasPermission]);

  const isTeamManager = useMemo(() => {
    return role === Role.TEAM_MANAGER || 
           isOrgAdmin ||
           hasPermission(TEAM_PERMISSIONS.MANAGE_TEAM_MEMBERS);
  }, [role, isOrgAdmin, hasPermission]);

  const isTeamMember = useMemo(() => {
    return role !== null; // 所有已登入用戶都至少是團隊成員
  }, [role]);

  // 角色標籤
  const roleLabel = useMemo(() => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return '超級管理員';
      case Role.ORG_ADMIN:
        return '組織管理員';
      case Role.TEAM_MANAGER:
        return '團隊主管';
      case Role.TEAM_MEMBER:
        return '團隊成員';
      default:
        return '未知角色';
    }
  }, [role]);

  // 權限管理函數（需要管理員權限）
  const grantPermission = useCallback(async (userId: string, permission: string) => {
    if (!user) {
      throw new Error('請先登入');
    }
    
    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('需要管理員權限');
    }

    await permissionService.grantPermission(userId, permission, user.uid);
  }, [user, isSuperAdmin, isOrgAdmin]);

  const revokePermission = useCallback(async (userId: string, permission: string) => {
    if (!user) {
      throw new Error('請先登入');
    }
    
    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('需要管理員權限');
    }

    await permissionService.revokePermission(userId, permission, user.uid);
  }, [user, isSuperAdmin, isOrgAdmin]);

  const updateUserRole = useCallback(async (userId: string, newRole: Role) => {
    if (!user) {
      throw new Error('請先登入');
    }
    
    // 只有 Super Admin 可以設定其他人為 Super Admin
    if (newRole === Role.SUPER_ADMIN && !isSuperAdmin) {
      throw new Error('只有超級管理員可以授予超級管理員權限');
    }
    
    // 組織管理員可以設定組織內的角色（除了 Super Admin）
    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('需要管理員權限');
    }

    await permissionService.updateUserRole(userId, newRole, user.uid);
  }, [user, isSuperAdmin, isOrgAdmin]);

  const repairPermissions = useCallback(async (userId?: string) => {
    if (!user) {
      throw new Error('請先登入');
    }
    
    const targetUserId = userId || user.uid;
    
    // 用戶可以修復自己的權限，管理員可以修復任何人的權限
    if (targetUserId !== user.uid && !isSuperAdmin && !isOrgAdmin) {
      throw new Error('需要管理員權限才能修復其他用戶的權限');
    }

    return await permissionService.repairPermissions(targetUserId);
  }, [user, isSuperAdmin, isOrgAdmin]);

  // 權限比較函數
  const canManageUser = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user || !role) return false;
    
    // Super Admin 可以管理所有人
    if (isSuperAdmin) return true;
    
    // 獲取目標用戶的角色
    const targetRole = await permissionService.getUserRole(targetUserId);
    
    // 檢查角色層級
    return isRoleHigherOrEqual(role, targetRole);
  }, [user, role, isSuperAdmin]);

  const isHigherRole = useCallback((targetRole: Role): boolean => {
    if (!role) return false;
    return isRoleHigherOrEqual(role, targetRole);
  }, [role]);

  return {
    // 權限列表
    permissions,
    
    // 角色資訊
    role,
    roleLabel,
    
    // 權限檢查函數
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    
    // 角色檢查
    isSuperAdmin,
    isOrgAdmin,
    isTeamManager,
    isTeamMember,
    
    // 權限管理
    grantPermission,
    revokePermission,
    updateUserRole,
    repairPermissions,
    
    // 權限比較
    canManageUser,
    isHigherRole,
    
    // 載入狀態
    loading,
    error
  };
}

// 導出權限常數供元件使用
export { 
  PLATFORM_PERMISSIONS,
  ORG_PERMISSIONS,
  TEAM_PERMISSIONS,
  BASIC_PERMISSIONS,
  Role
} from '@/constants/permissions';