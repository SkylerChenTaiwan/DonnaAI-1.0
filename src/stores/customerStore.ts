/**
 * 客戶狀態管理 Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CustomerDoc } from '../types/firebase';
import { CustomFieldDefinition } from '../types/custom-fields';
import { 
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomer,
  subscribeToCustomers,
  batchUpdateCustomers
} from '../services/firebase/customers';
import { getCustomFieldDefinitions } from '../services/firebase/custom-fields';
import { Unsubscribe } from 'firebase/firestore';

interface CustomerState {
  // 狀態
  customers: CustomerDoc[];
  selectedCustomer: CustomerDoc | null;
  customFieldDefinitions: CustomFieldDefinition[];
  isLoading: boolean;
  error: string | null;
  filters: {
    searchTerm?: string;
    assignedTo?: string;
    tags?: string[];
    teamId?: string;
  };
  
  // 訂閱管理
  unsubscribe: Unsubscribe | null;
  
  // 動作 - 基本 CRUD
  fetchCustomers: (userId: string, teamId?: string) => Promise<void>;
  fetchCustomer: (customerId: string, userId: string) => Promise<void>;
  addCustomer: (customer: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string) => Promise<CustomerDoc>;
  updateCustomer: (customerId: string, updates: Partial<CustomerDoc>, userId: string) => Promise<void>;
  deleteCustomer: (customerId: string, userId: string) => Promise<void>;
  
  // 動作 - 批次操作
  batchUpdateCustomers: (customerIds: string[], updates: Partial<CustomerDoc>, userId: string) => Promise<void>;
  
  // 動作 - 即時訂閱
  subscribeToCustomers: (teamId: string, userId: string) => void;
  unsubscribeFromCustomers: () => void;
  
  // 動作 - 自訂欄位
  fetchCustomFieldDefinitions: (organizationId: string) => Promise<void>;
  
  // 動作 - 過濾和搜尋
  setFilters: (filters: Partial<CustomerState['filters']>) => void;
  clearFilters: () => void;
  searchCustomers: (searchTerm: string) => void;
  
  // 動作 - 狀態管理
  setSelectedCustomer: (customer: CustomerDoc | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  customers: [],
  selectedCustomer: null,
  customFieldDefinitions: [],
  isLoading: false,
  error: null,
  filters: {},
  unsubscribe: null
};

export const useCustomerStore = create<CustomerState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 獲取客戶列表
      fetchCustomers: async (userId: string, teamId?: string) => {
        set({ isLoading: true, error: null });
        
        console.log('📦 customerStore.fetchCustomers 呼叫參數:', {
          userId,
          teamId,
          filters: get().filters
        });
        
        try {
          const filters = get().filters;
          const customers = await getCustomers(userId, teamId, filters);
          console.log(`✅ 獲取到 ${customers.length} 個客戶`);
          set({ customers, isLoading: false });
        } catch (error) {
          console.error('❌ fetchCustomers 錯誤:', error);
          set({ 
            error: error instanceof Error ? error.message : '獲取客戶列表失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取單一客戶
      fetchCustomer: async (customerId: string, userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const customer = await getCustomer(customerId, userId);
          if (customer) {
            set({ selectedCustomer: customer, isLoading: false });
          } else {
            set({ 
              error: '找不到指定的客戶',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取客戶失敗',
            isLoading: false 
          });
        }
      },
      
      // 新增客戶
      addCustomer: async (customer, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          const newCustomer = await createCustomer(customer, userId);
          set(state => ({
            customers: [newCustomer, ...state.customers],
            isLoading: false
          }));
          return newCustomer;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '新增客戶失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 更新客戶
      updateCustomer: async (customerId, updates, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateCustomer(customerId, updates, userId);
          
          // 更新本地狀態
          set(state => ({
            customers: state.customers.map(c => 
              c.id === customerId ? { ...c, ...updates } : c
            ),
            selectedCustomer: state.selectedCustomer?.id === customerId 
              ? { ...state.selectedCustomer, ...updates }
              : state.selectedCustomer,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新客戶失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 刪除客戶
      deleteCustomer: async (customerId, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await deleteCustomer(customerId, userId);
          
          // 更新本地狀態
          set(state => ({
            customers: state.customers.filter(c => c.id !== customerId),
            selectedCustomer: state.selectedCustomer?.id === customerId 
              ? null 
              : state.selectedCustomer,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '刪除客戶失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 批次更新客戶
      batchUpdateCustomers: async (customerIds, updates, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await batchUpdateCustomers(customerIds, updates, userId);
          
          // 更新本地狀態
          set(state => ({
            customers: state.customers.map(c => 
              customerIds.includes(c.id!) ? { ...c, ...updates } : c
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批次更新客戶失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 訂閱客戶變更
      subscribeToCustomers: (teamId: string, userId: string) => {
        // 先取消現有訂閱
        const currentUnsubscribe = get().unsubscribe;
        if (currentUnsubscribe) {
          currentUnsubscribe();
        }
        
        const unsubscribe = subscribeToCustomers(teamId, userId, (customers) => {
          // 應用過濾
          const filters = get().filters;
          let filteredCustomers = customers;
          
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredCustomers = filteredCustomers.filter(c =>
              c.name.toLowerCase().includes(searchLower) ||
              c.company.toLowerCase().includes(searchLower) ||
              c.email?.toLowerCase().includes(searchLower) ||
              c.phone?.includes(filters.searchTerm!)
            );
          }
          
          if (filters.assignedTo) {
            filteredCustomers = filteredCustomers.filter(c => 
              c.assignedTo === filters.assignedTo
            );
          }
          
          if (filters.tags && filters.tags.length > 0) {
            filteredCustomers = filteredCustomers.filter(c =>
              c.tags?.some(tag => filters.tags!.includes(tag))
            );
          }
          
          set({ customers: filteredCustomers });
        });
        
        set({ unsubscribe });
      },
      
      // 取消訂閱
      unsubscribeFromCustomers: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },
      
      // 獲取自訂欄位定義
      fetchCustomFieldDefinitions: async (organizationId: string) => {
        try {
          const definitions = await getCustomFieldDefinitions(organizationId, 'customer');
          set({ customFieldDefinitions: definitions });
        } catch (error) {
          console.error('獲取自訂欄位定義失敗:', error);
        }
      },
      
      // 設定過濾條件
      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }));
      },
      
      // 清除過濾條件
      clearFilters: () => {
        set({ filters: {} });
      },
      
      // 搜尋客戶
      searchCustomers: (searchTerm: string) => {
        set(state => ({
          filters: { ...state.filters, searchTerm }
        }));
      },
      
      // 設定選中的客戶
      setSelectedCustomer: (customer) => {
        set({ selectedCustomer: customer });
      },
      
      // 清除錯誤
      clearError: () => {
        set({ error: null });
      },
      
      // 重置狀態
      reset: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
        }
        set(initialState);
      }
    }),
    {
      name: 'customer-store'
    }
  )
);