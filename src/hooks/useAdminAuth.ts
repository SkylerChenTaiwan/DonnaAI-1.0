/**
 * Admin 權限檢查 Hook
 * 提供 Super Admin 和 Enterprise Admin 的權限檢查功能
 */

import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types/entities';
import { EnterpriseAdminPermissions } from '@/types/admin';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

// 預設的企業管理員權限
const DEFAULT_ENTERPRISE_ADMIN_PERMISSIONS: EnterpriseAdminPermissions = {
  canManageUsers: true,
  canManageTeams: true,
  canManageTools: true,
  canImportData: true,
  canExportData: true,
  canViewReports: true,
  canManageBilling: false,
  canCustomizeBranding: false };

export function useAdminAuth() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<EnterpriseAdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 基本角色檢查 - 支援兩種系統管理員角色名稱
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'system-admin';
  const isEnterpriseAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canAccessAdminPanel = isSuperAdmin || isEnterpriseAdmin;
  
  // 載入企業管理員權限
  useEffect(() => {
    async function loadPermissions() {
      if (!isEnterpriseAdmin || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const db = getFirebaseDb();
        const permissionsRef = doc(
          db, 
          'organizations', 
          user.organizationId, 
          'admin_permissions', 
          user.id
        );
        
        const permissionsDoc = await getDoc(permissionsRef);
        
        if (permissionsDoc.exists()) {
          setPermissions(permissionsDoc.data() as EnterpriseAdminPermissions);
        } else {
          // 使用預設權限
          setPermissions(DEFAULT_ENTERPRISE_ADMIN_PERMISSIONS);
        }
      } catch (error) {
        console.error('載入管理員權限失敗:', error);
        setPermissions(DEFAULT_ENTERPRISE_ADMIN_PERMISSIONS);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPermissions();
  }, [user, isEnterpriseAdmin]);
  
  // 檢查特定權限
  const checkPermission = (permission: string): boolean => {
    // Super Admin 擁有所有權限
    if (isSuperAdmin) return true;
    
    // Enterprise Admin 檢查特定權限
    if (isEnterpriseAdmin && permissions) {
      switch (permission) {
        case 'manage_users':
          return permissions.canManageUsers;
        case 'manage_teams':
          return permissions.canManageTeams;
        case 'manage_tools':
          return permissions.canManageTools;
        case 'import_data':
          return permissions.canImportData;
        case 'export_data':
          return permissions.canExportData;
        case 'view_reports':
          return permissions.canViewReports;
        case 'manage_billing':
          return permissions.canManageBilling;
        case 'customize_branding':
          return permissions.canCustomizeBranding;
        default:
          // 檢查自定義權限
          return permissions.customPermissions?.includes(permission) || false;
      }
    }
    
    // Manager 的有限權限
    if (isManager) {
      switch (permission) {
        case 'view_team_reports':
        case 'manage_team_members':
          return true;
        default:
          return false;
      }
    }
    
    return false;
  };
  
  // 檢查是否可以管理特定組織
  const canManageOrganization = (orgId: string): boolean => {
    if (isSuperAdmin) return true;
    if (isEnterpriseAdmin && user?.organizationId === orgId) return true;
    return false;
  };
  
  // 檢查是否可以查看特定組織
  const canViewOrganization = (orgId: string): boolean => {
    if (isSuperAdmin) return true;
    if (user?.organizationId === orgId) return true;
    return false;
  };
  
  // 檢查是否可以管理特定用戶
  const canManageUser = (targetUser: User): boolean => {
    if (isSuperAdmin) return true;
    
    if (isEnterpriseAdmin && user?.organizationId === targetUser.organizationId) {
      // 不能管理其他管理員
      if (targetUser.role === 'admin' && targetUser.id !== user.id) return false;
      return checkPermission('manage_users');
    }
    
    if (isManager && user?.managedTeamIds) {
      // Manager 只能管理自己團隊的成員
      return targetUser.teamIds?.some(teamId => 
        user.managedTeamIds?.includes(teamId)
      ) || false;
    }
    
    return false;
  };
  
  // 取得可用的功能列表
  const getAvailableFeatures = () => {
    const features: string[] = [];
    
    if (isSuperAdmin) {
      features.push(
        'organizations_management',
        'platform_statistics',
        'global_settings',
        'super_admin_tools'
      );
    }
    
    if (isEnterpriseAdmin && permissions) {
      if (permissions.canManageUsers) features.push('user_management');
      if (permissions.canManageTeams) features.push('team_management');
      if (permissions.canManageTools) features.push('tool_management');
      if (permissions.canImportData) features.push('data_import');
      if (permissions.canExportData) features.push('data_export');
      if (permissions.canViewReports) features.push('reports');
      if (permissions.canManageBilling) features.push('billing');
      if (permissions.canCustomizeBranding) features.push('branding');
    }
    
    if (isManager) {
      features.push('team_reports', 'team_members');
    }
    
    return features;
  };
  
  // 取得管理面板路由
  const getAdminRoutes = () => {
    const routes: string[] = [];
    
    if (isSuperAdmin) {
      routes.push(
        '/superadmin/organizations',
        '/superadmin/platform-stats',
        '/superadmin/settings'
      );
    }
    
    if (isEnterpriseAdmin) {
      routes.push(
        '/admin/dashboard',
        '/admin/users',
        '/admin/tools',
        '/admin/import',
        '/admin/reports'
      );
    }
    
    return routes;
  };
  
  return {
    // 基本狀態
    user,
    isLoading,
    
    // 角色檢查
    isSuperAdmin,
    isEnterpriseAdmin,
    isManager,
    canAccessAdminPanel,
    
    // 權限資訊
    permissions,
    
    // 權限檢查函數
    checkPermission,
    canManageOrganization,
    canViewOrganization,
    canManageUser,
    
    // 功能和路由
    getAvailableFeatures,
    getAdminRoutes };
}

// 輔助函數：檢查企業管理員權限
export function checkEnterpriseAdminPermission(
  user: User | null,
  permission: string
): boolean {
  if (!user || user.role !== 'admin') return false;
  
  // 這是簡化版本，實際應該從 Firestore 讀取權限
  // 在 useAdminAuth hook 中有完整實作
  return true;
}