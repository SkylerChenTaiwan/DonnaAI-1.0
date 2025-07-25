/**
 * Admin 狀態管理 Store
 * 管理組織、使用統計和企業配置等管理員相關資料
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Organization, User } from '@/types/user';
import { EnterpriseConfig, UsageMetrics, Period } from '@/types/admin';
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrganizationStats,
  OrganizationFilters,
  CreateOrganizationData,
  getUsageReport,
  getRealtimeStats,
  UsageReport,
  getEnterpriseConfig,
  updateEnterpriseConfig,
  toggleTool,
  updateSubscriptionDetails,
  updateCustomSettings
} from '@/services/firebase/admin';
import { getFirebaseDb } from '@/services/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import {
  batchUpdateUserStatus,
  batchUpdateUserRole,
  batchDeleteUsers,
  validateDeletableUsers
} from '@/services/firebase/admin/userManagementService';

interface AdminState {
  // 組織管理
  organizations: Organization[];
  selectedOrganization: Organization | null;
  organizationFilters: OrganizationFilters;
  
  // 用戶管理
  users: User[];
  loading: boolean;
  
  // 使用統計
  usageReport: UsageReport | null;
  realtimeStats: {
    onlineUsers: number;
    todaySessions: number;
    todayAIMinutes: number;
  } | null;
  
  // 企業配置
  enterpriseConfig: EnterpriseConfig | null;
  
  // 狀態
  isLoading: boolean;
  error: string | null;
  
  // 組織管理動作
  fetchOrganizations: (filters?: OrganizationFilters) => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
  updateOrganizationStats: (orgId: string, stats: Partial<Organization['stats']>) => Promise<void>;
  setOrganizationFilters: (filters: OrganizationFilters) => void;
  
  // 使用統計動作
  fetchUsageReport: (orgId: string, period: Period, startDate?: Date, endDate?: Date) => Promise<void>;
  fetchRealtimeStats: (orgId: string) => Promise<void>;
  
  // 企業配置動作
  fetchEnterpriseConfig: (orgId: string) => Promise<void>;
  updateEnterpriseConfig: (configId: string, updates: Partial<EnterpriseConfig>) => Promise<void>;
  toggleTool: (configId: string, toolId: string, enabled: boolean) => Promise<void>;
  updateSubscriptionDetails: (configId: string, updates: Partial<EnterpriseConfig['subscriptionDetails']>) => Promise<void>;
  updateCustomSettings: (configId: string, settings: Partial<EnterpriseConfig['customSettings']>) => Promise<void>;
  
  // 用戶管理動作
  refreshUsers: () => Promise<void>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  batchUpdateStatus: (userIds: string[], isActive: boolean) => Promise<{ success: number; failed: number; errors: string[] }>;
  batchUpdateRole: (userIds: string[], role: 'salesperson' | 'manager' | 'admin') => Promise<{ success: number; failed: number; errors: string[] }>;
  batchDelete: (userIds: string[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  validateDeletable: (userIds: string[]) => Promise<{ deletableIds: string[]; undeletableIds: string[]; reasons: Record<string, string> }>;
  
  // 工具動作
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  organizations: [],
  selectedOrganization: null,
  organizationFilters: {},
  users: [],
  loading: false,
  usageReport: null,
  realtimeStats: null,
  enterpriseConfig: null,
  isLoading: false,
  error: null
};

export const useAdminStore = create<AdminState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 組織管理動作
      fetchOrganizations: async (filters?: OrganizationFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          const orgs = await getOrganizations(filters || get().organizationFilters);
          set({ organizations: orgs, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取組織列表失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      selectOrganization: async (orgId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const org = await getOrganization(orgId);
          if (org) {
            set({ selectedOrganization: org });
            
            // 同時載入相關資料
            await Promise.all([
              get().fetchEnterpriseConfig(orgId),
              get().fetchRealtimeStats(orgId)
            ]);
          } else {
            set({ error: '找不到指定的組織' });
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取組織詳情失敗',
            isLoading: false 
          });
        }
      },
      
      createOrganization: async (data: CreateOrganizationData) => {
        set({ isLoading: true, error: null });
        
        try {
          const newOrg = await createOrganization(data);
          set(state => ({
            organizations: [newOrg, ...state.organizations],
            isLoading: false
          }));
          return newOrg;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '建立組織失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateOrganization: async (orgId: string, updates: Partial<Organization>) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateOrganization(orgId, updates);
          
          // 更新本地狀態
          set(state => ({
            organizations: state.organizations.map(org => 
              org.id === orgId ? { ...org, ...updates } : org
            ),
            selectedOrganization: state.selectedOrganization?.id === orgId 
              ? { ...state.selectedOrganization, ...updates }
              : state.selectedOrganization,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新組織失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      deleteOrganization: async (orgId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await deleteOrganization(orgId);
          
          // 更新本地狀態
          set(state => ({
            organizations: state.organizations.filter(org => org.id !== orgId),
            selectedOrganization: state.selectedOrganization?.id === orgId 
              ? null 
              : state.selectedOrganization,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '刪除組織失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateOrganizationStats: async (orgId: string, stats: Partial<Organization['stats']>) => {
        try {
          await updateOrganizationStats(orgId, stats);
          
          // 更新本地狀態
          set(state => ({
            organizations: state.organizations.map(org => 
              org.id === orgId 
                ? { ...org, stats: { ...org.stats, ...stats } }
                : org
            ),
            selectedOrganization: state.selectedOrganization?.id === orgId 
              ? { ...state.selectedOrganization, stats: { ...state.selectedOrganization.stats, ...stats } }
              : state.selectedOrganization
          }));
        } catch (error) {
          console.error('更新組織統計失敗:', error);
        }
      },
      
      setOrganizationFilters: (filters: OrganizationFilters) => {
        set({ organizationFilters: filters });
      },
      
      // 使用統計動作
      fetchUsageReport: async (orgId: string, period: Period, startDate?: Date, endDate?: Date) => {
        set({ isLoading: true, error: null });
        
        try {
          const report = await getUsageReport(orgId, period, startDate, endDate);
          set({ usageReport: report, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取使用報表失敗',
            isLoading: false 
          });
        }
      },
      
      fetchRealtimeStats: async (orgId: string) => {
        try {
          const stats = await getRealtimeStats(orgId);
          set({ realtimeStats: stats });
        } catch (error) {
          console.error('獲取即時統計失敗:', error);
        }
      },
      
      // 企業配置動作
      fetchEnterpriseConfig: async (orgId: string) => {
        try {
          const config = await getEnterpriseConfig(orgId);
          set({ enterpriseConfig: config });
        } catch (error) {
          console.error('獲取企業配置失敗:', error);
        }
      },
      
      updateEnterpriseConfig: async (configId: string, updates: Partial<EnterpriseConfig>) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateEnterpriseConfig(configId, updates);
          
          // 更新本地狀態
          set(state => ({
            enterpriseConfig: state.enterpriseConfig?.id === configId
              ? { ...state.enterpriseConfig, ...updates }
              : state.enterpriseConfig,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新企業配置失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      toggleTool: async (configId: string, toolId: string, enabled: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          await toggleTool(configId, toolId, enabled);
          
          // 更新本地狀態
          set(state => {
            if (!state.enterpriseConfig || state.enterpriseConfig.id !== configId) {
              return { isLoading: false };
            }
            
            const updatedTools = state.enterpriseConfig.enabledTools.map(tool =>
              tool.id === toolId ? { ...tool, enabled } : tool
            );
            
            return {
              enterpriseConfig: {
                ...state.enterpriseConfig,
                enabledTools: updatedTools
              },
              isLoading: false
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '切換工具狀態失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateSubscriptionDetails: async (configId: string, updates: Partial<EnterpriseConfig['subscriptionDetails']>) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateSubscriptionDetails(configId, updates);
          
          // 更新本地狀態
          set(state => {
            if (!state.enterpriseConfig || state.enterpriseConfig.id !== configId) {
              return { isLoading: false };
            }
            
            return {
              enterpriseConfig: {
                ...state.enterpriseConfig,
                subscriptionDetails: {
                  ...state.enterpriseConfig.subscriptionDetails,
                  ...updates
                }
              },
              isLoading: false
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新訂閱詳情失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateCustomSettings: async (configId: string, settings: Partial<EnterpriseConfig['customSettings']>) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateCustomSettings(configId, settings);
          
          // 更新本地狀態
          set(state => {
            if (!state.enterpriseConfig || state.enterpriseConfig.id !== configId) {
              return { isLoading: false };
            }
            
            return {
              enterpriseConfig: {
                ...state.enterpriseConfig,
                customSettings: {
                  ...state.enterpriseConfig.customSettings,
                  ...settings
                }
              },
              isLoading: false
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新自訂設定失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 用戶管理動作
      refreshUsers: async () => {
        set({ loading: true, error: null });
        
        try {
          const db = getFirebaseDb();
          const currentUser = useAuthStore.getState().user;
          
          if (!currentUser?.organizationId) {
            throw new Error('無法獲取組織資訊');
          }
          
          // 獲取組織內的所有用戶
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('organizationId', '==', currentUser.organizationId)
          );
          
          const snapshot = await getDocs(q);
          const users: User[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
              id: doc.id,
              email: data.email,
              name: data.name,
              role: data.role,
              organizationId: data.organizationId,
              department: data.department,
              phone: data.phone,
              createdAt: data.createdAt?.toDate(),
              lastLoginAt: data.lastLoginAt?.toDate(),
              isActive: data.isActive !== false, // 預設為 true
              supervisorId: data.supervisorId,
              teamIds: data.teamIds || [],
              personalGoals: data.personalGoals || {}
            } as User);
          });
          
          // 按建立時間排序
          users.sort((a, b) => {
            const dateA = a.createdAt?.getTime() || 0;
            const dateB = b.createdAt?.getTime() || 0;
            return dateB - dateA;
          });
          
          set({ users, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取用戶列表失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      updateUserStatus: async (userId: string, isActive: boolean) => {
        set({ loading: true, error: null });
        
        try {
          const db = getFirebaseDb();
          const userRef = doc(db, 'users', userId);
          
          await updateDoc(userRef, {
            isActive,
            updatedAt: new Date()
          });
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user => 
              user.id === userId ? { ...user, isActive } : user
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新用戶狀態失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      updateUserRole: async (userId: string, role: string) => {
        set({ loading: true, error: null });
        
        try {
          const db = getFirebaseDb();
          const userRef = doc(db, 'users', userId);
          
          await updateDoc(userRef, {
            role,
            updatedAt: new Date()
          });
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user => 
              user.id === userId ? { ...user, role } : user
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新用戶角色失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      batchUpdateStatus: async (userIds: string[], isActive: boolean) => {
        set({ loading: true, error: null });
        
        try {
          const result = await batchUpdateUserStatus(userIds, isActive);
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user => 
              userIds.includes(user.id) ? { ...user, isActive } : user
            ),
            loading: false
          }));
          
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批量更新用戶狀態失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      batchUpdateRole: async (userIds: string[], role: 'salesperson' | 'manager' | 'admin') => {
        set({ loading: true, error: null });
        
        try {
          const result = await batchUpdateUserRole(userIds, role);
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user => 
              userIds.includes(user.id) ? { ...user, role } : user
            ),
            loading: false
          }));
          
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批量更新用戶角色失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      batchDelete: async (userIds: string[]) => {
        set({ loading: true, error: null });
        
        try {
          const result = await batchDeleteUsers(userIds);
          
          // 更新本地狀態
          if (result.success > 0) {
            set(state => ({
              users: state.users.filter(user => !userIds.includes(user.id)),
              loading: false
            }));
          } else {
            set({ loading: false });
          }
          
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批量刪除用戶失敗',
            loading: false 
          });
          throw error;
        }
      },
      
      validateDeletable: async (userIds: string[]) => {
        try {
          return await validateDeletableUsers(userIds);
        } catch (error) {
          console.error('驗證可刪除用戶失敗:', error);
          throw error;
        }
      },
      
      // 工具動作
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'admin-store'
    }
  )
);