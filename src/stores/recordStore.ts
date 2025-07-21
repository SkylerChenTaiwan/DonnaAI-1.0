/**
 * 紀錄狀態管理 Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  RecordDoc,
  RecordFilter,
  RecordProcessingResult
} from '../types/record';
import { CustomFieldDefinition } from '../types/custom-fields';
import { 
  createRecord,
  updateRecord,
  deleteRecord,
  processRecordForCustomerFields
} from '../services/firebase/records';
import { 
  getRecord,
  getRecordsOptimized,
  subscribeToRecordsOptimized,
  getRecordsByCustomerOptimized
} from '../services/firebase/records-v2';
import { getCustomFieldDefinitions } from '../services/firebase/custom-fields';
import { Unsubscribe } from 'firebase/firestore';
import { User } from '../types/user';

interface RecordState {
  // 狀態
  records: RecordDoc[];
  selectedRecord: RecordDoc | null;
  customFieldDefinitions: CustomFieldDefinition[];
  processingResults: Map<string, RecordProcessingResult>;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  filter: RecordFilter;
  
  // 訂閱管理
  unsubscribe: Unsubscribe | null;
  
  // 動作 - 基本 CRUD
  fetchRecords: (userOrUserId: User | string, filter?: RecordFilter) => Promise<void>;
  fetchRecord: (recordId: string, userOrUserId: User | string) => Promise<void>;
  createRecord: (record: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string, audioFile?: File) => Promise<RecordDoc>;
  updateRecord: (recordId: string, updates: Partial<RecordDoc>, userId: string) => Promise<void>;
  deleteRecord: (recordId: string, userId: string) => Promise<void>;
  
  // 動作 - AI 處理
  processRecordFields: (recordId: string, autoApply?: boolean) => Promise<void>;
  
  // 動作 - 即時訂閱
  subscribeToRecords: (userOrTeamId: User | string, userId?: string) => void;
  unsubscribeFromRecords: () => void;
  
  // 動作 - 自訂欄位
  fetchCustomFieldDefinitions: (organizationId: string) => Promise<void>;
  
  // 動作 - 過濾
  setFilter: (filter: Partial<RecordFilter>) => void;
  clearFilter: () => void;
  
  // 動作 - 客戶相關
  fetchCustomerRecords: (customerId: string, userOrUserId: User | string) => Promise<void>;
  
  // 動作 - 狀態管理
  setSelectedRecord: (record: RecordDoc | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  records: [],
  selectedRecord: null,
  customFieldDefinitions: [],
  processingResults: new Map(),
  isLoading: false,
  isProcessing: false,
  error: null,
  filter: {},
  unsubscribe: null
};

export const useRecordStore = create<RecordState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 獲取紀錄列表（支援向後相容）
      fetchRecords: async (userOrUserId: User | string, filter?: RecordFilter) => {
        set({ isLoading: true, error: null });
        
        try {
          let records: RecordDoc[];
          const currentFilter = filter || get().filter;
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            records = await getRecordsOptimized(tempUser, currentFilter);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            records = await getRecordsOptimized(userOrUserId, currentFilter);
          }
          
          set({ records, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取紀錄列表失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取單一紀錄（支援向後相容）
      fetchRecord: async (recordId: string, userOrUserId: User | string) => {
        set({ isLoading: true, error: null });
        
        try {
          let record: RecordDoc | null;
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            record = await getRecord(recordId, tempUser);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            record = await getRecord(recordId, userOrUserId);
          }
          
          if (record) {
            set({ selectedRecord: record, isLoading: false });
          } else {
            set({ 
              error: '找不到指定的紀錄',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取紀錄失敗',
            isLoading: false 
          });
        }
      },
      
      // 建立紀錄
      createRecord: async (record, userId, audioFile) => {
        set({ isLoading: true, error: null });
        
        try {
          const newRecord = await createRecord(record, userId, audioFile);
          set(state => ({
            records: [newRecord, ...state.records],
            isLoading: false
          }));
          return newRecord;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '建立紀錄失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 更新紀錄
      updateRecord: async (recordId, updates, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateRecord(recordId, updates, userId);
          
          // 更新本地狀態
          set(state => ({
            records: state.records.map(r => 
              r.id === recordId ? { ...r, ...updates } : r
            ),
            selectedRecord: state.selectedRecord?.id === recordId 
              ? { ...state.selectedRecord, ...updates }
              : state.selectedRecord,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新紀錄失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 刪除紀錄
      deleteRecord: async (recordId, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await deleteRecord(recordId, userId);
          
          // 更新本地狀態
          set(state => ({
            records: state.records.filter(r => r.id !== recordId),
            selectedRecord: state.selectedRecord?.id === recordId 
              ? null 
              : state.selectedRecord,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '刪除紀錄失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 處理紀錄欄位提取
      processRecordFields: async (recordId: string, autoApply: boolean = false) => {
        set({ isProcessing: true, error: null });
        
        try {
          const result = await processRecordForCustomerFields(recordId, autoApply);
          
          // 儲存處理結果
          set(state => {
            const newResults = new Map(state.processingResults);
            newResults.set(recordId, result);
            return { 
              processingResults: newResults,
              isProcessing: false 
            };
          });
          
          // 如果成功，更新本地紀錄狀態
          if (result.success && result.aiFieldMappings) {
            set(state => ({
              records: state.records.map(r => 
                r.id === recordId 
                  ? { 
                      ...r, 
                      aiFieldMappings: result.aiFieldMappings,
                      aiSummary: result.aiSummary 
                    } 
                  : r
              ),
              selectedRecord: state.selectedRecord?.id === recordId 
                ? { 
                    ...state.selectedRecord, 
                    aiFieldMappings: result.aiFieldMappings,
                    aiSummary: result.aiSummary 
                  }
                : state.selectedRecord
            }));
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'AI 處理失敗',
            isProcessing: false 
          });
          throw error;
        }
      },
      
      // 訂閱紀錄變更（支援向後相容）
      subscribeToRecords: (userOrTeamId: User | string, userId?: string) => {
        // 先取消現有訂閱
        const currentUnsubscribe = get().unsubscribe;
        if (currentUnsubscribe) {
          currentUnsubscribe();
        }
        
        const filter = get().filter;
        let unsubscribe: Unsubscribe;
        
        if (typeof userOrTeamId === 'string' && userId) {
          // 舊版調用方式 - 創建臨時 User 物件
          const tempUser: User = {
            id: userId,
            email: '',
            name: '',
            role: 'salesperson',
            organizationId: '',
            teamIds: [userOrTeamId],
            managedTeamIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          unsubscribe = subscribeToRecordsOptimized(tempUser, (records) => {
            set({ records });
          }, filter);
        } else if (typeof userOrTeamId === 'object') {
          // 新版調用方式 - 直接使用 User 物件
          unsubscribe = subscribeToRecordsOptimized(userOrTeamId, (records) => {
            set({ records });
          }, filter);
        } else {
          throw new Error('無效的參數');
        }
        
        set({ unsubscribe });
      },
      
      // 取消訂閱
      unsubscribeFromRecords: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },
      
      // 獲取自訂欄位定義
      fetchCustomFieldDefinitions: async (organizationId: string) => {
        try {
          const definitions = await getCustomFieldDefinitions(organizationId, 'record');
          set({ customFieldDefinitions: definitions });
        } catch (error) {
          console.error('獲取自訂欄位定義失敗:', error);
        }
      },
      
      // 設定過濾條件
      setFilter: (filter) => {
        set(state => ({
          filter: { ...state.filter, ...filter }
        }));
      },
      
      // 清除過濾條件
      clearFilter: () => {
        set({ filter: {} });
      },
      
      // 獲取客戶相關紀錄（支援向後相容）
      fetchCustomerRecords: async (customerId: string, userOrUserId: User | string) => {
        set({ isLoading: true, error: null });
        
        try {
          let records: RecordDoc[];
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            records = await getRecordsByCustomerOptimized(customerId, tempUser);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            records = await getRecordsByCustomerOptimized(customerId, userOrUserId);
          }
          
          set({ records, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取客戶紀錄失敗',
            isLoading: false 
          });
        }
      },
      
      // 設定選中的紀錄
      setSelectedRecord: (record) => {
        set({ selectedRecord: record });
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
      name: 'record-store'
    }
  )
);