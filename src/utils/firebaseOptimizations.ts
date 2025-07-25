/**
 * Firebase 效能優化工具
 * 處理 WebChannel 連接問題和效能優化
 */

import { FirebaseError } from 'firebase/app';
import { enableNetwork, disableNetwork, getFirestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

// 連接狀態管理
let isOnline = true;
let reconnectTimer: NodeJS.Timeout | null = null;
let errorCount = 0;
const MAX_ERROR_COUNT = 3;
const RECONNECT_DELAY = 5000; // 5 秒

/**
 * 處理 Firestore 連接錯誤
 */
export function handleFirestoreError(error: any) {
  // 檢查是否為 WebChannel 錯誤
  if (error?.message?.includes('WebChannelConnection') || 
      error?.code === 'unavailable' ||
      error?.code === 'failed-precondition') {
    
    errorCount++;
    console.warn(`⚠️ Firestore 連接錯誤 (${errorCount}/${MAX_ERROR_COUNT}):`, error.message);
    
    // 如果錯誤次數過多，暫時斷開連接
    if (errorCount >= MAX_ERROR_COUNT && isOnline) {
      console.log('🔌 暫時斷開 Firestore 連接以避免過多重試...');
      disconnectFirestore();
      
      // 設定重連計時器
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          console.log('🔄 嘗試重新連接 Firestore...');
          reconnectFirestore();
          reconnectTimer = null;
        }, RECONNECT_DELAY);
      }
    }
  }
}

/**
 * 斷開 Firestore 連接
 */
export async function disconnectFirestore() {
  if (!isOnline) return;
  
  try {
    const db = getFirebaseDb();
    await disableNetwork(db);
    isOnline = false;
    console.log('✅ Firestore 已斷開連接');
  } catch (error) {
    console.error('斷開 Firestore 失敗:', error);
  }
}

/**
 * 重新連接 Firestore
 */
export async function reconnectFirestore() {
  if (isOnline) return;
  
  try {
    const db = getFirebaseDb();
    await enableNetwork(db);
    isOnline = true;
    errorCount = 0; // 重置錯誤計數
    console.log('✅ Firestore 已重新連接');
  } catch (error) {
    console.error('重新連接 Firestore 失敗:', error);
    // 如果重連失敗，稍後再試
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectFirestore();
        reconnectTimer = null;
      }, RECONNECT_DELAY * 2);
    }
  }
}

/**
 * 優化的訂閱包裝器
 * 自動處理錯誤和重連
 */
export function createOptimizedSubscription<T>(
  subscribeFunction: () => (() => void) | undefined,
  errorHandler?: (error: Error) => void
): () => void {
  let unsubscribe: (() => void) | undefined;
  let isSubscribed = true;
  
  const subscribe = () => {
    try {
      unsubscribe = subscribeFunction();
    } catch (error) {
      console.error('訂閱失敗:', error);
      handleFirestoreError(error);
      if (errorHandler) {
        errorHandler(error as Error);
      }
    }
  };
  
  // 初始訂閱
  subscribe();
  
  // 監聽線上狀態變化
  const handleOnline = () => {
    if (isSubscribed && !unsubscribe) {
      console.log('🌐 網路已恢復，重新訂閱...');
      subscribe();
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // 返回清理函數
  return () => {
    isSubscribed = false;
    window.removeEventListener('online', handleOnline);
    if (unsubscribe) {
      unsubscribe();
    }
    // 清理重連計時器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
}

/**
 * 批量取消訂閱
 * 用於組件卸載時清理所有訂閱
 */
export function batchUnsubscribe(unsubscribes: (() => void)[]) {
  unsubscribes.forEach(unsubscribe => {
    try {
      unsubscribe();
    } catch (error) {
      console.warn('取消訂閱時發生錯誤:', error);
    }
  });
}

/**
 * 設定 Firestore 效能設定
 */
export function setupFirestoreOptimizations() {
  // 監聽全域錯誤
  if (typeof window !== 'undefined') {
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const message = args[0]?.toString() || '';
      if (message.includes('WebChannelConnection')) {
        handleFirestoreError({ message });
      }
      originalConsoleWarn.apply(console, args);
    };
  }
  
  // 監聽網路狀態
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', () => {
      console.log('📵 偵測到離線狀態');
      disconnectFirestore();
    });
    
    window.addEventListener('online', () => {
      console.log('📶 偵測到線上狀態');
      reconnectFirestore();
    });
  }
  
  console.log('🚀 Firestore 優化設定已啟用');
}