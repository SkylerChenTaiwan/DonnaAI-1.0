/**
 * 中央權限管理服務
 * 這是所有權限檢查和管理的單一真實來源
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseDb } from '../firebase/config';
import { User } from '@/types/entities';
import {
  Role,
  SUPER_ADMIN_EMAILS,
  ROLE_PERMISSIONS,
  normalizeRole,
  isSuperAdminEmail,
  getRolePermissions,
  roleHasPermission,
  isRoleHigherOrEqual,
  PERMISSION_AUDIT_ACTIONS,
  PermissionAuditAction,
  PLATFORM_PERMISSIONS,
  ORG_PERMISSIONS,
  TEAM_PERMISSIONS,
  BASIC_PERMISSIONS
} from '@/constants/permissions';

// 權限審計記錄介面
interface PermissionAudit {
  userId: string;
  action: PermissionAuditAction;
  permission?: string;
  oldValue?: any;
  newValue?: any;
  performedBy: string;
  performedByEmail?: string;
  reason?: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

// 權限快取（避免重複查詢）
interface PermissionCache {
  [userId: string]: {
    permissions: string[];
    role: Role;
    timestamp: number;
  };
}

class PermissionService {
  private static instance: PermissionService;
  private cache: PermissionCache = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 分鐘快取

  // 單例模式
  static getInstance(): PermissionService {
    if (!this.instance) {
      this.instance = new PermissionService();
    }
    return this.instance;
  }

  private constructor() {
    // 私有建構函數，防止直接實例化
  }

  /**
   * 清除快取
   */
  clearCache(userId?: string): void {
    if (userId) {
      delete this.cache[userId];
    } else {
      this.cache = {};
    }
  }

  /**
   * 從快取獲取權限
   */
  private getCachedPermissions(userId: string): string[] | null {
    const cached = this.cache[userId];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      delete this.cache[userId];
      return null;
    }
    
    return cached.permissions;
  }

  /**
   * 設定快取
   */
  private setCachedPermissions(userId: string, permissions: string[], role: Role): void {
    this.cache[userId] = {
      permissions,
      role,
      timestamp: Date.now()
    };
  }

  /**
   * 檢查是否為 Super Admin
   */
  async isSuperAdmin(user: FirebaseUser | { uid: string; email?: string | null }): Promise<boolean> {
    // 檢查 email 是否在 Super Admin 列表中
    if (user.email && isSuperAdminEmail(user.email)) {
      return true;
    }

    // 檢查 Firestore 中的角色
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data() as User;
      const role = normalizeRole(userData.role);
      
      return role === Role.SUPER_ADMIN || userData.isSuperAdmin === true;
    } catch (error) {
      console.error('檢查 Super Admin 權限時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否有特定權限
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('檢查權限時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 檢查多個權限（AND 邏輯）
   */
  async checkAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.every(p => userPermissions.includes(p));
    } catch (error) {
      console.error('檢查多個權限時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 檢查多個權限（OR 邏輯）
   */
  async checkAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.some(p => userPermissions.includes(p));
    } catch (error) {
      console.error('檢查任一權限時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 獲取用戶的所有權限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    // 檢查快取
    const cached = this.getCachedPermissions(userId);
    if (cached) return cached;

    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data() as User;
      const role = normalizeRole(userData.role);
      
      // 檢查是否為 Super Admin（email 或角色）
      if (userData.email && isSuperAdminEmail(userData.email)) {
        const permissions = getRolePermissions(Role.SUPER_ADMIN);
        this.setCachedPermissions(userId, permissions, Role.SUPER_ADMIN);
        return permissions;
      }

      // 獲取角色對應的權限
      const rolePermissions = getRolePermissions(role);
      
      // 合併自定義權限（如果有）
      const customPermissions = userData.platformPermissions || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
      
      this.setCachedPermissions(userId, allPermissions, role);
      return allPermissions;
    } catch (error) {
      console.error('獲取用戶權限時發生錯誤:', error);
      return [];
    }
  }

  /**
   * 獲取用戶角色
   */
  async getUserRole(userId: string): Promise<Role> {
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        return Role.TEAM_MEMBER;
      }

      const userData = userDoc.data() as User;
      
      // 檢查是否為 Super Admin email
      if (userData.email && isSuperAdminEmail(userData.email)) {
        return Role.SUPER_ADMIN;
      }

      return normalizeRole(userData.role);
    } catch (error) {
      console.error('獲取用戶角色時發生錯誤:', error);
      return Role.TEAM_MEMBER;
    }
  }

  /**
   * 確保權限正確（登入時自動執行）
   */
  async ensurePermissions(user: FirebaseUser): Promise<void> {
    try {
      console.log('🔐 確保用戶權限正確:', user.email);
      
      // 檢查是否為 Super Admin email
      if (user.email && isSuperAdminEmail(user.email)) {
        await this.initializeSuperAdmin(user);
        return;
      }

      // 檢查並修復一般用戶權限
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('用戶文檔不存在，建立新文檔');
        await this.createUserDocument(user);
        return;
      }

      const userData = userDoc.data() as User;
      const role = normalizeRole(userData.role);
      const expectedPermissions = getRolePermissions(role);
      const currentPermissions = userData.platformPermissions || [];

      // 檢查權限是否完整
      const missingPermissions = expectedPermissions.filter(p => !currentPermissions.includes(p));
      if (missingPermissions.length > 0) {
        console.log('修復缺失的權限:', missingPermissions);
        await this.repairPermissions(user.uid);
      }

      // 清除快取以獲取最新權限
      this.clearCache(user.uid);
    } catch (error) {
      console.error('確保權限時發生錯誤:', error);
    }
  }

  /**
   * 修復用戶權限
   */
  async repairPermissions(userId: string): Promise<boolean> {
    try {
      console.log('🔧 開始修復用戶權限:', userId);
      
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        console.error('用戶不存在');
        return false;
      }

      const userData = userDoc.data() as User;
      
      // 檢查是否為 Super Admin email
      let role = normalizeRole(userData.role);
      if (userData.email && isSuperAdminEmail(userData.email)) {
        role = Role.SUPER_ADMIN;
      }

      // 獲取應有的權限
      const expectedPermissions = getRolePermissions(role);
      
      // 更新用戶文檔
      const updates: any = {
        role: role,
        platformPermissions: expectedPermissions,
        lastPermissionRepair: serverTimestamp()
      };

      // 如果是 Super Admin，確保 isSuperAdmin 標記
      if (role === Role.SUPER_ADMIN) {
        updates.isSuperAdmin = true;
      }

      await updateDoc(doc(getFirebaseDb(), 'users', userId), updates);
      
      // 記錄審計日誌
      await this.auditPermissionChange(userId, PERMISSION_AUDIT_ACTIONS.REPAIR, {
        oldRole: userData.role,
        newRole: role,
        permissions: expectedPermissions
      });

      // 清除快取
      this.clearCache(userId);
      
      console.log('✅ 權限修復成功');
      return true;
    } catch (error) {
      console.error('修復權限時發生錯誤:', error);
      return false;
    }
  }

  /**
   * 初始化 Super Admin 權限
   */
  async initializeSuperAdmin(user: FirebaseUser): Promise<void> {
    try {
      console.log('👑 初始化 Super Admin 權限:', user.email);
      
      const userRef = doc(getFirebaseDb(), 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const updates = {
        email: user.email,
        role: Role.SUPER_ADMIN,
        isSuperAdmin: true,
        platformPermissions: getRolePermissions(Role.SUPER_ADMIN),
        lastPermissionRepair: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      if (!userDoc.exists()) {
        // 建立新的 Super Admin 文檔
        await setDoc(userRef, {
          ...updates,
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Admin',
          organizationId: 'system',
          createdAt: serverTimestamp()
        });
      } else {
        // 更新現有文檔
        await updateDoc(userRef, updates);
      }

      // 記錄審計日誌
      await this.auditPermissionChange(user.uid, PERMISSION_AUDIT_ACTIONS.INITIALIZE, {
        role: Role.SUPER_ADMIN,
        email: user.email
      });

      // 清除快取
      this.clearCache(user.uid);
      
      console.log('✅ Super Admin 權限初始化完成');
    } catch (error) {
      console.error('初始化 Super Admin 權限時發生錯誤:', error);
    }
  }

  /**
   * 建立用戶文檔
   */
  private async createUserDocument(user: FirebaseUser): Promise<void> {
    try {
      const role = user.email && isSuperAdminEmail(user.email) 
        ? Role.SUPER_ADMIN 
        : Role.TEAM_MEMBER;
      
      const permissions = getRolePermissions(role);
      
      await setDoc(doc(getFirebaseDb(), 'users', user.uid), {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        role: role,
        platformPermissions: permissions,
        isSuperAdmin: role === Role.SUPER_ADMIN,
        organizationId: role === Role.SUPER_ADMIN ? 'system' : '',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log('✅ 用戶文檔建立成功');
    } catch (error) {
      console.error('建立用戶文檔時發生錯誤:', error);
    }
  }

  /**
   * 授予權限
   */
  async grantPermission(userId: string, permission: string, grantedBy: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('用戶不存在');
      }

      const userData = userDoc.data() as User;
      const currentPermissions = userData.platformPermissions || [];
      
      if (!currentPermissions.includes(permission)) {
        const newPermissions = [...currentPermissions, permission];
        
        await updateDoc(doc(getFirebaseDb(), 'users', userId), {
          platformPermissions: newPermissions,
          lastPermissionUpdate: serverTimestamp()
        });

        // 記錄審計日誌
        await this.auditPermissionChange(userId, PERMISSION_AUDIT_ACTIONS.GRANT, {
          permission,
          grantedBy
        });

        // 清除快取
        this.clearCache(userId);
      }
    } catch (error) {
      console.error('授予權限時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 撤銷權限
   */
  async revokePermission(userId: string, permission: string, revokedBy: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('用戶不存在');
      }

      const userData = userDoc.data() as User;
      const currentPermissions = userData.platformPermissions || [];
      
      if (currentPermissions.includes(permission)) {
        const newPermissions = currentPermissions.filter(p => p !== permission);
        
        await updateDoc(doc(getFirebaseDb(), 'users', userId), {
          platformPermissions: newPermissions,
          lastPermissionUpdate: serverTimestamp()
        });

        // 記錄審計日誌
        await this.auditPermissionChange(userId, PERMISSION_AUDIT_ACTIONS.REVOKE, {
          permission,
          revokedBy
        });

        // 清除快取
        this.clearCache(userId);
      }
    } catch (error) {
      console.error('撤銷權限時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新用戶角色
   */
  async updateUserRole(userId: string, newRole: Role, updatedBy: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('用戶不存在');
      }

      const userData = userDoc.data() as User;
      const oldRole = normalizeRole(userData.role);
      
      if (oldRole !== newRole) {
        const newPermissions = getRolePermissions(newRole);
        
        await updateDoc(doc(getFirebaseDb(), 'users', userId), {
          role: newRole,
          platformPermissions: newPermissions,
          isSuperAdmin: newRole === Role.SUPER_ADMIN,
          lastPermissionUpdate: serverTimestamp()
        });

        // 記錄審計日誌
        await this.auditPermissionChange(userId, PERMISSION_AUDIT_ACTIONS.UPDATE, {
          oldRole,
          newRole,
          updatedBy
        });

        // 清除快取
        this.clearCache(userId);
      }
    } catch (error) {
      console.error('更新用戶角色時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 記錄權限變更審計日誌
   */
  private async auditPermissionChange(
    userId: string, 
    action: PermissionAuditAction, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await addDoc(collection(getFirebaseDb(), 'permission_audits'), {
        userId,
        action,
        metadata,
        timestamp: serverTimestamp(),
        performedBy: 'system',
        performedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('記錄權限審計日誌時發生錯誤:', error);
      // 不拋出錯誤，避免影響主要流程
    }
  }

  /**
   * 批量檢查權限
   */
  async batchCheckPermissions(
    userId: string, 
    permissionChecks: { permission: string; required: boolean }[]
  ): Promise<Record<string, boolean>> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const results: Record<string, boolean> = {};
      
      for (const check of permissionChecks) {
        results[check.permission] = userPermissions.includes(check.permission);
      }
      
      return results;
    } catch (error) {
      console.error('批量檢查權限時發生錯誤:', error);
      return {};
    }
  }

  /**
   * 比較兩個用戶的權限層級
   */
  async compareUserRoles(userId1: string, userId2: string): Promise<'higher' | 'equal' | 'lower'> {
    try {
      const role1 = await this.getUserRole(userId1);
      const role2 = await this.getUserRole(userId2);
      
      if (role1 === role2) return 'equal';
      if (isRoleHigherOrEqual(role1, role2)) return 'higher';
      return 'lower';
    } catch (error) {
      console.error('比較用戶角色時發生錯誤:', error);
      return 'equal';
    }
  }
}

// 導出單例實例
export const permissionService = PermissionService.getInstance();

// 導出類型
export type { PermissionAudit };
export { PermissionService };