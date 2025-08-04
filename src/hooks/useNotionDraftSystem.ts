import { useState, useCallback, useEffect, useRef } from 'react';
import { showToast } from '@/utils/toast';

// 草稿項目的類型
interface DraftItem {
  id: string;
  data: Record<string, any>;
  isDirty: boolean;  // 是否有未同步的修改
  isNew: boolean;    // 是否為新建項目
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime?: number;
  error?: string;
}

// 草稿系統的狀態
interface DraftState {
  items: Map<string, DraftItem>;
  globalSyncStatus: 'idle' | 'syncing' | 'error';
}

// Hook 的參數
interface UseNotionDraftSystemParams {
  sourceData: any[];  // 從 Firebase 載入的原始資料
  onSync: (id: string, data: Record<string, any>, isNew: boolean) => Promise<void>;
  syncDelay?: number;  // 同步延遲（預設 500ms）
}

// Hook 的返回值
interface UseNotionDraftSystemReturn {
  // 資料
  draftData: any[];  // 用於 UI 顯示的資料（包含草稿）
  
  // 操作方法
  updateDraft: (id: string, field: string, value: any) => void;
  addNewDraft: (defaultData?: Record<string, any>) => string;
  deleteDraft: (id: string) => void;
  
  // 同步相關
  syncStatus: 'idle' | 'syncing' | 'error';
  syncAll: () => Promise<void>;
  getSyncStatus: (id: string) => 'idle' | 'syncing' | 'error';
  
  // 狀態查詢
  hasUnsavedChanges: boolean;
  getUnsavedCount: () => number;
}

export function useNotionDraftSystem({
  sourceData,
  onSync,
  syncDelay = 500
}: UseNotionDraftSystemParams): UseNotionDraftSystemReturn {
  // 主要狀態
  const [draftState, setDraftState] = useState<DraftState>({
    items: new Map(),
    globalSyncStatus: 'idle'
  });
  
  // 同步計時器
  const syncTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // 重試次數記錄
  const retryCount = useRef<Map<string, number>>(new Map());
  // 正在同步的項目
  const syncingItems = useRef<Set<string>>(new Set());
  
  // 初始化：將 Firebase 資料載入到草稿層
  useEffect(() => {
    console.log('🔄 初始化草稿層，載入資料:', sourceData.length);
    
    setDraftState(prev => {
      const newItems = new Map<string, DraftItem>();
      
      // 保留新建的草稿
      prev.items.forEach((item, id) => {
        if (item.isNew) {
          newItems.set(id, item);
        }
      });
      
      // 載入 Firebase 資料
      sourceData.forEach(item => {
        if (!newItems.has(item.id)) {
          newItems.set(item.id, {
            id: item.id,
            data: { ...item },
            isDirty: false,
            isNew: false,  // Firebase 資料一定不是新的
            syncStatus: 'idle'
          });
        }
      });
      
      return {
        ...prev,
        items: newItems
      };
    });
  }, [sourceData]);
  
  // 更新草稿
  const updateDraft = useCallback((id: string, field: string, value: any) => {
    console.log('✏️ 更新草稿:', { id, field, value });
    
    setDraftState(prev => {
      const newItems = new Map(prev.items);
      const item = newItems.get(id);
      
      if (!item) {
        console.error('找不到草稿項目:', id);
        return prev;
      }
      
      // 更新資料
      const updatedItem = {
        ...item,
        data: {
          ...item.data,
          [field]: value
        },
        isDirty: true,
        syncStatus: 'idle' as const
      };
      
      newItems.set(id, updatedItem);
      
      console.log('📝 草稿更新後狀態:', {
        id,
        isDirty: updatedItem.isDirty,
        field,
        value,
        allDirtyItems: Array.from(newItems.values()).filter(i => i.isDirty).length
      });
      
      return {
        ...prev,
        items: newItems
      };
    });
    
    // 取消之前的同步計時器
    const existingTimer = syncTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // 設定新的同步計時器
    // 使用較長的延遲以確保狀態更新完成
    const timer = setTimeout(() => {
      console.log('⏰ 計時器觸發，準備同步:', id);
      // 檢查計時器是否還在 map 中（可能已被清理）
      if (syncTimers.current.has(id)) {
        // 再次使用 setTimeout 確保狀態已經更新
        setTimeout(() => {
          syncItem(id);
        }, 0);
      } else {
        console.log('⏰ 計時器已被清理，跳過同步:', id);
      }
    }, syncDelay);
    
    syncTimers.current.set(id, timer);
  }, [syncDelay]);
  
  // 使用 ref 來存儲 onSync 函數，避免閉包問題
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;
  
  // 同步單個項目 - 重新實作以解決閉包問題
  const syncItem = useCallback(async (id: string) => {
    console.log('🔄 開始同步項目:', id);
    
    // 檢查是否已經在同步中
    if (syncingItems.current.has(id)) {
      console.log('⚠️ 項目已經在同步中，跳過:', id);
      return;
    }
    
    // 標記為正在同步
    syncingItems.current.add(id);
    
    try {
      // 獲取當前項目狀態
      const currentState = await new Promise<DraftItem | null>((resolve) => {
        setDraftState(prev => {
          const item = prev.items.get(id);
          resolve(item ? { ...item } : null);
          return prev;
        });
      });
      
      if (!currentState) {
        console.log('⚠️ 找不到項目:', id);
        return;
      }
      
      if (currentState.isDirty !== true) {
        console.log('⚠️ 項目不需要同步:', { 
          id, 
          isDirty: currentState.isDirty
        });
        return;
      }
      
      console.log('📋 開始同步項目:', {
        id,
        isDirty: currentState.isDirty,
        isNew: currentState.isNew
      });
    
    // 更新同步狀態為 syncing
    setDraftState(prev => {
      const newItems = new Map(prev.items);
      const item = newItems.get(id);
      if (item) {
        newItems.set(id, {
          ...item,
          syncStatus: 'syncing'
        });
      }
      return {
        ...prev,
        items: newItems,
        globalSyncStatus: 'syncing'
      };
    });
    
    try {
      // 執行同步
      const result = await onSyncRef.current(id, currentState.data, currentState.isNew);
      
      // 檢查是否返回了新 ID（新建項目的情況）
      const newId = result?.newId;
      
      // 同步成功
      console.log('✅ 同步成功:', id, newId ? `新 ID: ${newId}` : '');
      
      // 清除重試計數
      retryCount.current.delete(id);
      
      setDraftState(prev => {
        const newItems = new Map(prev.items);
        
        if (newId && newId !== id) {
          // 如果有新 ID，移除舊的草稿項目
          newItems.delete(id);
          console.log('🔄 移除草稿項目:', id);
          
          // 清理相關的計時器
          const timer = syncTimers.current.get(id);
          if (timer) {
            clearTimeout(timer);
            syncTimers.current.delete(id);
            console.log('🧹 清理同步計時器:', id);
          }
        } else {
          // 更新現有項目
          const item = newItems.get(id);
          if (item) {
            newItems.set(id, {
              ...item,
              isDirty: false,
              isNew: false,
              syncStatus: 'idle',
              lastSyncTime: Date.now(),
              error: undefined
            });
          }
        }
        
        // 檢查是否還有其他項目在同步
        const hasOtherSyncing = Array.from(newItems.values())
          .some(item => item.syncStatus === 'syncing');
        
        return {
          ...prev,
          items: newItems,
          globalSyncStatus: hasOtherSyncing ? 'syncing' : 'idle'
        };
      });
      
    } catch (error) {
      console.error('同步失敗:', error);
      
      // 同步失敗
      setDraftState(prev => {
        const newItems = new Map(prev.items);
        const item = newItems.get(id);
        if (item) {
          newItems.set(id, {
            ...item,
            syncStatus: 'error',
            error: error instanceof Error ? error.message : '同步失敗'
          });
        }
        
        return {
          ...prev,
          items: newItems,
          globalSyncStatus: 'error'
        };
      });
      
      // 只有在非權限錯誤的情況下才重試
      if (error instanceof Error && !error.message.includes('沒有權限')) {
        showToast('error', '同步失敗，將在稍後重試');
        // 5秒後重試，最多重試 3 次
        const currentRetries = retryCount.current.get(id) || 0;
        if (currentRetries < 3) {
          retryCount.current.set(id, currentRetries + 1);
          setTimeout(() => syncItem(id), 5000);
        } else {
          showToast('error', '同步失敗多次，請重新整理頁面');
          retryCount.current.delete(id);
        }
      } else {
        // 權限錯誤不重試
        showToast('error', '同步失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
      }
    }
    } finally {
      // 清除同步標記
      syncingItems.current.delete(id);
      console.log('🔓 清除同步標記:', id);
    }
  }, []);
  
  // 新增草稿
  const addNewDraft = useCallback((defaultData: Record<string, any> = {}) => {
    const id = `draft_${Date.now()}`;
    console.log('➕ 新增草稿:', id);
    
    setDraftState(prev => {
      const newItems = new Map(prev.items);
      newItems.set(id, {
        id,
        data: {
          id,
          ...defaultData
        },
        isDirty: true,
        isNew: true,
        syncStatus: 'idle'
      });
      
      return {
        ...prev,
        items: newItems
      };
    });
    
    return id;
  }, []);
  
  // 刪除草稿
  const deleteDraft = useCallback((id: string) => {
    console.log('🗑️ 刪除草稿:', id);
    
    // 取消同步計時器
    const timer = syncTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      syncTimers.current.delete(id);
    }
    
    setDraftState(prev => {
      const newItems = new Map(prev.items);
      newItems.delete(id);
      return {
        ...prev,
        items: newItems
      };
    });
  }, []);
  
  // 同步所有草稿
  const syncAll = useCallback(async () => {
    console.log('🔄 同步所有草稿');
    
    // 獲取最新的狀態
    let itemsToSync: DraftItem[] = [];
    setDraftState(prev => {
      itemsToSync = Array.from(prev.items.values())
        .filter(item => item.isDirty);
      return prev;
    });
    
    if (itemsToSync.length === 0) {
      showToast('info', '沒有需要同步的變更');
      return;
    }
    
    console.log('📋 準備同步的項目:', itemsToSync.map(item => ({
      id: item.id,
      isDirty: item.isDirty,
      isNew: item.isNew
    })));
    
    for (const item of itemsToSync) {
      await syncItem(item.id);
    }
  }, []);
  
  // 取得特定項目的同步狀態
  const getSyncStatus = useCallback((id: string) => {
    const item = draftState.items.get(id);
    return item?.syncStatus || 'idle';
  }, [draftState.items]);
  
  // 獲取所有未同步的草稿
  const getUnsyncedDrafts = useCallback(() => {
    const allItems = Array.from(draftState.items.values());
    const unsyncedItems = allItems.filter(item => item.isDirty);
    
    console.log('🔍 getUnsyncedDrafts 被呼叫:', {
      總項目數: allItems.length,
      未同步數: unsyncedItems.length,
      詳細資料: unsyncedItems.map(item => ({
        id: item.id,
        isDirty: item.isDirty,
        isNew: item.isNew,
        syncStatus: item.syncStatus
      }))
    });
    
    return unsyncedItems;
  }, [draftState.items]);
  
  // 檢查是否有必填欄位未填
  const hasRequiredFieldsEmpty = useCallback((item: DraftItem, requiredFields: string[]) => {
    return requiredFields.some(field => !item.data[field] || item.data[field] === '');
  }, []);
  
  // 計算衍生狀態
  const draftData = Array.from(draftState.items.values())
    .map(item => ({
      ...item.data,
      _syncStatus: item.syncStatus,
      _isDraft: item.isNew
    }))
    .sort((a, b) => {
      // 新建的草稿排在最後
      if (a._isDraft && !b._isDraft) return 1;
      if (!a._isDraft && b._isDraft) return -1;
      return 0;
    });
  
  const hasUnsavedChanges = Array.from(draftState.items.values())
    .some(item => item.isDirty);
  
  const getUnsavedCount = () => {
    return Array.from(draftState.items.values())
      .filter(item => item.isDirty).length;
  };
  
  return {
    draftData,
    updateDraft,
    addNewDraft,
    deleteDraft,
    syncStatus: draftState.globalSyncStatus,
    syncAll,
    syncItem,
    getSyncStatus,
    hasUnsavedChanges,
    getUnsavedCount,
    getUnsyncedDrafts,
    hasRequiredFieldsEmpty
  };
}