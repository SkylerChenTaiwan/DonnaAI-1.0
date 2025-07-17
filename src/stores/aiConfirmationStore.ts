/**
 * AI 確認狀態管理 Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AIProcessingConfirmation } from '../types/custom-fields';
import { 
  updateConfirmationStatus,
  getPendingConfirmations,
  getConfirmation,
  subscribeToPendingConfirmations,
  batchConfirmRequests,
  getConfirmationStats
} from '../services/firebase/ai-confirmations';
import { Unsubscribe } from 'firebase/firestore';

interface AIConfirmationState {
  // 狀態
  pendingConfirmations: AIProcessingConfirmation[];
  selectedConfirmation: AIProcessingConfirmation | null;
  confirmationStats: {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    modified: number;
    averageConfidenceScore: number;
    topFields: Array<{ fieldKey: string; count: number }>;
  } | null;
  isLoading: boolean;
  error: string | null;
  
  // 訂閱管理
  unsubscribe: Unsubscribe | null;
  
  // 動作 - 基本操作
  fetchPendingConfirmations: (userId: string, teamId?: string) => Promise<void>;
  fetchConfirmation: (confirmationId: string, userId: string) => Promise<void>;
  
  // 動作 - 確認操作
  confirmRequest: (confirmationId: string, userId: string) => Promise<void>;
  rejectRequest: (confirmationId: string, userId: string) => Promise<void>;
  modifyRequest: (confirmationId: string, modifications: Record<string, any>, userId: string) => Promise<void>;
  
  // 動作 - 批次操作
  batchConfirm: (confirmationIds: string[], userId: string) => Promise<void>;
  batchReject: (confirmationIds: string[], userId: string) => Promise<void>;
  
  // 動作 - 即時訂閱
  subscribeToPendingConfirmations: (userId: string) => void;
  unsubscribeFromConfirmations: () => void;
  
  // 動作 - 統計
  fetchConfirmationStats: (organizationId: string, dateFrom?: Date, dateTo?: Date) => Promise<void>;
  
  // 動作 - 狀態管理
  setSelectedConfirmation: (confirmation: AIProcessingConfirmation | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  pendingConfirmations: [],
  selectedConfirmation: null,
  confirmationStats: null,
  isLoading: false,
  error: null,
  unsubscribe: null
};

export const useAIConfirmationStore = create<AIConfirmationState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 獲取待確認請求列表
      fetchPendingConfirmations: async (userId: string, teamId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const confirmations = await getPendingConfirmations(userId, teamId);
          set({ pendingConfirmations: confirmations, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取待確認請求失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取單一確認請求
      fetchConfirmation: async (confirmationId: string, userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const confirmation = await getConfirmation(confirmationId, userId);
          if (confirmation) {
            set({ selectedConfirmation: confirmation, isLoading: false });
          } else {
            set({ 
              error: '找不到指定的確認請求',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取確認請求失敗',
            isLoading: false 
          });
        }
      },
      
      // 確認請求
      confirmRequest: async (confirmationId: string, userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateConfirmationStatus(confirmationId, 'confirmed', userId);
          
          // 更新本地狀態
          set(state => ({
            pendingConfirmations: state.pendingConfirmations.filter(c => c.id !== confirmationId),
            selectedConfirmation: state.selectedConfirmation?.id === confirmationId 
              ? { ...state.selectedConfirmation, status: 'confirmed' }
              : state.selectedConfirmation,
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.confirmationStats) {
            state.confirmationStats.pending--;
            state.confirmationStats.confirmed++;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '確認請求失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 拒絕請求
      rejectRequest: async (confirmationId: string, userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateConfirmationStatus(confirmationId, 'rejected', userId);
          
          // 更新本地狀態
          set(state => ({
            pendingConfirmations: state.pendingConfirmations.filter(c => c.id !== confirmationId),
            selectedConfirmation: state.selectedConfirmation?.id === confirmationId 
              ? { ...state.selectedConfirmation, status: 'rejected' }
              : state.selectedConfirmation,
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.confirmationStats) {
            state.confirmationStats.pending--;
            state.confirmationStats.rejected++;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '拒絕請求失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 修改請求
      modifyRequest: async (confirmationId: string, modifications: Record<string, any>, userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateConfirmationStatus(confirmationId, 'modified', userId, modifications);
          
          // 更新本地狀態
          set(state => ({
            pendingConfirmations: state.pendingConfirmations.filter(c => c.id !== confirmationId),
            selectedConfirmation: state.selectedConfirmation?.id === confirmationId 
              ? { 
                  ...state.selectedConfirmation, 
                  status: 'modified',
                  userModifications: modifications 
                }
              : state.selectedConfirmation,
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.confirmationStats) {
            state.confirmationStats.pending--;
            state.confirmationStats.modified++;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '修改請求失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 批次確認
      batchConfirm: async (confirmationIds: string[], userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await batchConfirmRequests(confirmationIds, userId, 'confirm');
          
          // 更新本地狀態
          set(state => ({
            pendingConfirmations: state.pendingConfirmations.filter(
              c => !confirmationIds.includes(c.id)
            ),
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.confirmationStats) {
            state.confirmationStats.pending -= confirmationIds.length;
            state.confirmationStats.confirmed += confirmationIds.length;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批次確認失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 批次拒絕
      batchReject: async (confirmationIds: string[], userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await batchConfirmRequests(confirmationIds, userId, 'reject');
          
          // 更新本地狀態
          set(state => ({
            pendingConfirmations: state.pendingConfirmations.filter(
              c => !confirmationIds.includes(c.id)
            ),
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.confirmationStats) {
            state.confirmationStats.pending -= confirmationIds.length;
            state.confirmationStats.rejected += confirmationIds.length;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批次拒絕失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 訂閱待確認請求變更
      subscribeToPendingConfirmations: (userId: string) => {
        // 先取消現有訂閱
        const currentUnsubscribe = get().unsubscribe;
        if (currentUnsubscribe) {
          currentUnsubscribe();
        }
        
        const unsubscribe = subscribeToPendingConfirmations(userId, (confirmations) => {
          set({ pendingConfirmations: confirmations });
        });
        
        set({ unsubscribe });
      },
      
      // 取消訂閱
      unsubscribeFromConfirmations: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },
      
      // 獲取確認統計
      fetchConfirmationStats: async (organizationId: string, dateFrom?: Date, dateTo?: Date) => {
        try {
          const stats = await getConfirmationStats(organizationId, dateFrom, dateTo);
          set({ confirmationStats: stats });
        } catch (error) {
          console.error('獲取確認統計失敗:', error);
        }
      },
      
      // 設定選中的確認請求
      setSelectedConfirmation: (confirmation) => {
        set({ selectedConfirmation: confirmation });
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
      name: 'ai-confirmation-store'
    }
  )
);